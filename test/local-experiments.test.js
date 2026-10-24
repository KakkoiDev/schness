import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { tasksFor } from '../scripts/run-local-experiments.js';

test('local schedule covers all seed/variant/matchup/king combinations without duplicate tasks',()=>{
 const tasks=tasksFor({repetitions:1,variants:['canonical','permanent-loss-quiet'],seeds:[1,2,3]});assert.equal(tasks.length,480);assert.equal(new Set(tasks.map(t=>t.id)).size,480);
 for(const variant of ['canonical','permanent-loss-quiet'])for(const seed of [1,2,3]){const group=tasks.filter(t=>t.variant===variant&&t.seed===seed);assert.equal(group.length,80);assert.equal(new Set(group.map(t=>`${t.white}-${t.black}`)).size,5);assert.equal(new Set(group.map(t=>t.index%16)).size,16);}
});
test('frozen local runs checkpoint, resume idempotently, export standard games and reject source tampering',async()=>{
 const root=await mkdtemp(join(tmpdir(),'schness-local-test-'));const out=join(root,'run');
 const call=(script,args)=>execFileSync(process.execPath,[script,...args],{encoding:'utf8',timeout:60000,stdio:['ignore','pipe','pipe']});
 try{call(resolve('scripts/run-local-experiments.js'),['--output',out,'--variants','canonical,hidden-quiet','--seeds','17','--workers','2','--max-plies','2']);const runner=join(out,'runtime/scripts/run-local-experiments.js');
 call(runner,['--resume',out]);const first=JSON.parse(await readFile(join(out,'progress.json')));assert.equal(first.status,'completed');assert.equal(first.completed,160);assert.equal((await readdir(join(out,'games'))).length,160);
 const bundle=await readFile(join(out,'bundles/canonical__17.jsonl'),'utf8');assert.equal(bundle.trim().split('\n').length,80);assert.equal(JSON.parse(bundle.split('\n')[0]).ruleset.allowCheckingDrops,false);
 call(runner,['--resume',out]);assert.equal(JSON.parse(await readFile(join(out,'progress.json'))).completed,160);assert.equal(await readFile(join(out,'bundles/canonical__17.jsonl'),'utf8'),bundle);
 await writeFile(join(out,'run.lock'),String(process.pid));assert.throws(()=>call(runner,['--resume',out]),/already active/);await rm(join(out,'run.lock'));
 await writeFile(join(out,'runtime/src/rules.js'),'// tampered\n',{flag:'a'});assert.throws(()=>call(runner,['--resume',out]),/Frozen source changed/);
 }finally{await rm(root,{recursive:true,force:true});}
});
