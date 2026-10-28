import test from 'node:test';
import assert from 'node:assert/strict';
import {createSearchEngine} from '../src/search.js';
function engine(step=1){return createSearchEngine({...(step===null?{}:{scoreStep:step}),actions:p=>p.length<4?[0,1,2]:[],apply:(p,a)=>[...p,a],turn:p=>p.length%2,key:JSON.stringify,terminal:p=>p.length===4?p.reduce((s,x,i)=>s+(i%2?-1:1)*(x+1)*(i+2),0):null,evaluate:p=>p.reduce((s,x)=>s+x,0)});}
test('optional root probes preserve exact scores, MultiPV, defaults and caps',()=>{
 const e=engine(),p=[];
 for(const options of [{depth:4},{depth:4,iterativeDeepening:true,aspirationWindow:1},{depth:4,multiPv:3},{depth:4,useCache:false},{depth:4,random:()=>0.4}]){
  const base=e.choose(p,options),off=e.choose(p,{...options,rootPrincipalVariation:false}),on=e.choose(p,{...options,rootPrincipalVariation:true});
  assert.deepEqual(off,base);assert.equal(on.score,base.score);assert.equal(on.completedDepth,4);assert.equal(on.pv.length,4);if(options.multiPv)assert.deepEqual(on.variations,base.variations);
 }
 for(const n of [1,10,50]){const r=e.choose(p,{depth:8,maxNodes:n,rootPrincipalVariation:true});assert(r.nodes<=n);assert(r.stopped);}
 assert.deepEqual(p,[]);assert.throws(()=>e.choose(p,{rootPrincipalVariation:1}),/rootPrincipalVariation/);
 const generic=engine(null);assert.deepEqual(generic.choose(p,{depth:4,rootPrincipalVariation:true}),generic.choose(p,{depth:4}));
});
