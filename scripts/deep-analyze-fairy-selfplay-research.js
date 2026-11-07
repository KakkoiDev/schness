/** No wall-clock cap. Full-window scores for every legal root action at each completed depth. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const out=resolve(process.argv[2]), source=out+'/analysis/instrumented', deep=out+'/deep-analysis';
const read=p=>readFile(p),json=async p=>JSON.parse(await read(p));
const sha=b=>createHash('sha256').update(b).digest('hex');
const atomic=async(p,x)=>{await writeFile(p+'.tmp',JSON.stringify(x)+'\n');await rename(p+'.tmp',p);};
const m=await json(out+'/manifest.json'),gp=await json(out+'/progress.json'),ap=await json(out+'/analysis/progress.json'),am=await json(out+'/analysis/manifest.json');
assert.equal(gp.status,'completed');assert.equal(ap.status,'completed');
assert.equal(gp.completed,m.tasks.length);assert.equal(ap.games,m.tasks.length);
assert.equal(am.sourceFingerprint,m.sourceFingerprint);
for(const f of m.files)assert.equal(sha(await read(out+'/runtime/'+f.path)),f.sha256,f.path);
const options={...am.normal,depth:6,maxMillis:Infinity,maxNodes:262144,multiPv:2,lateMoveReduction:false,iterativeDeepening:true,repetitionAversion:false,aspiration:false,stopOnProvenWin:false};
await mkdir(deep,{recursive:true});
const sourceHashes={};
for(const n of ['bot','rules','board-masks','exchange','search'])sourceHashes[n+'.js']=sha(await read(source+'/'+n+'.js'));
const plan={schema:1,sourceFingerprint:m.sourceFingerprint,sourceHashes,gameFiles:am.gameFiles,options:{...options,maxMillis:'Infinity'},purpose:'Exact full-root windows at each fully completed nonselective depth, with normal quiescence. Node cap is shared across iterations. Scores are finite-horizon Schness outputs, not game-theoretic truth or cross-engine scores. Recorded explored branches are root moves with their PV, nodes and result; this is not an interior node dump.'};
await atomic(deep+'/manifest.json',plan);
const r=await import(pathToFileURL(out+'/runtime/src/rules.js').href),{analyzeAction}=await import(pathToFileURL(source+'/bot.js').href),key=r.actionKey;
const totals={status:'running',games:0,plies:0,atTarget:0,nodeCapped:0,deepOptimal:0,deepOutsideTop3:0,deepPrefersFairy:0,deepPrefersBench:0,equalFairyBench:0,benchAgreement:0,scoredBranches:0,depths:{},byMoveType:{},groups:{}};
for(const [i,t] of m.tasks.entries()){
 const gameBytes=await read(out+'/games/'+t.id+'.json'),game=JSON.parse(gameBytes),bench=await json(out+'/analysis/'+t.id+'.json');
 assert.equal(am.gameFiles[i].sha256,sha(gameBytes));assert.equal(bench.sourceSha256,sha(gameBytes));assert.equal(game.task.id,t.id);
 const group={plies:0,atTarget:0,nodeCapped:0,deepOptimal:0,deepPrefersFairy:0,deepPrefersBench:0,benchAgreement:0};
 let p=r.createInitialPosition(m.rules);
 const rows=[];
 for(const [ply,e] of game.transcript.entries()){
  assert.equal(e.mover,p.turn);
  if(ply>=2){
   const b=bench.rows[ply-2];assert.equal(b.ply,ply);assert.equal(b.positionKey,r.positionKey(p));assert.deepEqual(b.fairyMove,e.action);
   const legal=r.legalActions(p).map(key).sort(),snapshot=JSON.stringify(p),events=[],iterations=[],t0=performance.now();
   const result=analyzeAction(p,{...options,rootTrace:x=>events.push(x),onIteration:x=>iterations.push(x)});
   const ms=performance.now()-t0;
   const fairy=key(e.action),js=key(b.js.action),horizons=[];
   for(const it of iterations){
    const branches=events.filter(x=>x.kind==='finish'&&x.depth===it.depth);
    assert.deepEqual(branches.map(x=>key(x.action)).sort(),legal);
    assert(branches.every(x=>x.bound==='inside-window'));
    const max=Math.max(...branches.map(x=>x.score));assert.equal(max,it.score);
    const f=branches.find(x=>key(x.action)===fairy),j=branches.find(x=>key(x.action)===js);
    horizons.push({depth:it.depth,fairyRank:1+branches.filter(x=>x.score>f.score).length,fairyScore:f.score,benchScore:j.score,bestScore:max,ties:branches.filter(x=>x.score===f.score).length});
   }
   const last=horizons.at(-1);assert(last);assert.equal(last.depth,result.completedDepth);assert(result.nodes<=options.maxNodes);
   if(result.stopped)assert.equal(result.nodes,options.maxNodes);
   assert.equal(JSON.stringify(p),snapshot);
   const legalPV=pv=>{let q=p;for(const a of pv)q=r.applyAction(q,a);};
   legalPV(result.pv);
   for(const x of events)if(x.kind==='finish')legalPV(x.pv);
   const type=totals.byMoveType[b.type]??={plies:0,optimal:0,prefersFairy:0,prefersBench:0,agrees:0};
   type.plies++;group.plies++;totals.plies++;
   if(b.same){totals.benchAgreement++;group.benchAgreement++;type.agrees++;}
   if(last.fairyRank===1){totals.deepOptimal++;group.deepOptimal++;type.optimal++;}
   if(last.fairyRank>3)totals.deepOutsideTop3++;
   if(last.fairyScore>last.benchScore){totals.deepPrefersFairy++;group.deepPrefersFairy++;type.prefersFairy++;}
   else if(last.fairyScore<last.benchScore){totals.deepPrefersBench++;group.deepPrefersBench++;type.prefersBench++;}
   else totals.equalFairyBench++;
   if(result.stopped){totals.nodeCapped++;group.nodeCapped++;}
   if(last.depth===options.depth){totals.atTarget++;group.atTarget++;}
   totals.depths[last.depth]=(totals.depths[last.depth]??0)+1;
   totals.scoredBranches+=events.filter(x=>x.kind==='finish').length;
   rows.push({ply,mover:p.turn,positionKey:b.positionKey,fairyMove:e.action,benchMove:b.js.action,type:b.type,elapsedMs:ms,result,iterations,events,horizons});
  }
  p=r.applyAction(p,e.action);assert.equal(r.positionKey(p),e.resultingKey);
 }
 assert.deepEqual(p,game.finalPosition);assert.equal(rows.length,bench.rows.length);
 await atomic(deep+'/'+t.id+'.json',{game:t.id,sourceSha256:sha(gameBytes),rows});
 totals.games++;totals.groups[t.id]=group;
 await atomic(deep+'/progress.json',totals);console.log(JSON.stringify({game:t.id,...group}));
}
assert.equal(totals.plies,ap.plies);totals.status='completed';
await atomic(deep+'/progress.json',totals);console.log(JSON.stringify(totals));
