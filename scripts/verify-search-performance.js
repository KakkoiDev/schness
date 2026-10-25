import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {createInitialPosition,applyAction,getResult,positionKey,legalActions,actionKey} from '../src/rules.js';
const dir=new URL('../research/search-performance-v2/',import.meta.url),hash=b=>createHash('sha256').update(b).digest('hex');
async function json(name){try{return JSON.parse(await readFile(new URL(name,dir)));}catch(error){if(error.code!=='ENOENT')throw error;return JSON.parse(gunzipSync(await readFile(new URL(name+'.gz',dir))));}}
const r=await json('results.json'),play=await json('play-results.json'),corpus=await json('positions.json');
assert.equal(corpus.length,32);assert.equal(r.runs.length,3);
for(const sources of [r.sources,play.sources])for(const [path,sha] of Object.entries(sources))assert.equal(hash(await readFile(new URL(path,import.meta.url))),sha,path);
for(const run of r.runs)for(let i=0;i<corpus.length;i++){
 const a=run.baseline[i],b=run.optimized[i];assert.equal(a.id,corpus[i].id);assert.equal(b.id,a.id);assert.equal(a.score,b.score);assert.equal(a.completedDepth,4);assert.equal(b.completedDepth,4);
 for(const v of b.variations){let p=corpus[i].position;for(const action of v.pv)p=applyAction(p,action);}
}
for(const row of r.bounded)for(const name of ['baseline','optimized'])assert.ok(row[name].nodes<=r.maxNodes&&row[name].completedDepth<=r.requestedBudgetDepth);
const compressed=await readFile(new URL('play-games.jsonl.gz',dir)),raw=gunzipSync(compressed);
assert.equal(hash(compressed),play.archive.compressedSha256);assert.equal(hash(raw),play.archive.rawSha256);
const games=raw.toString().trim().split('\n').map(JSON.parse);assert.equal(games.length,32);
const totals={optimizedWins:0,baselineWins:0,draws:0,reasons:{}},seen=new Set();
for(const g of games){const id=`${g.opening}:${g.optimizedColor}`;assert.ok(!seen.has(id));seen.add(id);
 let p=createInitialPosition();p=applyAction(p,{type:'place-king',to:12+Math.floor(g.opening/4)});p=applyAction(p,{type:'place-king',to:g.opening%4});
 for(const e of g.transcript){assert.ok(legalActions(p).some(a=>actionKey(a)===actionKey(e.action)));assert.ok(e.nodes<=play.config.maxNodes);p=applyAction(p,e.action);assert.equal(positionKey(p),e.resultingKey);}
 assert.deepEqual(p,g.finalPosition);assert.deepEqual(getResult(p)??{type:'draw',reason:'ply-limit'},g.result);if(g.result.reason==='ply-limit')assert.equal(g.transcript.length,play.config.maxPlies);
 if(g.result.winner)totals[g.result.winner===g.optimizedColor?'optimizedWins':'baselineWins']++;else totals.draws++;
 totals.reasons[g.result.reason]=(totals.reasons[g.result.reason]??0)+1;
}
for(const [k,v] of Object.entries(totals))assert.deepEqual(v,play.summary[k]);
const archive=await json('artifacts.json');for(const file of archive.files){const b=await readFile(new URL(file.path,dir));assert.equal(b.length,file.bytes);assert.equal(hash(b),file.sha256);}
console.log('Verified source hashes, all benchmark score pairs, legal principal variations, node caps, archive checksums and all 32 match replays/results.');
