/** Work-cost ablation on saved Black-loss positions; not a strength benchmark. */
import {readFile,writeFile}from'node:fs/promises';
import {createHash}from'node:crypto';
import {performance}from'node:perf_hooks';
import {analyzeAction}from'../../src/bot.js';
import * as r from'../../src/rules.js';
const root='output/local-experiments/competitive-r3-fairy-screen-2026-10-26';
const ids=[1,10,11,14],cases=[];
for(const id of ids){
 const g=JSON.parse(await readFile(`${root}/games/black__20261801__${id}.json`));let p=r.createInitialPosition({allowCheckingDrops:false,experiment:'capture-bank',bankCapacity:6});
 for(const e of g.transcript){if(e.engine==='candidate')break;p=r.applyAction(p,e.action);}
 cases.push({id:g.task.id,position:p});
}
const files=[];for(const path of ['src/search.js','src/bot.js','src/rules.js','src/board-masks.js'])files.push({path,sha256:createHash('sha256').update(await readFile(path)).digest('hex')});
const results=[];
for(const entry of cases)for(const reduceQuietDrops of [false,true]){
 const options={profile:'competitive',depth:6,quiescenceDepth:2,quiescenceChecks:true,lateMoveReduction:true,reduceQuietDrops,iterativeDeepening:true,maxMillis:15000};
 const t=performance.now(),a=analyzeAction(entry.position,options);let p=entry.position;for(const move of a.pv)p=r.applyAction(p,move);
 results.push({id:entry.id,reduceQuietDrops,millis:performance.now()-t,requestedDepth:6,completedDepth:a.completedDepth,stopped:a.stopped,nodes:a.nodes,score:a.score,action:a.action,pv:a.pv,stats:a.stats});
}
const result={createdAt:new Date().toISOString(),purpose:'Fixed-horizon selective work-cost ablation on four saved Black-loss opening positions. Positions are selected, not a holdout. No strength conclusion. Concurrent uncapped probe affects elapsed times. Scores may differ because reductions are selective.',files,cases,results};
await writeFile('research/competitive-engine-v1/drop-reduction-ablation.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(results.map(({id,reduceQuietDrops,millis,completedDepth,nodes,score,stopped})=>({id,reduceQuietDrops,millis,completedDepth,nodes,score,stopped}))));
