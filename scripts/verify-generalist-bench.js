import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {createInitialPosition,applyAction,positionKey,getResult} from '../src/rules.js';
const dir=new URL('../research/engine-generalist-v1/',import.meta.url);
const hash=b=>createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(await readFile(new URL('manifest.json',dir)));
for(const [path,expected] of Object.entries(manifest.sources))assert.equal(hash(await readFile(new URL(path,import.meta.url))),expected,path);
const archive=JSON.parse(await readFile(new URL('archive.json',dir))),compressed=await readFile(new URL('games.jsonl.gz',dir)),raw=gunzipSync(compressed);
assert.equal(hash(compressed),archive.compressedSha256);assert.equal(hash(raw),archive.uncompressedSha256);
const games=raw.toString().trim().split('\n').map(JSON.parse);assert.equal(games.length,32);
const seen=new Set();for(const g of games){const id=`${g.profile}:${g.opening}:${g.candidateColor}`;assert.ok(!seen.has(id));seen.add(id);
 let p=createInitialPosition();p=applyAction(p,{type:'place-king',to:12+Math.floor(g.opening/4)});p=applyAction(p,{type:'place-king',to:g.opening%4});
 for(const entry of g.transcript){p=applyAction(p,entry.action);assert.equal(positionKey(p),entry.resultingKey);assert.ok(entry.nodes<=manifest.maxNodes);}
 assert.deepEqual(p,g.finalPosition);assert.deepEqual(getResult(p)??{type:'draw',reason:'ply-limit'},g.result);if(g.result.reason==='ply-limit')assert.equal(g.transcript.length,manifest.maxPlies);
}
console.log('Verified source hashes, compressed/raw checksums and all 32 legal replay results.');
