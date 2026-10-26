import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm}from'node:fs/promises';
import {tmpdir}from'node:os';
import {join}from'node:path';
import {execFileSync}from'node:child_process';
import {createHash}from'node:crypto';
test('competitive benchmark freezes uncapped budgets, both colors, rules and licensed opponent',async()=>{
 const tmp=await mkdtemp(join(tmpdir(),'schness-competitive-'));
 try{
  const out=join(tmp,'run');execFileSync(process.execPath,['scripts/run-competitive-fairy.js','--output',out,'--seeds','1','--starts','2','--depth','20']);
  const m=JSON.parse(await readFile(out+'/manifest.json'));
  assert.equal(m.candidateMillis,null);assert.equal(m.candidate.depthRequest,20);assert(!Object.hasOwn(m.candidate,'maxNodes'));
  assert.equal(m.budgetMillis,100);assert.equal(m.totalGames,4);assert.deepEqual(m.tasks.map(x=>x.color),['white','white','black','black']);
  assert.deepEqual(m.rules,{allowCheckingDrops:false,experiment:'capture-bank',bankCapacity:6});assert.equal(m.external.NNUE,false);
  assert(m.files.some(x=>x.path.endsWith('Copying.txt')));assert(m.files.some(x=>x.path.endsWith('source.tar.gz')));
  for(const file of m.files)assert.equal(createHash('sha256').update(await readFile(out+'/runtime/'+file.path)).digest('hex'),file.sha256);
 }finally{await rm(tmp,{recursive:true,force:true});}
});
