/** Selected lost positions diagnose search boundaries; not a strength holdout. */
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {analyzeAction} from '../../src/bot.js';
import * as r from '../../src/rules.js';
const root='output/local-experiments/competitive-r6-fairy-screen-2026-10-27';
const cases=[],results=[];
for(const file of (await readdir(`${root}/games`)).sort()){
 const g=JSON.parse(await readFile(`${root}/games/${file}`));
 if(g.result.type!=='win'||g.result.winner===g.task.color)continue;
 const candidates=[];
 let p=r.createInitialPosition({allowCheckingDrops:false,experiment:'capture-bank',bankCapacity:6});
 for(let i=0;i<g.transcript.length;i++){
  const e=g.transcript[i];
  if(e.engine==='candidate'){
   if(e.score<=-1_000_000){const earlier=candidates.at(-2);if(earlier)cases.push({...earlier,id:g.task.id,firstMatePly:i});break;}
   candidates.push({ply:i,position:p,playedAction:e.action,playedScore:e.score,playedDepth:e.completedDepth});
  }
  p=r.applyAction(p,e.action);
 }
}
for(const entry of cases)for(const lateMoveReduction of [false,true]){
 const options={profile:'competitive',depth:7,quiescenceDepth:4,quiescenceChecks:true,quiescenceEvasionDepth:2,cacheEvaluation:true,lateMoveReduction,iterativeDeepening:false,maxNodes:100000,maxMillis:3000};
 const saved=JSON.stringify(entry.position),start=performance.now(),a=analyzeAction(entry.position,options);
 if(JSON.stringify(entry.position)!==saved)throw Error('Input changed');
 let pv=entry.position;for(const move of a.pv)pv=r.applyAction(pv,move);
 results.push({id:entry.id,options,millis:performance.now()-start,...a});
}
const files=[];for(const path of ['src/search.js','src/bot.js','src/rules.js'])files.push({path,sha256:createHash('sha256').update(await readFile(path)).digest('hex')});
await writeFile('research/competitive-engine-v1/r6-earlier-reduction-ablation.json',JSON.stringify({createdAt:new Date().toISOString(),purpose:'Selected positions two candidate decisions before the first detected losing-mate score from all r6 losses. Diagnostic, not strength evidence. Fixed nominal depth7/q4/evasion2, LMR off/on, explicit100000nodes/3000ms safety cap. Only completed pairs comparable; selective scores may differ; this diagnoses possible horizon errors. Timings have concurrent probe contention.',files,cases,results},null,2)+'\n');
console.log(JSON.stringify(results.map(({id,options,nodes,score,completedDepth,stopped})=>({id,lateMoveReduction:options.lateMoveReduction,nodes,score,completedDepth,stopped}))));
