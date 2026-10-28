import test from 'node:test';import assert from 'node:assert/strict';
import {createSearchEngine as candidate} from '../src/search.js';

function fixture(create,{danger=true,failChecked=false}={}){const calls=[];const e=create({scoreStep:1,actions:p=>p.n<4?[0,1]:[],apply:(p,a)=>({n:p.n+1,v:p.v+(p.n%2?-1:1)*(a+1)}),prepare:structuredClone,make:(p,a)=>{const old={...p};p.v+=(p.n%2?-1:1)*(a+1);p.n++;return old;},unmake:(p,u)=>Object.assign(p,u),turn:p=>p.n%2,key:p=>JSON.stringify(p),evaluationKey:p=>JSON.stringify(p),terminal:p=>p.n===4?p.v:null,evaluate:p=>{calls.push(p.n);if(failChecked&&p.n===1)throw Error('unused checked evaluation');return p.v;},inDanger:p=>danger&&p.n===1,noisyActions:()=>[]});return {e,calls};}
test('skip checked standpat only when existing q/evasion allowance searches replies',()=>{
 for(const q of [0,1,2])for(const ev of [0,1,2]){
 const opts={depth:1,quiescenceDepth:q,quiescenceEvasionDepth:ev,cacheEvaluation:true,cacheQuiescence:true};
 const a=fixture(candidate),p={n:0,v:0};const x=a.e.choose(p,opts);assert.equal(x.score,q||ev?0:2);assert.equal(x.action,1);assert.deepEqual(p,{n:0,v:0});
 if(q||ev)assert(!a.calls.includes(1));else assert(a.calls.includes(1));
 }
 const a=fixture(candidate,{failChecked:true});assert.doesNotThrow(()=>a.e.choose({n:0,v:0},{depth:1,quiescenceDepth:1}));
});
test('ordinary nodes retain evaluation; budgets and mutable restoration remain exact',()=>{
 for(const mutable of [true,false])for(const cap of [1,2,3,6,50]){const p={n:0,v:0};const a=fixture(candidate),b=fixture(candidate);const opts={depth:3,maxNodes:cap,quiescenceDepth:2,quiescenceEvasionDepth:1,useMutable:mutable,cacheEvaluation:true,cacheQuiescence:true};let x=a.e.choose(p,opts),y=b.e.choose(p,{...opts,useMutable:!mutable});assert.equal(x.score,y.score);assert.deepEqual(x.action,y.action);assert.equal(x.nodes,y.nodes);assert(x.nodes<=cap);assert.deepEqual(p,{n:0,v:0});}
 const a=fixture(candidate,{danger:false});const r=a.e.choose({n:0,v:0},{depth:1,quiescenceDepth:2});assert.equal(r.score,2);assert.equal(r.action,1);assert(a.calls.includes(1));
});
