import test from 'node:test';
import assert from 'node:assert/strict';
import {estimateExchange} from '../src/exchange.js';
import {analyzeAction} from '../src/bot.js';
import * as r from '../src/rules.js';
function p(experiment='capture-bank'){
 const board=Array(16).fill(null);for(const [i,owner,piece] of [[12,'white','king'],[3,'black','king'],[4,'white','rook'],[5,'black','bishop'],[7,'black','rook']])board[i]={owner,piece};
 return {board,turn:'white',banks:{white:[],black:[]},rules:{experiment,bankCapacity:6}};
}
const capture={type:'move',from:4,to:5};
test('exchange ordering values ownership transfer and bank overflow',()=>{
 const a=p(),saved=structuredClone(a);assert.equal(estimateExchange(a,capture),-360);assert.deepEqual(a,saved);
 assert.equal(estimateExchange(p('classic'),capture),-180);
 a.banks.white=Array(6).fill('knight');assert.equal(estimateExchange(a,capture),-1000);
});
test('exchange estimate rejects pinned recaptures and allows declining exchanges',()=>{
 const a=p();a.board[11]={owner:'white',piece:'rook'};assert.equal(estimateExchange(a,capture),660);
 const b=p();b.board[11]={owner:'white',piece:'knight'};assert.equal(estimateExchange(b,capture),660);
});
test('drop exposure includes reserve value without changing state',()=>{
 const a=p();a.board[4]=null;a.board[5]=null;a.banks.white=['bishop'];const saved=structuredClone(a);
 assert.equal(estimateExchange(a,{type:'drop',piece:'bishop',to:5}),-640);assert.deepEqual(a,saved);
});
test('exchange-only ordering preserves nonselective search scores and public state',()=>{
 let a=r.createInitialPosition({experiment:'capture-bank',bankCapacity:6,allowCheckingDrops:false});a=r.applyAction(a,{type:'place-king',to:12});a=r.applyAction(a,{type:'place-king',to:0});const saved=structuredClone(a);
 const options={profile:'competitive',depth:3,quiescenceDepth:1,lateMoveReduction:false,stopOnProvenWin:false};
 assert.equal(analyzeAction(a,options).score,analyzeAction(a,{...options,exchangeOrdering:true}).score);assert.deepEqual(a,saved);
 assert.throws(()=>analyzeAction(a,{exchangeOrdering:'yes'}),/exchangeOrdering/);
});
