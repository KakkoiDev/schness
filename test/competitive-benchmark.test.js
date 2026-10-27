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
  const out=join(tmp,'run');execFileSync(process.execPath,['scripts/run-competitive-fairy.js','--output',out,'--seeds','1','--starts','2','--depth','20','--reduce-drops','true','--evasion-depth','2','--cache-quiescence','true','--cache-evaluation','true','--staged-moves','true','--exchange-ordering','true','--reduce-pv','false','--protect-history','true','--reserve-threats','true']);
  const m=JSON.parse(await readFile(out+'/manifest.json'));
  assert.equal(m.candidate.reserveThreatEvaluation,true);assert.equal(m.candidate.reducePrincipalVariation,false);assert.equal(m.candidate.protectHistoryMoves,true);assert.equal(m.candidate.exchangeOrdering,true);assert(m.files.some(x=>x.path==='src/exchange.js'));assert.equal(m.candidate.stagedMoveSelection,true);assert.equal(m.candidate.cacheEvaluation,true);assert.equal(m.candidate.cacheQuiescence,true);assert.equal(m.candidate.quiescenceEvasionDepth,2);assert.equal(m.candidateMillis,null);assert.equal(m.candidate.reduceQuietDrops,true);assert.equal(m.candidate.depthRequest,20);assert(!Object.hasOwn(m.candidate,'maxNodes'));
  assert.equal(m.budgetMillis,100);assert.equal(m.totalGames,4);assert.deepEqual(m.tasks.map(x=>x.color),['white','white','black','black']);
  assert.deepEqual(m.rules,{allowCheckingDrops:false,experiment:'capture-bank',bankCapacity:6});assert.equal(m.external.NNUE,false);
  assert(m.files.some(x=>x.path.endsWith('Copying.txt')));assert(m.files.some(x=>x.path.endsWith('source.tar.gz')));
  for(const file of m.files)assert.equal(createHash('sha256').update(await readFile(out+'/runtime/'+file.path)).digest('hex'),file.sha256);
 }finally{await rm(tmp,{recursive:true,force:true});}
});

test('native benchmark freezes PV reduction policy and rejects ambiguous values',async()=>{
 const tmp=await mkdtemp(join(tmpdir(),'schness-rust-freeze-'));
 try{
  for(const flag of [undefined,'false']){
   const out=join(tmp,flag??'default');
   execFileSync(process.execPath,['scripts/run-rust-fairy.js','--output',out,'--seeds','1','--starts','1',...(flag===undefined?[]:['--reduce-pv',flag])]);
   const m=JSON.parse(await readFile(out+'/manifest.json'));
   assert.equal(m.candidate.reducePrincipalVariation,flag!=='false');
   assert.equal(m.candidateMillis,100);assert.equal(m.budgetMillis,100);
   assert.deepEqual(m.tasks.map(x=>x.color),['white','black']);
   assert(m.files.some(x=>x.path==='engine-rust/src/pv-reduction-regression.json'));
   for(const f of m.files)assert.equal(createHash('sha256').update(await readFile(out+'/runtime/'+f.path)).digest('hex'),f.sha256);
   // The exact frozen options reach the process unchanged, including false.
   const {nativeEngine}=await import('../scripts/native-engine-client.js');
   const {createInitialPosition,applyAction}=await import('../src/rules.js');
   let p=createInitialPosition(m.rules);p=applyAction(p,{type:'place-king',to:12});p=applyAction(p,{type:'place-king',to:0});
   const client=nativeEngine(out+'/runtime/engine-rust/target/release/schness-engine');
   try{const r=await client.request('schness-v1',p,{...m.candidate,depth:1,maxMillis:m.candidateMillis});assert.equal(r.completedDepth,1);assert(r.action);}finally{client.close();}
  }
  assert.throws(()=>execFileSync(process.execPath,['scripts/run-rust-fairy.js','--output',join(tmp,'bad'),'--reduce-pv','no'],{stdio:'pipe'}),/reduce-pv must be true or false/);
 }finally{await rm(tmp,{recursive:true,force:true});}
});
