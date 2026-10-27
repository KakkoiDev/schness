import test from 'node:test';
import assert from 'node:assert/strict';
import {strengthOptions,createSearchEngine} from '../src/search.js';
import {analyzeAction,schnessSearch,COMPETITIVE_OPTIONS} from '../src/bot.js';
import * as r from '../src/rules.js';

function position(){let p=r.createInitialPosition({experiment:'capture-bank',bankCapacity:6,allowCheckingDrops:false});p=r.applyAction(p,{type:'place-king',to:15});return r.applyAction(p,{type:'place-king',to:0});}
test('numeric levels have no hidden node cap, explicit budgets remain effective',()=>{
 for(const n of [0,1,20,100])assert.deepEqual(strengthOptions(n),{depth:n,maxNodes:Infinity});
 const engine=createSearchEngine({actions:p=>p.n?[1]:[],apply:p=>({n:p.n-1,turn:1-p.turn}),turn:p=>p.turn,key:p=>String(p.n),terminal:p=>p.n?null:0,evaluate:()=>3});
 const result=engine.choose({n:25,turn:0},{strength:20});assert.equal(result.completedDepth,20);assert.equal(result.nodes,20);assert.equal(result.stopped,false);
 const stopped=engine.choose({n:25,turn:0},{strength:20,maxNodes:10});assert(stopped.stopped);assert(stopped.completedDepth<20);assert.equal(stopped.nodes,10);
});
test('competitive cache, immutable oracle and repeated history agree without reductions',()=>{
 let p=position();
 for(const a of r.legalActions(p).slice(0,3))p.repetitions[r.positionKey(r.applyAction(p,a))]=2;
 const saved=structuredClone(p),options={profile:'competitive',depth:3,quiescenceDepth:1,lateMoveReduction:false,stopOnProvenWin:false,iterativeDeepening:false};
 const result=analyzeAction(p,options);
 for(const extra of [{useCache:false},{useMutable:false},{maxTableEntries:1}])assert.equal(analyzeAction(p,{...options,...extra}).score,result.score);
 assert.deepEqual(p,saved);
});
test('competitive evaluation is color symmetric and finite',()=>{
 let p=position();p=r.applyAction(p,r.legalActions(p).find(a=>a.type==='drop'));
 const swapped={...p,turn:p.turn==='white'?'black':'white',board:p.board.map(o=>o?{...o,owner:o.owner==='white'?'black':'white'}:null),banks:{white:p.banks.black,black:p.banks.white},repetitions:{}};
 const options={profile:'competitive'};
 const value=schnessSearch.score(p,'white',0,options),other=schnessSearch.score(swapped,'black',0,options);
 assert(Number.isFinite(value));assert.equal(value,other);
});
test('competitive depth requests and cancellation are honest and preserve inputs',()=>{
 const p=position(),saved=structuredClone(p);
 const result=analyzeAction(p,{profile:'competitive',maxNodes:100});
 assert.equal(COMPETITIVE_OPTIONS.depth,20);assert.equal(result.requestedDepth,20);assert(result.stopped);assert(result.completedDepth<20);assert(result.nodes<=100);
 assert(r.legalActions(p).some(a=>r.actionKey(a)===r.actionKey(result.action)));assert.deepEqual(p,saved);
 assert.throws(()=>analyzeAction(p,{profile:'typo'}),/profile/);
});
test('proven wins can finish early without claiming the requested depth',()=>{
 const engine=createSearchEngine({actions:()=>[0],apply:()=>1,turn:p=>p,key:String,terminal:(p,who,d)=>p?1000+d:null,evaluate:()=>0,isProvenWin:s=>s>=1000});
 const result=engine.choose(0,{depth:20,iterativeDeepening:true,stopOnProvenWin:true});
 assert.equal(result.completedDepth,1);assert.equal(result.requestedDepth,20);assert.equal(result.stopped,false);assert.equal(result.score,1000);
});
test('selective reductions never trigger the proven-win early exit',()=>{
 const engine=createSearchEngine({actions:()=>[0],apply:()=>1,turn:p=>p,key:String,terminal:(p,who,d)=>p?1000+d:null,evaluate:()=>0,isProvenWin:s=>s>=1000,canReduce:()=>false});
 const result=engine.choose(0,{depth:20,iterativeDeepening:true,stopOnProvenWin:true,lateMoveReduction:true});
 assert.equal(result.completedDepth,20);
});
test('iteration telemetry reports only finished depths and rejects invalid callbacks',()=>{
 const seen=[],engine=createSearchEngine({actions:p=>p<9?[1]:[],apply:p=>p+1,turn:p=>p%2,key:String,terminal:p=>p===9?0:null,evaluate:()=>0});
 const result=engine.choose(0,{depth:20,maxNodes:12,onIteration:x=>seen.push(x)});
 assert(result.stopped);assert.deepEqual(seen.map(x=>x.depth),Array.from({length:result.completedDepth},(_,i)=>i+1));
 assert(seen.every(x=>Number.isFinite(x.score)&&x.nodes<=12));
 assert.throws(()=>engine.choose(0,{onIteration:true}),/onIteration/);
});
test('competitive evaluation preserves every independently verified mate fixture',async()=>{
 const {readFile}=await import('node:fs/promises');
 const corpus=JSON.parse(await readFile(new URL('../research/search-performance-v5/tactical-corpus.json',import.meta.url)));
 for(const fixture of corpus.cases){
  const result=analyzeAction(fixture.position,{profile:'competitive',depth:fixture.depth,quiescenceDepth:0,lateMoveReduction:false});
  assert(result.score>=1_000_000,fixture.id);assert(fixture.winningActions.includes(r.actionKey(result.action)),fixture.id);
 }
});
test('quiet-drop reduction is explicit, saves work, and keeps legal immutable input',()=>{
 const p=position(),saved=structuredClone(p),options={profile:'competitive',depth:5,quiescenceDepth:0,iterativeDeepening:true};
 const prior=analyzeAction(p,options),reduced=analyzeAction(p,{...options,reduceQuietDrops:true});
 assert(reduced.stats.reducedSearches>0);assert(reduced.nodes<prior.nodes);
 assert(r.legalActions(p).some(a=>r.actionKey(a)===r.actionKey(reduced.action)));assert.deepEqual(p,saved);
 const exact=analyzeAction(p,{...options,lateMoveReduction:false,reduceQuietDrops:true});
 assert.equal(exact.score,analyzeAction(p,{...options,lateMoveReduction:false}).score);
 assert.throws(()=>analyzeAction(p,{reduceQuietDrops:1}),/reduceQuietDrops/);
});

