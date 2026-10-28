import {nativeEngine} from './native-engine-client.js';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import assert from 'node:assert/strict';
const paths=['engine-rust/target/release/schness-engine'];
const corpus=JSON.parse(await readFile('research/competitive-engine-v1/r6-earlier-reduction-ablation.json'));
const options={cacheEvaluation:true,profile:'competitive',depth:5,iterativeDeepening:true,quiescenceDepth:4,quiescenceChecks:true,quiescenceEvasionDepth:2,lateMoveReduction:false};
const data={purpose:'Selected diagnostic positions, not holdout strength evidence; fixed depth, exact nonreduced search. Timing includes process IPC.',options,binaries:[],results:[]};
for(const enabled of [false,true]){const binary=paths[0],client=nativeEngine(binary);data.binaries.push({path:binary,rootOrdering:enabled,sha256:createHash('sha256').update(await readFile(binary)).digest('hex')});try{for(const c of corpus.cases){const t=performance.now();const r=await client.request('schness-v1',c.position,{...options,rootOrdering:enabled});data.results.push({rootOrdering:enabled,id:c.id,millis:performance.now()-t,...r});}}finally{client.close();}}
for(let i=0;i<corpus.cases.length;i++){const a=data.results[i],b=data.results[i+corpus.cases.length];assert.equal(a.score,b.score);assert.equal(a.completedDepth,5);assert.equal(b.completedDepth,5);}

await writeFile('research/competitive-engine-v1/rust-root-ordering-ablation.json',JSON.stringify(data,null,2)+'\n');
data.sourceHashes={};for(const path of ['engine-rust/src/native_search.rs','engine-rust/src/rules.rs','engine-rust/src/search.rs','engine-rust/src/main.rs','engine-rust/Cargo.lock','scripts/bench-rust-root-ordering.js'])data.sourceHashes[path]=createHash('sha256').update(await readFile(path)).digest('hex');
await writeFile('research/competitive-engine-v1/rust-root-ordering-ablation.json',JSON.stringify(data,null,2)+'\n');
console.log([false,true].map(rootOrdering=>({rootOrdering,millis:data.results.filter(r=>r.rootOrdering===rootOrdering).reduce((n,r)=>n+r.millis,0),nodes:data.results.filter(r=>r.rootOrdering===rootOrdering).reduce((n,r)=>n+r.nodes,0)})));
