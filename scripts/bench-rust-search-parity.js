import {nativeEngine} from './native-engine-client.js';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import assert from 'node:assert/strict';
import {analyzeAction} from '../src/bot.js';
const corpus=JSON.parse(await readFile('research/competitive-engine-v1/r6-earlier-reduction-ablation.json'));
const binaries=['output/local-experiments/rust-r3-fairy-screen-2026-10-27/runtime/engine-rust/target/release/schness-engine','engine-rust/target/release/schness-engine'];
const options={profile:'competitive',depth:5,iterativeDeepening:true,quiescenceDepth:4,quiescenceChecks:true,quiescenceEvasionDepth:2,lateMoveReduction:false,cacheEvaluation:true,stopOnProvenWin:false,repetitionAversion:true};
const data={purpose:'Selected fixed-depth nonreduced diagnostic, not holdout or playing-strength evidence. Timings include IPC and concurrent frozen screen CPU contention; algorithms/ties differ.',options,binaries:[],cases:corpus.cases,results:[],sourceHashes:{}};
for(const binary of binaries){data.binaries.push({path:binary,sha256:createHash('sha256').update(await readFile(binary)).digest('hex')});const c=nativeEngine(binary);try{for(const x of corpus.cases){const start=performance.now(),r=await c.request('schness-v1',x.position,options);assert.equal(r.completedDepth,5);data.results.push({backend:binary,id:x.id,millis:performance.now()-start,...r});}}finally{c.close();}}
for(const x of corpus.cases){const start=performance.now(),r=analyzeAction(x.position,options);data.results.push({backend:'JavaScript',id:x.id,millis:performance.now()-start,...r});}
for(let i=0;i<corpus.cases.length;i++)for(let j=1;j<3;j++)assert.equal(data.results[i].score,data.results[i+j*corpus.cases.length].score,corpus.cases[i].id);
for(const p of ['engine-rust/src/native_search.rs','engine-rust/src/rules.rs','engine-rust/src/search.rs','engine-rust/src/main.rs','engine-rust/Cargo.lock','src/search.js','src/bot.js','scripts/bench-rust-search-parity.js'])data.sourceHashes[p]=createHash('sha256').update(await readFile(p)).digest('hex');
await writeFile('research/competitive-engine-v1/rust-search-parity-ablation.json',JSON.stringify(data,null,2)+'\n');
console.log([...binaries,'JavaScript'].map(backend=>({backend,nodes:data.results.filter(x=>x.backend===backend).reduce((n,x)=>n+x.nodes,0),millis:data.results.filter(x=>x.backend===backend).reduce((n,x)=>n+x.millis,0)})));