test('bounded quiescence evasions resolve a checked horizon without stand-pat',()=>{
 // The tempting checking line looks +100 at the horizon, but its forced reply
 // loses. The safe alternative is +5. Static evaluation must not skip the reply.
 const engine=createSearchEngine({
  actions:p=>p==='root'?['check','safe']:p==='check'?['reply']:[],
  apply:(p,a)=>p==='root'?a:'loss',turn:p=>p==='root'?0:1,key:String,
  terminal:p=>p==='loss'?-1000:p==='safe'?5:null,
  evaluate:()=>100,inDanger:p=>p==='check',noisyActions:()=>[],
 });
 const baseline=engine.choose('root',{depth:1,quiescenceDepth:0});
 assert.equal(baseline.action,'check');
 const fixed=engine.choose('root',{depth:1,quiescenceDepth:0,quiescenceEvasionDepth:2});
 assert.equal(fixed.action,'safe');assert.equal(fixed.score,5);assert.equal(fixed.completedDepth,1);
 assert.throws(()=>engine.choose('root',{quiescenceEvasionDepth:9}),/quiescenceEvasionDepth/);
});
test('quiescence evasion allowance is bounded even for endless checks',()=>{
 const engine=createSearchEngine({actions:()=>[0],apply:p=>p+1,turn:p=>p%2,key:String,terminal:()=>null,evaluate:()=>7,inDanger:()=>true});
 const result=engine.choose(0,{depth:1,quiescenceDepth:0,quiescenceEvasionDepth:2});
 assert.equal(result.nodes,3);assert.equal(result.score,7);assert.equal(result.stopped,false);
 const capped=engine.choose(0,{depth:1,quiescenceEvasionDepth:8,maxNodes:2});
 assert(capped.stopped);assert(capped.nodes<=2);
});

