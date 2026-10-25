import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import assert from 'node:assert/strict';
import {analyzeAction as baseline} from '../research/search-performance-v5/baseline-bot.js';
import {analyzeAction as candidate} from '../src/bot.js';
import {applyAction} from '../src/rules.js';
const root='research/search-performance-v5/',label=process.argv[2]??'final';
if(!/^[a-z0-9-]+$/.test(label))throw Error('Invalid label');
const corpus=JSON.parse(await readFile('research/search-performance-v2/positions.json'));
for(const fn of [baseline,candidate])for(const {position}of corpus)fn(position,{depth:3});
const runs=[];
for(let repeat=0;repeat<7;repeat++){
 const row={};for(const name of repeat%2?['candidate','baseline']:['baseline','candidate']){
  row[name]=[];for(const {id,position}of corpus){const t=performance.now(),r=(name==='baseline'?baseline:candidate)(position,{depth:4,repetitionAversion:true});row[name].push({id,millis:performance.now()-t,...r});}
 }
 for(let i=0;i<corpus.length;i++){
  assert.equal(row.baseline[i].score,row.candidate[i].score);assert.equal(row.baseline[i].nodes,row.candidate[i].nodes);
  for(const name of ['baseline','candidate'])for(const line of row[name][i].variations){let p=corpus[i].position;for(const a of line.pv)p=applyAction(p,a);}
 }runs.push(row);
}
const summary={};for(const name of ['baseline','candidate']){const ts=runs.map(r=>r[name].reduce((n,x)=>n+x.millis,0)).sort((a,b)=>a-b);summary[name]={medianMillis:ts[3],millis:ts,nodes:runs[0][name].reduce((n,x)=>n+x.nodes,0)};}
const sources={};for(const p of ['src/search.js','src/bot.js','src/rules.js','src/board-masks.js','scripts/bench-search-v5.js','research/search-performance-v2/positions.json',...['search','bot','rules','board-masks'].map(x=>root+'baseline-'+x+'.js')])sources[p]=createHash('sha256').update(await readFile(p)).digest('hex');
await writeFile(root+label+'-results.json',JSON.stringify({sources,runs,summary},null,2)+'\n');console.log(JSON.stringify(summary,null,2));
