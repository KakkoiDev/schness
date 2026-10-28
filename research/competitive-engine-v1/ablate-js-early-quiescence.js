/** Quiescence cost/horizon diagnostics on early JS loss selections. */
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {analyzeAction} from '../../src/bot.js';
import {applyAction,actionKey} from '../../src/rules.js';
import assert from 'node:assert/strict';
const input=JSON.parse(await readFile('research/competitive-engine-v1/js-early-swings.json'));
const cases=input.cases.filter(c=>input.results.some(r=>r.id===c.id&&r.variant===c.variant&&r.comparable)),results=[];
for(const c of cases)for(const extra of [{quiescenceDepth:4,quiescenceChecks:true},{quiescenceDepth:4,quiescenceChecks:false},{quiescenceDepth:2,quiescenceChecks:true}]){
 const options={...input.options,...extra},start=performance.now(),r=analyzeAction(c.position,options);let p=c.position;for(const a of r.pv)p=applyAction(p,a);
 results.push({variant:c.variant,id:c.id,options,millis:performance.now()-start,...r});
}
const groups=[0,1,2].map(i=>{const rs=results.filter((r,j)=>j%3===i);return{options:rs[0].options,complete:rs.filter(r=>r.completedDepth===6).length,nodes:rs.reduce((a,r)=>a+r.nodes,0),qNodes:rs.reduce((a,r)=>a+r.quiescenceNodes,0),millis:rs.reduce((a,r)=>a+r.millis,0)};});
const corpus=JSON.parse(await readFile('research/search-performance-v5/tactical-corpus.json'));
for(const f of corpus.cases){const saved=JSON.stringify(f.position),r=analyzeAction(f.position,{...input.options,depth:f.depth,quiescenceChecks:false,maxNodes:200000,maxMillis:1500});assert(r.score>=1000000,f.id);assert(f.winningActions.includes(actionKey(r.action)),f.id);assert.equal(JSON.stringify(f.position),saved);}
const tacticalMatesPassed=corpus.cases.length;
const hashes={};for(const path of ['src/search.js','src/bot.js','src/exchange.js'])hashes[path]=createHash('sha256').update(await readFile(path)).digest('hex');
await writeFile('research/competitive-engine-v1/js-early-quiescence-ablation.json',JSON.stringify({purpose:'Selected40completed early JS loss pairs; three independently bounded horizon choices atdepth6 nonreduced. Changing quiescence changes horizon/evaluation, not exact-equivalence or strength evidence. Only completed same-option depth results comparable; timings ordered/warmup-sensitive.',hashes,inputSha256:createHash('sha256').update(await readFile('research/competitive-engine-v1/js-early-swings.json')).digest('hex'),scriptSha256:createHash('sha256').update(await readFile(new URL(import.meta.url))).digest('hex'),cases,results,groups,tacticalMatesPassed},null,2)+'\n');console.log(JSON.stringify(groups));
