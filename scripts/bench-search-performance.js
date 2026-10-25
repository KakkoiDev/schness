import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import assert from 'node:assert/strict';
import {analyzeAction as baseline} from '../research/search-performance-v2/baseline-bot.js';
import {analyzeAction as optimized} from '../src/bot.js';
import {createInitialPosition,applyAction,getResult,positionKey,legalActions,actionKey} from '../src/rules.js';
const dir=new URL('../research/search-performance-v2/',import.meta.url);await mkdir(dir,{recursive:true});
let corpus;
try {corpus=JSON.parse(await readFile(new URL('positions.json',dir)));}
catch(error){if(error.code!=='ENOENT')throw error;
 const games=gunzipSync(await readFile(new URL('../research/engine-generalist-v1/games.jsonl.gz',import.meta.url))).toString().trim().split('\n').map(JSON.parse);
 const seen=new Set();corpus=[];
 for(const g of games){let p=createInitialPosition();p=applyAction(p,{type:'place-king',to:12+Math.floor(g.opening/4)});p=applyAction(p,{type:'place-king',to:g.opening%4});
  for(let i=0;i<g.transcript.length;i++){p=applyAction(p,g.transcript[i].action);if([3,11,23,39].includes(i)&&!getResult(p)){const key=positionKey(p)+JSON.stringify(p.repetitions);if(!seen.has(key)){seen.add(key);corpus.push({id:`opening-${g.opening}-${g.candidateColor}-ply-${i+1}`,position:p});}}}if(corpus.length>=32)break;
 }corpus=corpus.slice(0,32);await writeFile(new URL('positions.json',dir),JSON.stringify(corpus,null,2)+'\n');}
const profileIndex=process.argv.indexOf('--profile');
if(profileIndex>=0){const name=process.argv[profileIndex+1];if(!['baseline','optimized'].includes(name))throw Error('Invalid profile');for(let repeat=0;repeat<3;repeat++)for(const item of corpus)(name==='baseline'?baseline:optimized)(item.position,{depth:4,repetitionAversion:true});console.log(`CPU profile workload complete: ${name}`);process.exit(0);}
// Warm both engines; timed runs alternate order to reduce systematic warm-up bias.
for(const fn of [baseline,optimized])for(const item of corpus.slice(0,4))fn(item.position,{depth:3,repetitionAversion:true});
const runs=[];
for(let repeat=0;repeat<3;repeat++){
 const byEngine={baseline:[],optimized:[]};
 for(const name of repeat%2?['optimized','baseline']:['baseline','optimized']){
  const fn=name==='baseline'?baseline:optimized;
  for(const item of corpus){const start=performance.now(),result=fn(item.position,{depth:4,repetitionAversion:true});byEngine[name].push({id:item.id,millis:performance.now()-start,...result});}
 }
 for(let i=0;i<corpus.length;i++){assert.equal(byEngine.baseline[i].score,byEngine.optimized[i].score,corpus[i].id);assert.equal(byEngine.optimized[i].completedDepth,4);}
 runs.push(byEngine);
}
const bounded=[];
for(const item of corpus){const row={id:item.id};for(const [name,fn] of Object.entries({baseline,optimized})){const start=performance.now();row[name]={...fn(item.position,{depth:8,maxNodes:4096,repetitionAversion:true}),millis:performance.now()-start};assert.ok(row[name].nodes<=4096);assert.ok(legalActions(item.position).some(a=>actionKey(a)===actionKey(row[name].action)));}bounded.push(row);}
const summaries={};
for(const name of ['baseline','optimized']){const totals=runs.map(run=>run[name].reduce((s,r)=>({nodes:s.nodes+r.nodes,millis:s.millis+r.millis}),{nodes:0,millis:0}));const sorted=totals.map(r=>r.millis).sort((a,b)=>a-b);summaries[name]={fixedDepth:4,nodes:totals[0].nodes,totalMillisByRepeat:totals.map(t=>t.millis),medianMillis:sorted[1],boundedDepthSum:bounded.reduce((n,r)=>n+r[name].completedDepth,0),boundedDepthDistribution:bounded.reduce((s,r)=>{const d=r[name].completedDepth;s[d]=(s[d]??0)+1;return s;},{}),boundedNodes:bounded.reduce((n,r)=>n+r[name].nodes,0)};}
const sources={};for(const path of ['../src/search.js','../src/bot.js','../src/rules.js','../research/search-performance-v2/baseline-search.js','../research/search-performance-v2/baseline-bot.js','../research/search-performance-v2/baseline-rules.js'])sources[path]=createHash('sha256').update(await readFile(new URL(path,import.meta.url))).digest('hex');
const results={baselineCommit:'3d4dea355e2f9e9c79430bcc842f2ff2db25f8c3',positions:corpus.length,fixedDepth:4,repetitions:3,maxNodes:4096,requestedBudgetDepth:8,exactScoresMatch:true,sources,summaries,runs,bounded};
await writeFile(new URL('results.json',dir),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(summaries,null,2));
