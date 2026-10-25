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
 } finally {if(previous===undefined)delete globalThis.self;else globalThis.self=previous;}
});
