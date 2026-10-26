import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,readdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {tasksFor,playGame} from '../scripts/run-engine-regression.js';
import {VARIANTS} from '../src/variants.js';
test('engine regression schedules each engine in each fixed color for every shared bench seed and start',()=>{
 const variants=Object.keys(VARIANTS),seeds=[1,2,3,4,5,6],tasks=tasksFor({variants,seeds});assert.equal(tasks.length,6912);assert.equal(new Set(tasks.map(t=>t.id)).size,6912);
 for(const variant of variants)for(const color of ['white','black']){const group=tasks.filter(t=>t.variant===variant&&t.candidateColor===color);assert.equal(group.length,96);assert.equal(new Set(group.map(t=>t.index)).size,16);}
 assert(tasks.slice(0,3456).every(t=>t.candidateColor==='white'));assert(tasks.slice(3456).every(t=>t.candidateColor==='black'));
});
test('cross-engine frozen bench checkpoints resume idempotently and reject tampered sources',async()=>{
 const root=await mkdtemp(join(tmpdir(),'schness-engine-regression-')),out=join(root,'run');const call=(script,args)=>execFileSync(process.execPath,[script,...args],{encoding:'utf8',timeout:60000,stdio:['ignore','pipe','pipe']});
 try{
  call(resolve('scripts/run-engine-regression.js'),['--output',out,'--variants','canonical,hidden-quiet','--seeds','17','--workers','2','--max-plies','2','--candidate-depth','5']);const runner=join(out,'runtime/scripts/run-engine-regression.js');call(runner,['--resume',out]);const p=JSON.parse(await readFile(join(out,'progress.json')));assert.equal(p.status,'completed');assert.equal(p.completed,64);assert.equal((await readdir(join(out,'games'))).length,64);
  const manifest=JSON.parse(await readFile(join(out,'manifest.json')));assert.equal(manifest.config.candidateDepth,5);assert.equal(manifest.ai.candidate.depth,5);
  const checkpoint=JSON.parse(await readFile(join(out,'games/white__canonical__17__0.json')));assert.equal(checkpoint.engines.candidate.depth,5);
  const before=await readFile(join(out,'bundles/canonical__17.jsonl'),'utf8');assert.equal(before.trim().split('\n').length,32);call(runner,['--resume',out]);assert.equal(await readFile(join(out,'bundles/canonical__17.jsonl'),'utf8'),before);
  await writeFile(join(out,'run.lock'),String(process.pid));assert.throws(()=>call(runner,['--resume',out]),/already active/);await rm(join(out,'run.lock'));
  await writeFile(join(out,'runtime/src/search.js'),'\n// tampered\n',{flag:'a'});assert.throws(()=>call(runner,['--resume',out]),/Frozen source changed/);
 }finally{await rm(root,{recursive:true,force:true});}
});
