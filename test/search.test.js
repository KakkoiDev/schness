import test from 'node:test';
import assert from 'node:assert/strict';
import {createSearchEngine,strengthOptions} from '../src/search.js';
import {analyzeAction} from '../src/bot.js';
import {createInitialPosition,applyAction,legalActions,actionKey} from '../src/rules.js';
function game(misere=false){return createSearchEngine({actions:p=>[1,2].filter(n=>n<=p.n),apply:(p,n)=>({n:p.n-n,turn:1-p.turn}),turn:p=>p.turn,key:p=>`${p.n}:${p.turn}`,evaluate:()=>0,terminal:(p,who,d)=>p.n?null:((misere?p.turn:1-p.turn)===who?1000+d:-1000-d)});}
test('search supports different win/loss objectives without changes to search',()=>{
 assert.equal(game().choose({n:2,turn:0},{depth:3}).action,2);
 assert.equal(game(true).choose({n:2,turn:0},{depth:3}).action,1);
 assert.equal(game().choose({n:0,turn:0}).action,null);
});
test('budgeted iterative search respects node cap and returns only complete depth or legal fallback',()=>{
 const engine=game(),p={n:8,turn:0};const r=engine.choose(p,{depth:8,maxNodes:1});assert.equal(r.nodes,1);assert.equal(r.completedDepth,0);assert.equal(r.stopped,true);assert.ok([1,2].includes(r.action));
 const a=engine.choose(p,{depth:4,maxNodes:10000});assert.equal(a.completedDepth,4);assert.equal(a.stopped,false);assert.equal(a.action,engine.choose(p,{depth:4}).action);
});
test('strength is a validated deterministic budget, not a claimed Elo',()=>{
 for(let s=0;s<=100;s++){const a=strengthOptions(s);assert.ok(a.depth>=1&&a.depth<=6);if(s)assert.ok(a.maxNodes>=strengthOptions(s-1).maxNodes);}
 for(const bad of [-1,101,NaN])assert.throws(()=>strengthOptions(bad));
 for(const options of [{depth:0},{depth:13},{maxNodes:0},{maxMillis:-1}])assert.throws(()=>game().choose({n:2,turn:0},options));
});
test('Schness adapter budgets return a legal action without mutating position',()=>{
 let p=createInitialPosition();p=applyAction(p,{type:'place-king',to:15});p=applyAction(p,{type:'place-king',to:0});const saved=structuredClone(p);
 const r=analyzeAction(p,{strength:20,maxNodes:100});assert.ok(r.nodes<=100);assert.ok(legalActions(p).some(a=>actionKey(a)===actionKey(r.action)));assert.deepEqual(p,saved);
});
