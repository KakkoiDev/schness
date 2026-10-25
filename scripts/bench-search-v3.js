import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import assert from 'node:assert/strict';
import {analyzeAction as baseline} from '../research/search-performance-v3/baseline-bot.js';
import {analyzeAction as candidate} from '../src/bot.js';
import {applyAction,legalActions,actionKey} from '../src/rules.js';
const root='research/search-performance-v3/';
const corpus=JSON.parse(await readFile('research/search-performance-v2/positions.json'));
for(const fn of [baseline,candidate])for(const item of corpus.slice(0,4))fn(item.position,{depth:3});
const runs=[];
for(let repeat=0;repeat<3;repeat++){
 const byEngine={};for(const name of repeat%2?['candidate','baseline']:['baseline','candidate']){
  const fn=name==='baseline'?baseline:candidate;byEngine[name]=[];
  for(const {id,position} of corpus){const t=performance.now(),result=fn(position,{depth:4,repetitionAversion:true});byEngine[name].push({id,millis:performance.now()-t,...result});}
 }
 for(let i=0;i<corpus.length;i++)assert.equal(byEngine.baseline[i].score,byEngine.candidate[i].score,corpus[i].id);
 runs.push(byEngine);
}
const bounded=[];
for(const {id,position} of corpus){const row={id};for(const [name,fn] of Object.entries({baseline,candidate})){const t=performance.now(),r=fn(position,{depth:8,maxNodes:4096,repetitionAversion:true});assert(r.nodes<=4096);assert(legalActions(position).some(a=>actionKey(a)===actionKey(r.action)));for(const line of r.variations){let p=position;for(const a of line.pv)p=applyAction(p,a);}row[name]={...r,millis:performance.now()-t};}bounded.push(row);}
const summaries={};for(const name of ['baseline','candidate']){const ts=runs.map(r=>r[name].reduce((n,x)=>n+x.millis,0)).sort((a,b)=>a-b);summaries[name]={fixedDepth:4,medianMillis:ts[1],millisByRepeat:ts,nodes:runs[0][name].reduce((n,x)=>n+x.nodes,0),boundedMeanDepth:bounded.reduce((n,x)=>n+x[name].completedDepth,0)/corpus.length,boundedDepthDistribution:bounded.reduce((s,r)=>{const d=r[name].completedDepth;s[d]=(s[d]??0)+1;return s;},{})};}
const sources={};for(const p of ['src/search.js','src/rules.js','src/bot.js','src/board-masks.js','scripts/bench-search-v3.js',...['search','rules','bot'].map(n=>root+'baseline-'+n+'.js'),'research/search-performance-v2/positions.json'])sources[p]=createHash('sha256').update(await readFile(p)).digest('hex');
const data={baselineCommit:'d1db2c5b7146f4b44887cce00b92be56aa2398d8',sources,positions:corpus.length,runs,bounded,summaries};await writeFile(root+'results.json',JSON.stringify(data,null,2)+'\n');await writeFile(root+'summary.json',JSON.stringify(summaries,null,2)+'\n');console.log(JSON.stringify(summaries,null,2));
