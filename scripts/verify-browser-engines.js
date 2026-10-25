import {gunzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {legalActions,createPosition} from '../src/rules.js';
const d=JSON.parse(await readFile('research/browser-engine-v1/results.json').catch(async()=>gunzipSync(await readFile('research/browser-engine-v1/results.json.gz'))));
for(const [path,hash] of Object.entries(d.sources)){if(path.startsWith('/tmp/'))continue;assert.equal(createHash('sha256').update(await readFile(path)).digest('hex'),hash,path);}
assert.equal(d.parity.length,32);assert.equal(d.search.length,96);
for(const p of d.parity){assert.equal(p.depth,4);assert.deepEqual(p.mismatches,[]);assert.deepEqual(p.ours,p.theirs);assert.equal(Object.values(p.ours).reduce((a,b)=>a+b,0),p.nodes);}
const corpus=JSON.parse(await readFile('research/search-performance-v2/positions.json')),code={king:'K',rook:'R',bishop:'B',knight:'N'},sq=i=>'abcd'[i%4]+(4-Math.floor(i/4));
for(const row of d.search){const p=createPosition({...corpus.find(x=>x.id===row.id).position,repetitions:{},rules:{allowCheckingDrops:false,experiment:'capture-bank',bankCapacity:6}}),legal=legalActions(p).map(a=>a.type==='drop'?code[a.piece]+'@'+sq(a.to):sq(a.from)+sq(a.to));for(const name of ['ours','fairy']){assert(legal.includes(row[name].move));assert(row[name].nodes>0);assert(row[name].depth>0);}assert(!/ (upperbound|lowerbound) /.test(row.fairy.info));}
console.log('Verified source hashes, 32 depth-4 legal trees and all 192 returned moves. External binary hashes are recorded; binaries are not vendored.');
