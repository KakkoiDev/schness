import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {analyzeAction} from '../../src/bot.js';
const corpus=JSON.parse(await readFile('research/competitive-engine-v1/rust-r5-early-swings.json'));
const cases=corpus.cases.filter(c=>corpus.results.find(r=>r.id===c.id).comparable),results=[];
for(const exchangeOrdering of [true,false,false,true])for(const c of cases){
 const options={profile:'competitive',depth:5,iterativeDeepening:true,quiescenceDepth:4,quiescenceChecks:true,quiescenceEvasionDepth:2,lateMoveReduction:false,cacheEvaluation:true,stopOnProvenWin:false,exchangeOrdering};
 const start=performance.now(),r=analyzeAction(c.position,options);results.push({id:c.id,options,millis:performance.now()-start,...r});
}
const hashes={};for(const p of ['src/search.js','src/bot.js','src/exchange.js'])hashes[p]=createHash('sha256').update(await readFile(p)).digest('hex');
const totals=Array.from({length:4},(_,i)=>results.slice(i*cases.length,(i+1)*cases.length).reduce((a,r)=>({millis:a.millis+r.millis,nodes:a.nodes+r.nodes}),{millis:0,nodes:0}));
for(let i=0;i<cases.length;i++){const a=results[i];for(let j=1;j<4;j++){const b=results[j*cases.length+i];if(a.score!==b.score)throw Error('Traversal mismatch '+a.id);}}
await writeFile('research/competitive-engine-v1/js-exchange-ordering-ablation.json',JSON.stringify({purpose:'Selected diagnostic cases from Rust losses, not strength evidence. ABBA lazy/sort/sort/lazy; no time/node cap; fixed depth5. Exchange ordering on/off/off/on; capture-only finite estimate, not complete tactical evaluation.',hashes,cases,results,totals},null,2)+'\n');console.log(JSON.stringify(totals));