test('quiescence cache reuses exact-history states without changing results',()=>{
 const engine=createSearchEngine({
  actions:p=>p<7?[1,2]:[],apply:(p,a)=>Math.min(7,p+a),turn:p=>p%2,key:String,
  terminal:(p,who)=>p===7?9:null,evaluate:p=>p-3,inDanger:p=>p===4,
  noisyActions:(p,a)=>a,
 });
 const options={depth:2,quiescenceDepth:4,quiescenceEvasionDepth:2,principalVariation:false,iterativeDeepening:false};
 const plain=engine.choose(0,options),cached=engine.choose(0,{...options,cacheQuiescence:true});
 assert.equal(cached.score,plain.score);assert.equal(cached.action,plain.action);
 assert(cached.nodes<plain.nodes);assert(cached.stats.cacheHits>plain.stats.cacheHits);
 assert.equal(engine.choose(0,{...options,cacheQuiescence:true,useCache:false}).score,plain.score);
 assert.equal(engine.choose(0,{...options,cacheQuiescence:true,maxTableEntries:1}).score,plain.score);
 assert.throws(()=>engine.choose(0,{cacheQuiescence:1}),/cacheQuiescence/);
});
test('Schness quiescence cache preserves repeated-history evaluation and input',()=>{
 const p=position(),saved=structuredClone(p);
 for(const move of r.legalActions(p).slice(0,4))p.repetitions[r.positionKey(r.applyAction(p,move))]=2;
 const before=structuredClone(p),options={profile:'competitive',depth:3,quiescenceDepth:2,quiescenceEvasionDepth:2,lateMoveReduction:false,iterativeDeepening:false};
 const plain=analyzeAction(p,options),cached=analyzeAction(p,{...options,cacheQuiescence:true});
 assert.equal(cached.score,plain.score);assert.deepEqual(p,before);
 assert.equal(analyzeAction(p,{...options,cacheQuiescence:true,useMutable:false}).score,plain.score);
 assert(saved.board.every((o,i)=>JSON.stringify(o)===JSON.stringify(p.board[i])));
});

test('static evaluation cache requires explicit history-independent key and preserves search',()=>{
 const p=position(),before=structuredClone(p),options={profile:'competitive',depth:4,quiescenceDepth:2,quiescenceEvasionDepth:2,lateMoveReduction:false,iterativeDeepening:false};
 const plain=analyzeAction(p,options),cached=analyzeAction(p,{...options,cacheEvaluation:true});
 assert.equal(cached.score,plain.score);assert.deepEqual(cached.action,plain.action);assert.equal(cached.nodes,plain.nodes);
 assert(cached.stats.evaluations<plain.stats.evaluations);assert.deepEqual(p,before);
 assert.equal(analyzeAction(p,{...options,cacheEvaluation:true,maxTableEntries:1}).score,plain.score);
 const generic=createSearchEngine({actions:()=>[0],apply:()=>1,turn:()=>0,key:String,terminal:()=>null,evaluate:()=>0});
 assert.throws(()=>generic.choose(0,{cacheEvaluation:true}),/evaluationKey/);
 assert.throws(()=>analyzeAction(p,{cacheEvaluation:1}),/cacheEvaluation/);
});
test('lazy ranked moves survive nested searches and preserve exact traversal and cancellation',()=>{
 const p=position(),saved=structuredClone(p);
 for(const options of [{depth:4,quiescenceDepth:1,lateMoveReduction:false},{depth:7,maxNodes:400,quiescenceDepth:2,lateMoveReduction:true}]){
  const base={profile:'competitive',stopOnProvenWin:false,random:()=>0.5,...options};
  const a=analyzeAction(p,base),b=analyzeAction(p,{...base,stagedMoveSelection:true});
  for(const field of ['score','nodes','completedDepth','stopped'])assert.equal(b[field],a[field],field);
  assert.deepEqual(b.action,a.action);assert.deepEqual(b.pv,a.pv);assert.deepEqual(p,saved);
 }
 assert.throws(()=>analyzeAction(p,{stagedMoveSelection:1}),/stagedMoveSelection/);
});
test('staged independent scoring skips quiet groups after tactical cutoffs',()=>{
 let scored=0;
 const engine=createSearchEngine({orderIndependent:true,scoreStep:1,actions:p=>p.length<4?[0,1,2,3]:[],apply:(p,a)=>p+String(a),turn:p=>p.length%2,key:String,terminal:p=>p.length===4?0:null,evaluate:()=>0,isTactical:(_p,a)=>a===0,order:(_p,a)=>{scored+=a.length;return a;}});
 const options={depth:4,useCache:false,useHistory:false,aspiration:false,principalVariation:false};
 const a=engine.choose('',options),eager=scored;scored=0;
 const b=engine.choose('',{...options,stagedMoveSelection:true}),lazy=scored;
 assert.equal(a.score,b.score);assert.deepEqual(a.action,b.action);assert.equal(a.nodes,b.nodes);assert(lazy<eager,`${lazy} >= ${eager}`);
});
