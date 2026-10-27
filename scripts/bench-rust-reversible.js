import {nativeEngine} from './native-engine-client.js';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import assert from 'node:assert/strict';
const paths=['output/local-experiments/rust-r2-fairy-screen-2026-10-27/runtime/engine-rust/target/release/schness-engine','output/local-experiments/rust-r3-fairy-screen-2026-10-27/runtime/engine-rust/target/release/schness-engine'];
const corpus=JSON.parse(await readFile('research/competitive-engine-v1/r6-earlier-reduction-ablation.json'));
const options={profile:'competitive',depth:5,iterativeDeepening:false,quiescenceDepth:4,quiescenceChecks:true,quiescenceEvasionDepth:2,lateMoveReduction:false};
const data={purpose:'Selected diagnostic positions, not holdout strength evidence; fixed depth, exact nonreduced search. Timing includes process IPC.',options,binaries:[],results:[]};
for(const binary of paths){const client=nativeEngine(binary);data.binaries.push({path:binary,sha256:createHash('sha256').update(await readFile(binary)).digest('hex')});try{for(const c of corpus.cases){const t=performance.now();const r=await client.request('schness-v1',c.position,options);data.results.push({binary,id:c.id,millis:performance.now()-t,...r});}}finally{client.close();}}
for(let i=0;i<corpus.cases.length;i++){const a=data.results[i],b=data.results[i+corpus.cases.length];assert.equal(a.score,b.score);assert.equal(a.nodes,b.nodes);assert.equal(a.completedDepth,5);assert.equal(b.completedDepth,5);}
await writeFile('research/competitive-engine-v1/rust-reversible-ablation.json',JSON.stringify(data,null,2)+'\n');
console.log(data.binaries.map(({path})=>({path,millis:data.results.filter(r=>r.binary===path).reduce((n,r)=>n+r.millis,0),nodes:data.results.filter(r=>r.binary===path).reduce((n,r)=>n+r.nodes,0)})));
