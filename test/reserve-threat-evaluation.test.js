import test from 'node:test';import assert from 'node:assert/strict';import {reservePressure,schnessSearch,analyzeAction} from '../src/bot.js';import * as r from '../src/rules.js';
function position(allowCheckingDrops){let p=r.createInitialPosition({experiment:'capture-bank',bankCapacity:6,allowCheckingDrops});p=r.applyAction(p,{type:'place-king',to:15});p=r.applyAction(p,{type:'place-king',to:0});p.banks.white=['bishop'];p.banks.black=[];return p;}
test('reserve pressure uses legal deployments and does not invent checking drops',()=>{
 const quiet=position(false),checking=position(true),saved=structuredClone(quiet);assert(reservePressure(checking,'white')>reservePressure(quiet,'white'));assert.deepEqual(quiet,saved);
 assert.equal(reservePressure(quiet,'black'),0);const a=reservePressure(quiet,'white');quiet.banks.white.push('bishop');assert.equal(reservePressure(quiet,'white'),a);
});
test('reserve evaluation is color symmetric, bounded, explicit and preserves state',()=>{
 const p=position(false),saved=structuredClone(p),swapped={...p,turn:'black',board:p.board.map(o=>o?{...o,owner:o.owner==='white'?'black':'white'}:null),banks:{white:p.banks.black,black:p.banks.white},repetitions:{}};
 const o={profile:'competitive',reserveThreatEvaluation:true};assert.equal(schnessSearch.score(p,'white',0,o),schnessSearch.score(swapped,'black',0,o));
 assert(reservePressure(p,'white')<=80);assert.deepEqual(p,saved);assert.throws(()=>analyzeAction(p,{reserveThreatEvaluation:1}),/reserveThreatEvaluation/);
});
test('reserve threat heuristic cannot override independently verified tactical mates',async()=>{
 const {readFile}=await import('node:fs/promises');const corpus=JSON.parse(await readFile(new URL('../research/search-performance-v5/tactical-corpus.json',import.meta.url)));
 for(const f of corpus.cases){const a=analyzeAction(f.position,{profile:'competitive',reserveThreatEvaluation:true,depth:f.depth,quiescenceDepth:0,lateMoveReduction:false});assert(a.score>=1000000,f.id);assert(f.winningActions.includes(r.actionKey(a.action)),f.id);}
});
