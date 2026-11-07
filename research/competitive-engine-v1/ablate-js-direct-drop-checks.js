/** Exact direct drop-check geometry without copying masks; selected diagnostic, not strength. */
import {readFile,writeFile} from 'node:fs/promises';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
import {analyzeAction as current} from '../../src/bot.js';
import {analyzeAction as previous} from '../../output/local-experiments/js-keytransition-r1-fairy-screen-2026-10-27/runtime/src/bot.js';
const input=JSON.parse(await readFile('research/competitive-engine-v1/js-early-swings.json')),cases=input.cases.filter(c=>input.results.some(r=>r.id===c.id&&r.variant===c.variant&&r.comparable)),results=[];
for(const [trial,engine] of [['new',current],['old',previous],['old',previous],['new',current]]){
 const start=performance.now(),rows=[];
 for(const c of cases){const saved=JSON.stringify(c.position),r=engine(c.position,{...input.options,maxMillis:2000});assert.equal(r.completedDepth,6);assert.equal(JSON.stringify(c.position),saved);rows.push({variant:c.variant,id:c.id,...r});}
 results.push({trial,millis:performance.now()-start,nodes:rows.reduce((a,r)=>a+r.nodes,0),rows});
}
for(let i=0;i<cases.length;i++)for(const t of results.slice(1)){assert.equal(t.rows[i].score,results[0].rows[i].score);assert.deepEqual(t.rows[i].action,results[0].rows[i].action);assert.equal(t.rows[i].nodes,results[0].rows[i].nodes);}
const hashes={};for(const p of ['src/rules.js','src/bot.js','src/search.js','src/board-masks.js','output/local-experiments/js-keytransition-r1-fairy-screen-2026-10-27/runtime/src/rules.js','output/local-experiments/js-keytransition-r1-fairy-screen-2026-10-27/runtime/src/bot.js'])hashes[p]=createHash('sha256').update(await readFile(p)).digest('hex');
await writeFile('research/competitive-engine-v1/js-direct-drop-checks-ablation.json',JSON.stringify({purpose:'Direct drop check preserves total occupancy, existing attackers and enemy first-king semantics; no mask-array copy for ordinary drops. ABBA40selectedpositions/depth6/q4checks/nonreduced/100000nodes2000ms, exact sampled score/action/node equivalence; timings warmup/GC sensitive, not strength.',hashes,scriptSha256:createHash('sha256').update(await readFile(new URL(import.meta.url))).digest('hex'),cases,results},null,2)+'\n');console.log(JSON.stringify(results.map(({trial,millis,nodes})=>({trial,millis,nodes}))));
