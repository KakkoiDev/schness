import test from 'node:test';
import assert from 'node:assert/strict';
import {createInitialPosition} from '../src/rules.js';
test('worker preserves move protocol and offers explicit analysis with correlated errors',async()=>{
 const previous=globalThis.self;let handler;const replies=[];
 globalThis.self={addEventListener:(event,fn)=>{assert.equal(event,'message');handler=fn;},postMessage:reply=>replies.push(reply)};
 try {
  await import('../src/bot-worker.js');
  handler({data:{position:createInitialPosition(),strength:0,request:'old'}});
  assert.deepEqual(Object.keys(replies[0]).sort(),['action','request']);assert.equal(replies[0].request,'old');assert.ok(replies[0].action);
  handler({data:{position:createInitialPosition(),strength:1,maxNodes:200,analyze:true,multiPv:3,request:'analysis'}});
  assert.equal(replies[1].request,'analysis');assert.equal(replies[1].analysis.requestedDepth,1);assert.deepEqual(replies[1].action,replies[1].analysis.action);
  handler({data:{position:createInitialPosition(),strength:101,request:'bad'}});
  assert.equal(replies[2].request,'bad');assert.match(replies[2].error,/Level/);
  handler({data:{position:createInitialPosition(),depth:1,quiescenceDepth:1,quiescenceChecks:true,lateMoveReduction:true,analyze:true,request:'experimental'}});
  assert.equal(replies[3].request,'experimental');assert(replies[3].analysis);
  handler({data:{position:createInitialPosition(),profile:'competitive',maxNodes:100,analyze:true,request:'competitive'}});
  assert.equal(replies.at(-1).request,'competitive');assert.equal(replies.at(-1).analysis.requestedDepth,20);assert(replies.at(-1).analysis.stopped);
  for(const name of ['quiescenceChecks','lateMoveReduction']){
   handler({data:{position:createInitialPosition(),[name]:1,request:name}});
   assert.match(replies.at(-1).error,new RegExp(name));assert.equal(replies.at(-1).request,name);
  }
 } finally {if(previous===undefined)delete globalThis.self;else globalThis.self=previous;}
});
