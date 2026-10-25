import test from 'node:test';
import assert from 'node:assert/strict';
import * as rules from '../src/rules.js';
import * as baseline from '../research/search-performance-v4/baseline-rules.js';
import {analyzeAction} from '../src/bot.js';
import {analyzeAction as oldBot} from '../research/search-performance-v4/baseline-bot.js';
import {createSearchEngine} from '../src/search.js';
import {VARIANTS} from '../src/variants.js';

function rng(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}

test('direct generation and count-only mobility match frozen legal lists across every preset',()=>{
 const random=rng(20261025);let checks=0;
 for(const [id,recipe]of Object.entries(VARIANTS)){
  let p=rules.createInitialPosition(recipe);
  for(let ply=0;ply<70;ply++){
   const expected=baseline.legalActions(p),actual=rules.legalActions(p);
   assert.deepEqual(actual,expected,id+' '+ply);assert.equal(rules.countLegalActionsUnchecked(p),actual.length);assert.deepEqual(rules.getResultUnchecked(p,actual.length),baseline.getResult(p));
   if(p.phase==='play')for(const turn of ['white','black']){const q={...p,turn};assert.equal(rules.countLegalActionsUnchecked(q),baseline.legalActions(q).length);checks++;}
   assert.deepEqual(rules.getResult(p),baseline.getResult(p));if(rules.getResult(p)||!actual.length)break;
   p=rules.applyAction(p,actual[Math.floor(random()*actual.length)]);
  }
 }
 assert(checks>1000);
});

test('check and pin prefilters preserve every move on randomized positions',()=>{
 const random=rng(77),pieces=['rook','bishop','knight'];
 for(let i=0;i<1000;i++){
  const board=Array.from({length:16},()=>random()<0.6?null:{owner:random()<0.5?'white':'black',piece:pieces[Math.floor(random()*3)]});
  const white=Math.floor(random()*16);let black=Math.floor(random()*15);if(black>=white)black++;
  board[white]={owner:'white',piece:'king'};board[black]={owner:'black',piece:'king'};
  const p=rules.createPosition({board,banks:{white:['rook','bishop','knight'],black:['rook','bishop','knight']},turn:random()<0.5?'white':'black',rules:{allowCheckingDrops:i%2===0}});
  const saved=structuredClone(p);assert.deepEqual(rules.legalActions(p),baseline.legalActions(p));assert.equal(rules.countLegalActionsUnchecked(p),baseline.legalActions(p).length);assert.deepEqual(p,saved);
 }
});

test('public actions remain independent while trusted search actions are frozen pooled values',()=>{
 const p=rules.createInitialPosition(),a=rules.legalActions(p);a[0].to=99;assert.equal(rules.legalActions(p)[0].to,12);
 const one=rules.legalActionsUnchecked(p),two=rules.legalActionsUnchecked(p);assert.notEqual(one,two);assert.equal(one[0],two[0]);assert(Object.isFrozen(one[0]));assert.throws(()=>{one[0].to=99;});
});

test('leaf mobility uses count-only generation and rejects invalid adapter counts',()=>{
 let arrays=0,counts=0;
 const adapter={actions:p=>{arrays++;return p.n?[1,2].filter(a=>a<=p.n):[];},countActions:p=>{counts++;return Math.min(2,p.n);},apply:(p,a)=>({n:p.n-a,turn:1-p.turn}),turn:p=>p.turn,key:p=>JSON.stringify(p),terminal:(p,who,d,f)=>f.actionCount()?null:0,evaluate:(p,who,f)=>f.actionCount()};
 const engine=createSearchEngine(adapter),actual=engine.choose({n:5,turn:0},{depth:1});assert.equal(arrays,1);assert.equal(counts,2);assert.equal(actual.stats.countGenerations,2);
 assert.equal(actual.score,createSearchEngine({...adapter,countActions:undefined}).choose({n:5,turn:0},{depth:1}).score);
 assert.throws(()=>createSearchEngine({...adapter,countActions:()=>-1}).choose({n:5,turn:0},{depth:1}),/nonnegative integer/);
});

test('linked principal variations remain legal, independent and equal-score to frozen search',()=>{
 for(const recipe of [VARIANTS.canonical,VARIANTS.unrestricted,VARIANTS['capture-bank-3-checking'],VARIANTS['no-drop-mate']]){
  let p=rules.createInitialPosition(recipe);p=rules.applyAction(p,{type:'place-king',to:15});p=rules.applyAction(p,{type:'place-king',to:0});
  for(const options of [{depth:4,multiPv:3},{depth:2,quiescenceDepth:2,multiPv:3},{depth:4,iterativeDeepening:true},{depth:3,useCache:false}]){
   const result=analyzeAction(p,options),saved=structuredClone(result);assert.equal(result.score,oldBot(p,options).score);
   for(const line of result.variations){let q=p;for(const a of line.pv)q=rules.applyAction(q,a);}
   analyzeAction(p,{depth:3,maxNodes:300});assert.deepEqual(result,saved);
  }
 }
});
