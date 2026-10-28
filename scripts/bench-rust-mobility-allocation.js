import {nativeEngine} from './native-engine-client.js';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import assert from 'node:assert/strict';
import {analyzeAction} from '../src/bot.js';
const corpus=JSON.parse(await readFile('research/competitive-engine-v1/r6-earlier-reduction-ablation.json'));
const binaries=['output/local-experiments/rust-r4-fairy-screen-2026-10-27/runtime/engine-rust/target/release/schness-engine','engine-rust/target/release/schness-engine'];
const options={profile:'competitive',depth:5,iterativeDeepening:true,quiescenceDepth:4,quiescenceChecks:true,quiescenceEvasionDepth:2,lateMoveReduction:false,cacheEvaluation:true,stopOnProvenWin:false,repetitionAversion:true};
const data={purpose:'Selected fixed-depth nonreduced diagnostic comparing combined key/mobility allocation cleanups with frozen r4, not holdout or playing-strength evidence. Timings include IPC ; no match runs concurrently; algorithms/ties differ.',options,binaries:[],cases:corpus.cases,results:[],sourceHashes:{}};
for(const binary of binaries){data.binaries.push({path:binary,sha256:createHash('sha256').update(await readFile(binary)).digest('hex')});const c=nativeEngine(binary);try{for(const x of corpus.cases){const start=performance.now(),r=await c.request('schness-v1',x.position,options);assert.equal(r.completedDepth,5);data.results.push({backend:binary,id:x.id,millis:performance.now()-start,...r});}}finally{c.close();}}
for(const x of corpus.cases){const start=performance.now(),r=analyzeAction(x.position,options);data.results.push({backend:'JavaScript',id:x.id,millis:performance.now()-start,...r});}
for(let i=0;i<corpus.cases.length;i++){assert.equal(data.results[i].nodes,data.results[i+corpus.cases.length].nodes);assert.deepEqual(data.results[i].action,data.results[i+corpus.cases.length].action);}for(let i=0;i<corpus.cases.length;i++)for(let j=1;j<3;j++)assert.equal(data.results[i].score,data.results[i+j*corpus.cases.length].score,corpus.cases[i].id);
data.repeatedTrials=[];
for(const index of [1,0,0,1]){const binary=binaries[index],c=nativeEngine(binary);const trial={backend:binary,results:[]};try{for(let i=0;i<corpus.cases.length;i++){const x=corpus.cases[i],start=performance.now(),r=await c.request('schness-v1',x.position,options);assert.equal(r.score,data.results[i].score);assert.equal(r.nodes,data.results[i].nodes);assert.deepEqual(r.action,data.results[i].action);trial.results.push({id:x.id,millis:performance.now()-start,...r});}}finally{c.close();}data.repeatedTrials.push(trial);}
for(const p of ['engine-rust/src/native_search.rs','engine-rust/src/rules.rs','engine-rust/src/search.rs','engine-rust/src/main.rs','engine-rust/Cargo.lock','src/search.js','src/bot.js','scripts/bench-rust-mobility-allocation.js'])data.sourceHashes[p]=createHash('sha256').update(await readFile(p)).digest('hex');
await writeFile('research/competitive-engine-v1/rust-mobility-allocation-ablation.json',JSON.stringify(data,null,2)+'\n');
console.log([...binaries,'JavaScript'].map(backend=>({backend,nodes:data.results.filter(x=>x.backend===backend).reduce((n,x)=>n+x.nodes,0),millis:data.results.filter(x=>x.backend===backend).reduce((n,x)=>n+x.millis,0)})));
console.log(data.repeatedTrials.map(t=>({backend:t.backend,millis:t.results.reduce((n,r)=>n+r.millis,0)})));
