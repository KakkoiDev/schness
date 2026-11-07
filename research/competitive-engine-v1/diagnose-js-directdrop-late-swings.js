/** Selected early JS losses, not a strength holdout or exact mate proof. */
import {readFile,readdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {analyzeAction} from '../../src/bot.js';
import * as rules from '../../src/rules.js';
const cases=[],results=[],gameHashes={};
for(const variant of ['directdrop']){
 const root='output/local-experiments/js-directdrop-r1-fairy-screen-2026-10-28';
 const manifest=JSON.parse(await readFile(root+'/manifest.json'));
 for(const file of (await readdir(root+'/games')).sort()){
  const raw=await readFile(root+'/games/'+file);gameHashes[file]=createHash('sha256').update(raw).digest('hex');const game=JSON.parse(raw);if(!game.result.winner||game.result.winner===game.task.color)continue;
  let p=rules.createInitialPosition(manifest.rules);const decisions=[];
  for(let ply=0;ply<game.transcript.length;ply++){
   const e=game.transcript[ply];if(e.engine==='candidate')decisions.push({ply,position:p,playedAction:e.action,playedScore:e.score,playedDepth:e.completedDepth});p=rules.applyAction(p,e.action);
  }
  const early=decisions.slice(12);let at=early.findIndex((e,i)=>i>0&&Number.isFinite(e.playedScore)&&Number.isFinite(early[i-1].playedScore)&&e.playedScore<=-300&&early[i-1].playedScore>=-100);
  let selection='decision before first early >=-100 to <=-300 observed crossing';
  if(at<0){at=early.findIndex((e,i)=>i>0&&Number.isFinite(e.playedScore)&&Number.isFinite(early[i-1].playedScore)&&early[i-1].playedScore-e.playedScore>=300);selection='decision before first early >=300 observed drop';}
  if(at<0)continue;
  const c=early[at-1];if(c)cases.push({variant,id:game.task.id,sourceFingerprint:manifest.sourceFingerprint,selection,...c,trajectory:early.map(e=>({ply:e.ply,score:e.playedScore,depth:e.playedDepth}))});
 }
}
const options={profile:'competitive',depth:6,iterativeDeepening:true,quiescenceDepth:4,quiescenceChecks:true,quiescenceEvasionDepth:2,lateMoveReduction:false,cacheEvaluation:true,stopOnProvenWin:false,repetitionAversion:true,maxNodes:100000,maxMillis:500};
for(const c of cases){
 const best=analyzeAction(c.position,options),child=rules.applyAction(c.position,c.playedAction),forced=analyzeAction(child,{...options,depth:5});
 const comparable=best.completedDepth===6&&(forced.completedDepth===5||rules.getResult(child)!==null);
 const playedScore=forced.score===null?null:forced.score*(child.turn===c.position.turn?1:-1);
 for(const [p,r] of [[c.position,best],[child,forced]]){let next=p;for(const action of r.pv)next=rules.applyAction(next,action);}
 results.push({variant:c.variant,id:c.id,best,forced,comparable,playedScore,gap:comparable?best.score-playedScore:null});
}
const hashes={};for(const path of ['src/search.js','src/bot.js','src/rules.js','src/exchange.js'])hashes[path]=createHash('sha256').update(await readFile(path)).digest('hex');
const summary={cases:cases.length,completePairs:results.filter(r=>r.comparable).length,incompletePairs:results.filter(r=>!r.comparable).length,largeGaps:results.filter(r=>r.comparable&&r.gap>=200).map(r=>({variant:r.variant,id:r.id,gap:r.gap,best:r.best.action}))};
await writeFile('research/competitive-engine-v1/js-directdrop-late-swings.json',JSON.stringify({purpose:'ALL28 losses in completed directdrop screen; select at most one decision after first12 candidate decisions per loss using observed score swings. Different played depths confound trajectories. Nonreduced fixed depth6 best vsdepth5 forced child, each100000nodes/500ms; exclude incomplete pairs. Selected correlated diagnostics, not strength/holdout/proof.',options,hashes,gameHashes,scriptSha256:createHash('sha256').update(await readFile(new URL(import.meta.url))).digest('hex'),summary,cases,results},null,2)+'\n');
console.log(JSON.stringify(summary));
