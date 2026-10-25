import {readFile,writeFile} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {chooseAction as old} from '../research/engine-regression-v1/baseline/bot.js';
import {analyzeAction as current} from '../src/bot.js';
import {applyAction,legalActions,actionKey} from '../src/rules.js';
const corpus=JSON.parse(await readFile('research/search-performance-v2/positions.json'));
const variants={v2d4:p=>({action:old(p,{depth:4,repetitionAversion:true})}),v7d4:p=>current(p,{depth:4,repetitionAversion:true}),v7d5:p=>current(p,{depth:5,repetitionAversion:true}),v7d6:p=>current(p,{depth:6,repetitionAversion:true})};
for(const fn of Object.values(variants))for(const p of corpus.slice(0,2))fn(p.position);
const runs=[];
for(let repeat=0;repeat<3;repeat++){
 const rows=[];for(const item of corpus){const row={id:item.id};for(const name of repeat%2?Object.keys(variants).reverse():Object.keys(variants)){
  const start=performance.now(),result=variants[name](item.position),millis=performance.now()-start;assert(legalActions(item.position).some(a=>actionKey(a)===actionKey(result.action)));for(const line of result.variations??[]){let p=item.position;for(const a of line.pv)p=applyAction(p,a);}row[name]={millis,...result};
 }rows.push(row);}runs.push(rows);console.log('Completed repetition '+(repeat+1));
}
const summary={};for(const name of Object.keys(variants)){
 const totals=runs.map(rows=>rows.reduce((s,r)=>s+r[name].millis,0)).sort((a,b)=>a-b),times=runs.flatMap(rows=>rows.map(r=>r[name].millis)).sort((a,b)=>a-b);
 summary[name]={medianPassMillis:totals[1],meanPerPositionMillis:totals[1]/corpus.length,medianPerPositionMillis:times[Math.floor(times.length/2)],p95Millis:times[Math.floor(times.length*.95)],passMillis:totals};
}
const timeMatched=[];
for(let i=0;i<corpus.length;i++){
 const ts=runs.map(rows=>rows[i].v2d4.millis).sort((a,b)=>a-b),budgetMillis=ts[1],start=performance.now();
 const result=current(corpus[i].position,{depth:100,maxMillis:budgetMillis,repetitionAversion:true});
 assert(legalActions(corpus[i].position).some(a=>actionKey(a)===actionKey(result.action)));
 for(const line of result.variations){let p=corpus[i].position;for(const a of line.pv)p=applyAction(p,a);}
 timeMatched.push({id:corpus[i].id,budgetMillis,millis:performance.now()-start,...result});
}
summary.timeMatched={searches:timeMatched.length,meanBudgetMillis:timeMatched.reduce((s,x)=>s+x.budgetMillis,0)/timeMatched.length,meanMillis:timeMatched.reduce((s,x)=>s+x.millis,0)/timeMatched.length,meanCompletedDepth:timeMatched.reduce((s,x)=>s+x.completedDepth,0)/timeMatched.length,depthCounts:Object.fromEntries([...new Set(timeMatched.map(x=>x.completedDepth))].sort((a,b)=>a-b).map(d=>[d,timeMatched.filter(x=>x.completedDepth===d).length]))};
const sources={};for(const p of ['src/bot.js','src/search.js','src/rules.js','src/board-masks.js','research/engine-regression-v1/baseline/bot.js','research/engine-regression-v1/baseline/rules.js','research/search-performance-v2/positions.json','scripts/bench-depth-calibration.js'])sources[p]=createHash('sha256').update(await readFile(p)).digest('hex');
await writeFile('research/depth-calibration-v1/results.json',JSON.stringify({description:'Serial warmed Classic same-position depth calibration. Three repeats, 32 saved positions. No time/node caps, extensions or reductions. Each depth is searched directly, without iterative deepening.',sources,runs,timeMatched,summary},null,2)+'\n');await writeFile('research/depth-calibration-v1/summary.json',JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary,null,2));
