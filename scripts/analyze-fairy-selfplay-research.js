/** Replay frozen Fairy self-play only after the entire game schedule is complete. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile,rename,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const out=resolve(process.argv[2]),runtime=out+'/runtime';
const json=async p=>JSON.parse(await readFile(p));
const sha=b=>createHash('sha256').update(b).digest('hex');
const manifest=await json(out+'/manifest.json'),progress=await json(out+'/progress.json');
assert.equal(progress.status,'completed');assert.equal(progress.completed,manifest.tasks.length);
const files=[];
for(const f of manifest.files)assert.equal(sha(await readFile(runtime+'/'+f.path)),f.sha256,f.path);
assert.equal(sha(JSON.stringify(manifest.files)),manifest.sourceFingerprint);
const bundle=(await readFile(out+'/bundles/fairy-selfplay.jsonl','utf8')).trim().split('\n').map(JSON.parse);
assert.equal(bundle.length,manifest.tasks.length);
for(const [i,t] of manifest.tasks.entries()){
 const bytes=await readFile(out+'/games/'+t.id+'.json');
 files.push({game:t.id,sha256:sha(bytes)});
 assert.deepEqual(JSON.parse(bytes),bundle[i]);
}
const analysis=out+'/analysis';await mkdir(analysis,{recursive:true});
const source=analysis+'/instrumented';await mkdir(source,{recursive:true});
for(const n of ['bot','rules','board-masks','exchange','search'])await copyFile(runtime+'/src/'+n+'.js',source+'/'+n+'.js');
await writeFile(source+'/package.json','{"type":"module"}\n');
const sp=source+'/search.js';
let code=await readFile(sp,'utf8');
function edit(a,b){assert.equal(code.split(a).length,2,a);code=code.replace(a,b);}
edit('const iteration=(lower,upper)=>{','const iteration=(lower,upper)=>{\n        const trace=options.rootTrace;trace?.({kind:"pass",depth,lower,upper});');
edit('const {rep,child}=withChild(position,action,ctx,next=>{','const nodesBefore=ctx.nodes;\n          trace?.({kind:"start",depth,action,nodesBefore});\n          const {rep,child,alphaUsed,betaUsed}=withChild(position,action,ctx,next=>{');
edit('let child=visit(next,depth-1,alpha,probe?Math.min(upper,alpha+adapter.scoreStep):upper,player,ctx);','let alphaUsed=alpha,betaUsed=probe?Math.min(upper,alpha+adapter.scoreStep):upper;\n            let child=visit(next,depth-1,alphaUsed,betaUsed,player,ctx);');
edit('ctx.pvsResearches++;\n              child=visit','ctx.pvsResearches++;betaUsed=upper;\n              child=visit');
edit('ctx.rootResearches++;\n              child=visit','ctx.rootResearches++;alphaUsed=-Infinity;betaUsed=Infinity;\n              child=visit');
edit('return {rep,child};','return {rep,child,alphaUsed,betaUsed};');
edit('const line={action,score:child.value,pv};','const line={action,score:child.value,pv};\n          trace?.({kind:"finish",depth,action,pv,score:child.value,nodes:ctx.nodes-nodesBefore,bound:child.value<=alphaUsed?"upper":child.value>=betaUsed?"lower":"inside-window"});');
await writeFile(sp,code);
const importFile=p=>import(pathToFileURL(p).href);
const r=await importFile(runtime+'/src/rules.js'),{analyzeAction}=await importFile(source+'/bot.js');
const {depthRequest,...settings}=manifest.candidate;
const normal={...settings,depth:depthRequest,maxMillis:100};
const atomic=async(p,x)=>{await writeFile(p+'.tmp',JSON.stringify(x,null,2)+'\n');await rename(p+'.tmp',p);};
const kind=(p,a)=>a.type==='drop'?'drop':p.board[a.to]?'capture':'quiet';
const key=r.actionKey;
const plan={schema:1,phase:'analysis',node:process.version,sourceFingerprint:manifest.sourceFingerprint,gameFiles:files,normal,comparison:{multiPv:2,lateMoveReduction:false,iterativeDeepening:false,repetitionAversion:false,aspiration:false,stopOnProvenWin:false,maxMillis:100},notes:'Normal search logs every root branch attempted per iteration, including interrupted attempts. Full-window pass at the same completed depth scores all legal root actions only if it finishes. Interior work is summarized as nodes and PV, not a full node dump. Node wall clock differs from the browser match. Fairys played move is an observation, not a best-move oracle. Scores are Schness-only and are not cross-engine calibrated.'};
await atomic(analysis+'/manifest.json',plan);
const totals={games:0,plies:0,agree:0,fullComparable:0,fairyOptimal:0,fairyOutsideTop3:0,noCompletedDepth:0,byMoveType:{},results:{},groups:{}};
const checkPV=(p,pv)=>{for(const move of pv)p=r.applyAction(p,move);};
for(const [i,g] of bundle.entries()){
 const t=manifest.tasks[i];assert.equal(g.task.id,t.id);assert.equal(g.sourceFingerprint,manifest.sourceFingerprint);
 assert.equal(g.plies,g.transcript.length);
 let p=r.createInitialPosition(manifest.rules);const rows=[];
 const group={plies:0,agree:0,fullComparable:0,fairyOptimal:0,fairyOutsideTop3:0};
 for(const [ply,e] of g.transcript.entries()){
  assert.equal(e.mover,p.turn);
  if(ply<2)assert.deepEqual(e.action,{type:'place-king',to:ply===0?12+t.index%4:Math.floor(t.index/4)});
  else{
   const snapshot=JSON.stringify(p),legal=r.legalActions(p),fairy=key(e.action);
   assert.equal(e.engine,'fairy');assert(legal.some(a=>key(a)===fairy));
   const events=[],iterations=[],start=performance.now();
   const js=analyzeAction(p,{...normal,rootTrace:x=>events.push(x),onIteration:x=>iterations.push(x)});
   const jsMillis=performance.now()-start;
   checkPV(p,js.pv);
   const same=key(js.action)===fairy;
   const type=kind(p,e.action),jtype=kind(p,js.action);
   const typeCount=totals.byMoveType[type]??={moves:0,agree:0,fullComparable:0,fairyOptimal:0};
   typeCount.moves++;if(same)typeCount.agree++;
   const exactEvents=[];
   let exact=null,ranking=null,exactMillis=null;
   if(js.completedDepth){
    const ts=performance.now();
    exact=analyzeAction(p,{...normal,...plan.comparison,depth:js.completedDepth,rootTrace:x=>exactEvents.push(x)});
    exactMillis=performance.now()-ts;checkPV(p,exact.pv);
    if(!exact.stopped&&exact.completedDepth===js.completedDepth){
     const branches=exactEvents.filter(x=>x.kind==='finish'&&x.depth===js.completedDepth);
     assert.deepEqual(branches.map(x=>key(x.action)).sort(),legal.map(key).sort());
     for(const branch of branches){assert.equal(branch.bound,'inside-window');checkPV(p,branch.pv);}
     const f=branches.find(x=>key(x.action)===fairy),j=branches.find(x=>key(x.action)===key(js.action)),best=Math.max(...branches.map(x=>x.score));
     ranking={rank:1+branches.filter(x=>x.score>f.score).length,fairyScore:f.score,normalChoiceScore:j.score,bestScore:best,gapToBest:best-f.score,ties:branches.filter(x=>x.score===f.score).length};
     totals.fullComparable++;group.fullComparable++;typeCount.fullComparable++;
     if(!ranking.gapToBest){totals.fairyOptimal++;group.fairyOptimal++;typeCount.fairyOptimal++;}
     if(ranking.rank>3){totals.fairyOutsideTop3++;group.fairyOutsideTop3++;}
    }
   }else totals.noCompletedDepth++;
   assert.equal(JSON.stringify(p),snapshot);
   totals.plies++;group.plies++;if(same){totals.agree++;group.agree++;}
   rows.push({ply,mover:p.turn,positionKey:r.positionKey(p),fairyMove:e.action,fairyUci:e.uciMove,type,legal,js,jsMillis,jsMoveType:jtype,same,iterations,events,exact,exactMillis,exactEvents,ranking});
  }
  p=r.applyAction(p,e.action);assert.equal(r.positionKey(p),e.resultingKey);
 }
 assert.deepEqual(p,g.finalPosition);assert.deepEqual(r.getResult(p)??{type:'draw',reason:'ply-limit'},g.result);
 if(!r.getResult(p))assert.equal(g.plies,manifest.maxPlies);
 totals.games++;totals.groups[t.id]=group;
 const reason=g.result.winner??g.result.reason;totals.results[reason]=(totals.results[reason]??0)+1;
 await atomic(analysis+'/'+t.id+'.json',{game:t.id,sourceSha256:files[i].sha256,result:g.result,group,rows});
 await atomic(analysis+'/progress.json',{status:'running',...totals});
 console.log(JSON.stringify({game:t.id,...group}));
}
assert.equal(totals.plies,bundle.reduce((n,g)=>n+g.plies-2,0));
await atomic(analysis+'/progress.json',{status:'completed',...totals});
console.log(JSON.stringify(totals));
