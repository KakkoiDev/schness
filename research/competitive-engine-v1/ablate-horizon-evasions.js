/** Selected lost positions diagnose search boundaries; not a strength holdout. */
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {analyzeAction} from '../../src/bot.js';
import * as r from '../../src/rules.js';
const root='output/local-experiments/competitive-r4-fairy-screen-2026-10-26';
const cases=[],results=[];
for(const file of (await readdir(`${root}/games`)).sort()){
 const g=JSON.parse(await readFile(`${root}/games/${file}`));
 if(g.result.type!=='win'||g.result.winner===g.task.color)continue;
 let p=r.createInitialPosition({allowCheckingDrops:false,experiment:'capture-bank',bankCapacity:6});
 for(let i=0;i<g.transcript.length;i++){
  const e=g.transcript[i];
  if(e.engine==='candidate'&&e.score<=-1_000_000){cases.push({id:g.task.id,ply:i,position:p});break;}
  p=r.applyAction(p,e.action);
 }
}
for(const entry of cases)for(const quiescenceEvasionDepth of [0,2]){
 const options={profile:'competitive',depth:4,quiescenceDepth:2,quiescenceChecks:true,quiescenceEvasionDepth,lateMoveReduction:false,iterativeDeepening:false,maxNodes:100000,maxMillis:5000};
 const saved=JSON.stringify(entry.position),start=performance.now(),a=analyzeAction(entry.position,options);
 if(JSON.stringify(entry.position)!==saved)throw Error('Input changed');
 let pv=entry.position;for(const move of a.pv)pv=r.applyAction(pv,move);
 results.push({id:entry.id,options,millis:performance.now()-start,...a});
}
const files=[];for(const path of ['src/search.js','src/bot.js','src/rules.js'])files.push({path,sha256:createHash('sha256').update(await readFile(path)).digest('hex')});
await writeFile('research/competitive-engine-v1/horizon-evasion-ablation.json',JSON.stringify({createdAt:new Date().toISOString(),purpose:'Selected first detected losing-mate positions from all r4 losses. Diagnostic, not independent strength evidence. Fixed nominal depth4/q2, no LMR, explicit100000nodes/5000ms safety cap; only completed results comparable. Evasion allowance remains bounded and is not a mate proof.',files,cases,results},null,2)+'\n');
console.log(JSON.stringify(results.map(({id,options,nodes,score,completedDepth,stopped})=>({id,evasions:options.quiescenceEvasionDepth,nodes,score,completedDepth,stopped}))));
