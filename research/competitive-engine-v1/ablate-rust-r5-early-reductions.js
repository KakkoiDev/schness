import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {nativeEngine} from '../../scripts/native-engine-client.js';
const corpus=JSON.parse(await readFile('research/competitive-engine-v1/rust-r5-early-swings.json'));
const cases=corpus.cases.filter(c=>corpus.results.find(r=>r.id===c.id).comparable),results=[];
const binary=corpus.binary.path,client=nativeEngine(binary,[],{watchdogMillis:10000});
try{for(const c of cases)for(const lateMoveReduction of [false,true]){const options={...corpus.options,multiPv:1,lateMoveReduction};const result=await client.request('schness-v1',c.position,options);results.push({...result,requestId:result.id,id:c.id,options});}}finally{client.close();}
const summary=cases.map(c=>{const [a,b]=results.filter(r=>r.id===c.id);return {id:c.id,complete:a.completedDepth===6&&b.completedDepth===6,depths:[a.completedDepth,b.completedDepth],scores:[a.score,b.score],actions:[a.action,b.action]};});
await writeFile('research/competitive-engine-v1/rust-r5-early-reductions.json',JSON.stringify({priorDiagnosticFailure:'Initial summarizer used overwritten protocol ID; no match was run and no results were published from that failed diagnostic. Corrected rerun follows.',purpose:'All15complete early-swing diagnostic pairs,selected from29r5losses;not strength holdout. LMRoff/on same nominaldepth6/q4/evasion2/multiPv1,explicit200000nodes1500ms. Compare scores/actions only where bothcomplete.',binary:corpus.binary,scriptSha256:createHash('sha256').update(await readFile(new URL(import.meta.url))).digest('hex'),cases,results,summary},null,2)+'\n');console.log(JSON.stringify(summary));
