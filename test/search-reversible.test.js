import test from 'node:test';
import assert from 'node:assert/strict';
import * as rules from '../src/rules.js';
import * as old from '../research/search-performance-v3/baseline-rules.js';
import {analyzeAction,scorePosition} from '../src/bot.js';
import {analyzeAction as baseline,scorePosition as oldScore} from '../research/search-performance-v3/baseline-bot.js';
import {createSearchEngine} from '../src/search.js';
import {VARIANTS} from '../src/variants.js';
import {boardMasks,masksAfter} from '../src/board-masks.js';

function random(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}

test('4×4 masks match independent legacy attacks, including blockers and duplicate pieces',()=>{
 const rng=random(42),pieces=['king','rook','bishop','knight'];
 for(let i=0;i<500;i++){
  const board=Array.from({length:16},()=>rng()<0.5?null:{owner:rng()<0.5?'white':'black',piece:pieces[Math.floor(rng()*4)]});
  const p={board};
  for(let square=0;square<16;square++)for(const player of ['white','black'])assert.equal(rules.isSquareAttacked(p,square,player),old.isSquareAttacked(p,square,player));
  for(const player of ['white','black'])assert.equal(rules.isInCheck(p,player),old.isInCheck(p,player));
 }
});

test('all production presets retain legal moves, results and reversible transitions',()=>{
 const rng=random(904),seen=new Set();let transitions=0;
 for(const [id,recipe] of Object.entries(VARIANTS)){
  let p=rules.createInitialPosition(recipe),legacy=old.createInitialPosition(recipe);
  const initial=rules.createSearchPosition(p),mutable=rules.createSearchPosition(p),undos=[];
  for(let ply=0;ply<45;ply++){
   const actions=rules.legalActions(p);assert.deepEqual(actions,old.legalActions(legacy),`${id} ${ply}`);assert.deepEqual(rules.getResult(p),old.getResult(legacy));
   for(const action of actions){
    const saved=structuredClone(mutable),undo=rules.makeSearchAction(mutable,action,masksAfter(boardMasks(mutable.board),mutable.board,mutable.turn,action));
    assert.deepEqual(mutable,rules.applyAction(p,action),`${id} ${rules.actionKey(action)}`);
    rules.unmakeSearchAction(mutable,undo);assert.deepEqual(mutable,saved);transitions++;
   }
   if(rules.getResult(p)||!actions.length)break;
   const a=actions[Math.floor(rng()*actions.length)];seen.add(a.type);
   undos.push(rules.makeSearchAction(mutable,a));p=rules.applyAction(p,a);legacy=old.applyAction(legacy,a);assert.deepEqual(p,legacy);
  }
  while(undos.length)rules.unmakeSearchAction(mutable,undos.pop());assert.deepEqual(mutable,initial);
 }
 assert.deepEqual([...seen].sort(),['drop','move','place-king']);assert(transitions>10000);
});

test('incremental evaluation and mutable search agree with the legacy engine for every preset',()=>{
 const rng=random(803);
 for(const [id,recipe] of Object.entries(VARIANTS)){
  let p=rules.createInitialPosition(recipe);
  for(let ply=0;ply<18;ply++){
   assert.equal(scorePosition(p,0),oldScore(p,0),`${id} static ${ply}`);
   const actions=rules.legalActions(p);if(rules.getResult(p)||!actions.length)break;
   for(const line of analyzeAction(p,{depth:1,multiPv:10}).variations){
     const child=rules.applyAction(p,line.action);
     assert.equal(line.score,(oldScore(child,0)*(p.turn==='white'?1:-1))||0,`${id} delta ${ply} ${rules.actionKey(line.action)}`);
   }
   p=rules.applyAction(p,actions[Math.floor(rng()*actions.length)]);
  }
  const saved=structuredClone(p),opts={depth:3,multiPv:3,repetitionAversion:true};
  const actual=analyzeAction(p,opts),expected=baseline(p,opts),immutable=analyzeAction(p,{...opts,useMutable:false});
  assert.equal(actual.score,expected.score,id);assert.equal(actual.score,immutable.score,id);
  assert.equal(actual.completedDepth,expected.completedDepth,id);
  for(const line of actual.variations){let q=p;for(const a of line.pv)q=rules.applyAction(q,a);}
  assert.deepEqual(p,saved,id);
 }
});

test('reversible search unwinds on budget exhaustion and adapter exceptions',()=>{
 let working,applies=0,undoCount=0;
 const original={n:7,turn:0},saved=structuredClone(original);
 const adapter={prepare:p=>(working=structuredClone(p)),actions:p=>p.n?[1,2].filter(x=>x<=p.n):[],
  apply:()=>{applies++;throw Error('immutable path used');},
  make:(p,a)=>{const old={...p};p.n-=a;p.turn=1-p.turn;return old;},
  unmake:(p,u)=>{Object.assign(p,u);undoCount++;},turn:p=>p.turn,key:p=>JSON.stringify(p),
  terminal:p=>p.n===0?0:null,evaluate:()=>0};
 const engine=createSearchEngine(adapter);
 const limited=engine.choose(original,{depth:7,maxNodes:3});assert(limited.stopped);assert.deepEqual(working,saved);assert.deepEqual(original,saved);assert(undoCount>0);assert.equal(applies,0);
 adapter.evaluate=()=>{throw Error('evaluation failed');};assert.throws(()=>engine.choose(original,{depth:1}),/evaluation failed/);assert.deepEqual(working,saved);assert.deepEqual(original,saved);
 assert.throws(()=>createSearchEngine({...adapter,unmake:undefined}),/both make and unmake/);
});

