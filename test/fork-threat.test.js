import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {analyzeAction,hasMaterialFork} from '../src/bot.js';import {createSearchEngine} from '../src/search.js';import * as rules from '../src/rules.js';
const p=JSON.parse(readFileSync(new URL('./fixtures/fork-threat.json',import.meta.url)));
test('optional fork responses search quiet defenses with bounded budgets and exact restoration',()=>{
 const saved=structuredClone(p),options={profile:'competitive',depth:4,quiescenceDepth:4,quiescenceChecks:true,quiescenceEvasionDepth:2,lateMoveReduction:false,stopOnProvenWin:false,maxNodes:100000,maxMillis:1500};
 const base=analyzeAction(p,options),off=analyzeAction(p,{...options,forkThreatEvasions:false}),on=analyzeAction(p,{...options,forkThreatEvasions:true});assert.deepEqual(off,base);assert.equal(rules.actionKey(base.action),'drop:bishop:2');assert.equal(rules.actionKey(on.action),'drop:rook:15');assert.equal(on.completedDepth,4);
 const immutable=analyzeAction(p,{...options,forkThreatEvasions:true,useMutable:false});assert.equal(immutable.score,on.score);for(const r of [on,immutable]){let q=p;for(const a of r.pv)q=rules.applyAction(q,a);}
 for(const n of [1,25,100]){const r=analyzeAction(p,{...options,depth:20,maxNodes:n,forkThreatEvasions:true});assert(r.nodes<=n);assert(r.stopped);assert(r.completedDepth<20);let q=p;for(const a of r.pv)q=rules.applyAction(q,a);}
 assert.deepEqual(p,saved);assert.throws(()=>analyzeAction(p,{forkThreatEvasions:1}),/forkThreatEvasions/);
});
test('fork geometry distinguishes a shared attacker from separate attacks and actual check',()=>{
 let q=rules.applyAction(p,{type:'drop',piece:'bishop',to:2});q=rules.applyAction(q,{type:'drop',piece:'rook',to:3});assert(hasMaterialFork(q));assert.equal(rules.isInCheck(q,q.turn),false);q.board[7]=null;assert.equal(hasMaterialFork(q),false);
});
test('fork response mode never turns a selective winning score into an early mate proof',()=>{
 const engine=createSearchEngine({actions:()=>[0],apply:p=>p+1,turn:p=>p%2,key:String,terminal:(p,who,d)=>p?1000+d:null,evaluate:()=>0,isProvenWin:s=>s>=1000,quiescenceDanger:()=>true});
 const r=engine.choose(0,{depth:4,iterativeDeepening:true,stopOnProvenWin:true,forkThreatEvasions:true});assert.equal(r.completedDepth,4);
});
