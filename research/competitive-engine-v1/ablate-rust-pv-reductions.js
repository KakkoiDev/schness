import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {nativeEngine} from '../../scripts/native-engine-client.js';
const corpus=JSON.parse(await readFile('research/competitive-engine-v1/rust-r5-early-swings.json'));
const cases=corpus.cases.filter(c=>corpus.results.find(r=>r.id===c.id).comparable),results=[];
const binary='engine-rust/target/release/schness-engine',client=nativeEngine(binary,[],{watchdogMillis:10000});
try{for(const c of cases)for(const reducePrincipalVariation of [true,false]){const options={...corpus.options,multiPv:1,lateMoveReduction:true,reducePrincipalVariation};const result=await client.request('schness-v1',c.position,options);results.push({...result,requestId:result.id,id:c.id,options});}}finally{client.close();}
const summary=cases.map(c=>{const [a,b]=results.filter(r=>r.id===c.id);return {id:c.id,complete:a.completedDepth===6&&b.completedDepth===6,depths:[a.completedDepth,b.completedDepth],scores:[a.score,b.score],actions:[a.action,b.action]};});
await writeFile('research/competitive-engine-v1/rust-pv-reduction-ablation.json',JSON.stringify({purpose:'Experimental PV-node reduction guard on all15 complete early-loss cases; true/false means allow reductions in wide windows or restrict to null windows. Explicit depth6/200000nodes1500ms; not strength evidence.',binary:{path:binary,sha256:createHash('sha256').update(await readFile(binary)).digest('hex')},scriptSha256:createHash('sha256').update(await readFile(new URL(import.meta.url))).digest('hex'),cases,results,summary},null,2)+'\n');console.log(JSON.stringify(summary));