test('undo restores explicit zero history entries and exact bank ordering',()=>{
 let p=rules.createInitialPosition({allowCheckingDrops:true,experiment:'capture-bank',bankCapacity:3});
 p=rules.applyAction(p,{type:'place-king',to:15});p=rules.applyAction(p,{type:'place-king',to:0});
 const action=rules.legalActions(p).find(a=>a.type==='drop'),key=rules.positionKey(rules.applyAction(p,action));p.repetitions[key]=0;
 const mutable=rules.createSearchPosition(p),saved=structuredClone(mutable),undo=rules.makeSearchAction(mutable,action);rules.unmakeSearchAction(mutable,undo);assert.deepEqual(mutable,saved);
});

test('PVS and move ordering match exhaustive minimax with transpositions and extra turns',()=>{
 const rng=random(66);
 for(let trial=0;trial<80;trial++){
  const nodes=Array.from({length:16},()=>({turn:rng()<0.5?0:1,value:Math.floor(rng()*31)-15,next:[]}));nodes[0].turn=0;
  for(let i=0;i<16;i++)if(i<13)for(let a=0;a<3;a++)nodes[i].next.push(i+1+Math.floor(rng()*(15-i)));else nodes[i].terminal=Math.floor(rng()*5-2)*100;
  const engine=createSearchEngine({scoreStep:1,actions:p=>nodes[p].next.map((_,i)=>i),apply:(p,a)=>nodes[p].next[a],turn:p=>nodes[p].turn,key:String,
    terminal:p=>nodes[p].terminal??null,evaluate:p=>nodes[p].value,repetitions:p=>p%3});
  function oracle(p,d){if(nodes[p].terminal!==undefined)return nodes[p].terminal;if(!d)return nodes[p].value;const values=nodes[p].next.map(q=>oracle(q,d-1));return nodes[p].turn===0?Math.max(...values):Math.min(...values);}
  for(let depth=1;depth<=6;depth++)for(const options of [{},{useCache:false},{principalVariation:false},{useHistory:false},{multiPv:3},{random:()=>0},{repetitionAversion:true,random:()=>0},{iterativeDeepening:true},{iterativeDeepening:true,aspirationWindow:1},{iterativeDeepening:true,aspiration:false},{maxTableEntries:1}]){
   const r=engine.choose(0,{depth,...options});assert.equal(r.score,oracle(0,depth));assert.equal(oracle(nodes[0].next[r.action],depth-1),r.score);
  }
 }
 assert.throws(()=>createSearchEngine({actions:()=>[],apply:p=>p,turn:()=>0,terminal:()=>0,evaluate:()=>0,key:String,scoreStep:0}),/score step/);
});

test('history-sensitive scoring and tactical extensions match the frozen engine',()=>{
 for(const recipe of [VARIANTS.canonical,VARIANTS.unrestricted,VARIANTS['capture-bank-3-quiet'],VARIANTS['no-drop-mate']]){
  let p=rules.createInitialPosition(recipe);p=rules.applyAction(p,{type:'place-king',to:15});p=rules.applyAction(p,{type:'place-king',to:0});
  for(let i=0;i<6&&!rules.getResult(p);i++){const a=rules.legalActions(p);p=rules.applyAction(p,a[(i*3+1)%a.length]);}
  if(rules.getResult(p))continue;
  for(const action of rules.legalActions(p).slice(0,3)){const key=rules.positionKey(rules.applyAction(p,action));p.repetitions[key]=2;}
  const saved=structuredClone(p);
  for(const options of [{depth:3},{depth:3,maxTableEntries:1},{depth:2,quiescenceDepth:2,multiPv:3},{depth:3,useCache:false}]){
   assert.equal(analyzeAction(p,options).score,baseline(p,options).score);assert.deepEqual(p,saved);
  }
 }
});


test('key serialization preserves bank order equivalence and mutable nested rule extensions',()=>{
 const p=rules.createInitialPosition({allowCheckingDrops:false,experiment:'capture-bank',bankCapacity:6,extension:{value:1}});
 assert.equal(rules.positionKey(p),old.positionKey(p));
 p.rules.extension.value=2;assert.equal(rules.positionKey(p),old.positionKey(p));
 p.banks.white=['rook','bishop','rook','knight','bishop'];
 assert.equal(rules.positionKey(p),old.positionKey(p));
 const before=rules.positionKey(p);p.banks.white.reverse();assert.equal(rules.positionKey(p),before);
});
