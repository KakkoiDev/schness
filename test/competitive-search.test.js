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
