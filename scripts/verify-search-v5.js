import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {createInitialPosition,applyAction,getResult,positionKey,legalActions,actionKey} from '../src/rules.js';
const root='research/search-performance-v5/',hash=b=>createHash('sha256').update(b).digest('hex');
async function json(path){try{return JSON.parse(gunzipSync(await readFile(path+'.gz')));}catch(e){if(e.code!=='ENOENT')throw e;return JSON.parse(await readFile(path));}}
async function sources(data){for(const [p,sha]of Object.entries(data.sources))assert.equal(hash(await readFile(p)),sha,p);}
const corpus=await json('research/search-performance-v2/positions.json');
function lines(position,result){assert(legalActions(position).some(a=>actionKey(a)===actionKey(result.action)));for(const v of result.variations){let p=position;for(const a of v.pv)p=applyAction(p,a);}}
for(const stage of ['step-1','step-2','final']){
 const data=await json(root+stage+'-results.json');await sources(data);assert.equal(data.runs.length,7);
 for(const run of data.runs){assert.equal(run.baseline.length,32);assert.equal(run.candidate.length,32);for(let i=0;i<32;i++){
  const a=run.baseline[i],b=run.candidate[i];assert.equal(a.id,corpus[i].id);assert.equal(b.id,a.id);assert.equal(a.score,b.score);assert.equal(a.nodes,b.nodes);assert.equal(a.completedDepth,4);assert.equal(b.completedDepth,4);lines(corpus[i].position,a);lines(corpus[i].position,b);
 }}
 for(const name of ['baseline','candidate']){const times=data.runs.map(r=>r[name].reduce((n,x)=>n+x.millis,0)).sort((a,b)=>a-b);assert.equal(times[3],data.summary[name].medianMillis);}
}
const browser=await json(root+'browser-results.json');await sources(browser);assert.equal(browser.runs.length,96);const seenBrowser=new Set();
for(const row of browser.runs){const id=row.id+':'+row.repeat;assert(!seenBrowser.has(id));seenBrowser.add(id);for(const name of ['baseline','candidate']){assert(row[name].nodes<=10000000);assert(row[name].completedDepth<=100);lines(corpus.find(x=>x.id===row.id).position,row[name]);}}
for(const mode of ['exact','tactical','reduced','king-safety']){
 const play=await json(root+mode+'-play-results.json');await sources(play);const compressed=await readFile(root+mode+'-play-games.jsonl.gz'),raw=gunzipSync(compressed);assert.equal(hash(compressed),play.archive.compressedSha256);assert.equal(hash(raw),play.archive.rawSha256);
 const games=raw.toString().trim().split('\n').map(JSON.parse),seen=new Set();assert.equal(games.length,32);
 const totals={candidateWins:0,baselineWins:0,draws:0,reasons:{},completedDepth:{candidate:{},baseline:{}}};
 for(const g of games){const id=g.opening+':'+g.candidateColor;assert(!seen.has(id));seen.add(id);let p=createInitialPosition();p=applyAction(p,{type:'place-king',to:12+Math.floor(g.opening/4)});p=applyAction(p,{type:'place-king',to:g.opening%4});
  for(const e of g.transcript){assert.equal(getResult(p),null);assert(e.nodes<=play.config.maxNodes);assert(e.completedDepth<=play.config.depth);const who=p.turn===g.candidateColor?'candidate':'baseline';totals.completedDepth[who][e.completedDepth]=(totals.completedDepth[who][e.completedDepth]??0)+1;p=applyAction(p,e.action);assert.equal(positionKey(p),e.resultingKey);}
  assert.deepEqual(p,g.finalPosition);assert.deepEqual(getResult(p)??{type:'draw',reason:'ply-limit'},g.result);if(g.result.reason==='ply-limit')assert.equal(g.transcript.length,play.config.maxPlies);
  if(g.result.winner)totals[g.result.winner===g.candidateColor?'candidateWins':'baselineWins']++;else totals.draws++;totals.reasons[g.result.reason]=(totals.reasons[g.result.reason]??0)+1;
 }assert.deepEqual(totals,play.summary);
}
const artifacts=await json(root+'artifacts.json');for(const f of artifacts.files){const b=await readFile(root+f.path);assert.equal(b.length,f.bytes);assert.equal(hash(b),f.sha256);}
console.log('Verified all staged source hashes, 672 equal-score/equal-node pairs, 96 browser pairs, 128 complete match replays, budgets and archive checksums.');
