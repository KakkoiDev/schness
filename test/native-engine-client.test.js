import test from 'node:test';
import assert from 'node:assert/strict';
import {nativeEngine} from '../scripts/native-engine-client.js';
test('native client correlates serialized responses and propagates engine errors',async()=>{
 const js="const rl=require('readline').createInterface({input:process.stdin});rl.on('line',s=>{const r=JSON.parse(s);console.log(JSON.stringify(r.game==='bad'?{id:r.id,error:{message:'bad request'}}:{id:r.id,ok:true}));});";
 const client=nativeEngine(process.execPath,['-e',js]);try{const [a,b]=await Promise.all([client.request('good',{}),client.request('good',{})]);assert.equal(a.id,1);assert.equal(b.id,2);await assert.rejects(client.request('bad',{}),/bad request/);}finally{client.close();}
});
test('native process exit rejects pending work instead of hanging the tournament',async()=>{
 const client=nativeEngine(process.execPath,['-e','process.stdin.once("data",()=>process.exit(3));']);try{await assert.rejects(client.request('good',{}),/exited 3/);}finally{client.close();}
});
test('native correlation mismatch is rejected',async()=>{
 const client=nativeEngine(process.execPath,['-e','process.stdin.once("data",()=>console.log(JSON.stringify({id:999})));']);try{await assert.rejects(client.request('good',{}),/correlation mismatch/);}finally{client.close();}
});
