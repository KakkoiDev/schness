import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {createInitialPosition,applyAction,getResult,positionKey,legalActions,actionKey} from '../src/rules.js';
const root='research/search-performance-v4/',hash=b=>createHash('sha256').update(b).digest('hex');
async function json(path){try{return JSON.parse(gunzipSync(await readFile(path+'.gz')));}catch(e){if(e.code!=='ENOENT')throw e;return JSON.parse(await readFile(path));}}
const r=await json(root+'results.json'),browser=await json(root+'browser-results.json'),play=await json(root+'play-results.json'),corpus=await json('research/search-performance-v2/positions.json');
for(const data of [r,browser,play])for(const [path,sha]of Object.entries(data.sources)){
 let bytes=await readFile(path);
 if(hash(bytes)!==sha && path.startsWith('src/'))bytes=await readFile(root+'runtime/'+path);
 assert.equal(hash(bytes),sha,path);
}
assert.equal(corpus.length,32);assert.equal(r.runs.length,3);assert.equal(r.bounded.length,32);
function replayLines(position,result){assert(legalActions(position).some(a=>actionKey(a)===actionKey(result.action)));for(const v of result.variations){let p=position;for(const a of v.pv)p=applyAction(p,a);}}
for(const run of r.runs)for(let i=0;i<32;i++){const expected=run.initial[i];for(const name of ['initial','rootPruned','baseline','candidate']){const row=run[name][i];assert.equal(row.id,corpus[i].id);assert.equal(row.score,expected.score);assert.equal(row.completedDepth,4);replayLines(corpus[i].position,row);}assert.equal(run.baseline[i].nodes,run.candidate[i].nodes);}
for(const row of r.bounded)for(const name of ['baseline','candidate']){assert(row[name].nodes<=4096);assert(row[name].completedDepth<=8);replayLines(corpus.find(x=>x.id===row.id).position,row[name]);}
assert.equal(browser.runs.length,96);const browserSeen=new Set();for(const row of browser.runs){const key=row.id+':'+row.repeat;assert(!browserSeen.has(key));browserSeen.add(key);for(const name of ['baseline','candidate']){assert(row[name].nodes<=10000000);assert(row[name].completedDepth<=100);replayLines(corpus.find(x=>x.id===row.id).position,row[name]);}}
const compressed=await readFile(root+'play-games.jsonl.gz'),raw=gunzipSync(compressed);assert.equal(hash(compressed),play.archive.compressedSha256);assert.equal(hash(raw),play.archive.rawSha256);const games=raw.toString().trim().split('\n').map(JSON.parse);assert.equal(games.length,32);
const totals={candidateWins:0,baselineWins:0,draws:0,reasons:{},completedDepth:{candidate:{},baseline:{}}},seen=new Set();
for(const g of games){const id=g.opening+':'+g.candidateColor;assert(!seen.has(id));seen.add(id);let p=createInitialPosition();p=applyAction(p,{type:'place-king',to:12+Math.floor(g.opening/4)});p=applyAction(p,{type:'place-king',to:g.opening%4});
 for(const e of g.transcript){assert.equal(getResult(p),null);const name=p.turn===g.candidateColor?'candidate':'baseline';totals.completedDepth[name][e.completedDepth]=(totals.completedDepth[name][e.completedDepth]??0)+1;assert(e.nodes<=play.config.maxNodes);p=applyAction(p,e.action);assert.equal(positionKey(p),e.resultingKey);}
 assert.deepEqual(p,g.finalPosition);assert.deepEqual(getResult(p)??{type:'draw',reason:'ply-limit'},g.result);if(g.result.reason==='ply-limit')assert.equal(g.transcript.length,play.config.maxPlies);
 if(g.result.winner)totals[g.result.winner===g.candidateColor?'candidateWins':'baselineWins']++;else totals.draws++;totals.reasons[g.result.reason]=(totals.reasons[g.result.reason]??0)+1;
}assert.deepEqual(totals,play.summary);
const artifacts=await json(root+'artifacts.json');for(const f of artifacts.files){const bytes=await readFile(root+f.path);assert.equal(bytes.length,f.bytes);assert.equal(hash(bytes),f.sha256);}
console.log('Verified frozen/current sources, 384 equal-depth searches across four stages, all Node/browser legal lines and budgets, all 32 equal-time match replays and archive checksums.');
