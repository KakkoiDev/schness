import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as reference from '../research/search-performance-v5/baseline-rules.js';
import * as rules from '../src/rules.js';
import {analyzeAction} from '../src/bot.js';
const corpus=JSON.parse(readFileSync(new URL('../research/search-performance-v5/tactical-corpus.json',import.meta.url)));
function force(p,who,depth){const r=reference.getResult(p);if(r)return r.winner===who;if(!depth)return false;const a=reference.legalActions(p);return p.turn===who?a.some(a=>force(reference.applyLegalAction(p,a),who,depth-1)):a.every(a=>force(reference.applyLegalAction(p,a),who,depth-1));}

test('Schness tactical corpus has independently exhaustive mate answers and legal search lines',()=>{
 assert.equal(corpus.cases.length,15);
 for(const c of corpus.cases){
  const p=c.position,saved=structuredClone(p);
  const winning=reference.legalActions(p).filter(a=>force(reference.applyLegalAction(p,a),p.turn,c.depth-1)).map(reference.actionKey);
  assert.deepEqual(winning,c.winningActions,c.id);
  for(const options of [{rootTiePriority:true,random:()=>.4},{},{useCache:false},{useMutable:false},{principalVariation:false},{iterativeDeepening:true},{quiescenceDepth:2}]){
   const r=analyzeAction(p,{depth:c.depth,...options});assert(winning.includes(rules.actionKey(r.action)),c.id+JSON.stringify(options));assert(r.score>=1e6);
   for(const line of r.variations){let q=p;for(const a of line.pv)q=rules.applyAction(q,a);}
   assert.deepEqual(p,saved);
  }
 }
});

test('optimized safety proof matches full simulation on 5,000 sparse and malformed boards',()=>{
 let seed=19;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296),pieces=['king','rook','bishop','knight'];
 for(let i=0;i<5000;i++){
  const board=Array.from({length:16},()=>random()<0.65?null:{owner:random()<0.5?'white':'black',piece:pieces[Math.floor(random()*4)]});
  const p=rules.createPosition({board,banks:{white:['rook','bishop','knight'],black:['rook']},turn:i%2?'white':'black',rules:{allowCheckingDrops:i%3===0}});
  assert.deepEqual(rules.legalActions(p),reference.legalActions(p),'board '+i);assert.equal(rules.countLegalActionsUnchecked(p),reference.legalActions(p).length);
 }
});

test('optional checking extensions agree with an exhaustive capture/check/evasion oracle',async()=>{
 const {scorePosition}=await import('../research/search-performance-v5/baseline-bot.js');
 function oracle(p,who,left){
  const terminal=reference.getResult(p);if(terminal)return !terminal.winner?0:terminal.winner===who?1e6:-1e6;
  const stand=scorePosition(p,0)*(who==='white'?1:-1);if(!left)return stand;
  const danger=reference.isInCheck(p,p.turn),max=p.turn===who;
  const candidates=reference.legalActions(p).filter(a=>danger||a.type==='move'&&p.board[a.to]||reference.isInCheck(reference.applyLegalAction(p,a),p.turn==='white'?'black':'white'));
  const values=candidates.map(a=>oracle(reference.applyLegalAction(p,a),who,left-1));if(!danger)values.push(stand);
  return max?Math.max(...values):Math.min(...values);
 }
 for(const c of corpus.cases){
  const p=c.position,values=reference.legalActions(p).map(a=>oracle(reference.applyLegalAction(p,a),p.turn,2)),expected=Math.max(...values);
  for(const mutable of [true,false]){
   const actual=analyzeAction(p,{depth:1,quiescenceDepth:2,quiescenceChecks:true,useMutable:mutable,multiPv:10});assert.equal(actual.score,expected,c.id);
   const saved=structuredClone(p),limited=analyzeAction(p,{depth:100,maxNodes:13,quiescenceDepth:2,quiescenceChecks:true,useMutable:mutable});assert(limited.nodes<=13);assert.deepEqual(p,saved);
  }
 }
 assert.throws(()=>analyzeAction(corpus.cases[0].position,{quiescenceChecks:1}),/quiescenceChecks/);
});

test('late-move reductions are opt-in, re-search improvements, and expose their tactical risk',async()=>{
 const {createSearchEngine}=await import('../src/search.js');
 for(const horizon of [-10,10]){
  const graph={root:{turn:0,next:['branch']},branch:{turn:0,next:['safe1','safe2','safe3','trap']},safe1:{turn:1,end:0},safe2:{turn:1,end:0},safe3:{turn:1,end:0},trap:{turn:1,next:['horizon']},horizon:{turn:0,value:horizon,next:['win']},win:{turn:1,end:100}};
  const adapter={scoreStep:1,actions:p=>graph[p].next??[],apply:(p,a)=>a,turn:p=>graph[p].turn,key:String,terminal:p=>graph[p].end??null,evaluate:p=>graph[p].value??0,canReduce:()=>true,inDanger:()=>false};
  const e=createSearchEngine(adapter),exact=e.choose('root',{depth:4}),reduced=e.choose('root',{depth:4,lateMoveReduction:true});
  assert.equal(exact.score,100);assert(reduced.stats.reducedSearches>0);
  if(horizon>0){assert.equal(reduced.score,100);assert(reduced.stats.reductionResearches>0);}else assert.equal(reduced.score,0,'A reduced fail-low can miss a full-depth win; keep the mode experimental');
  assert.throws(()=>e.choose('root',{lateMoveReduction:1}),/lateMoveReduction/);
  assert.throws(()=>createSearchEngine({...adapter,canReduce:undefined}).choose('root',{lateMoveReduction:true}),/canReduce/);
  assert.equal(createSearchEngine({...adapter,canReduce:()=>false}).choose('root',{depth:4,lateMoveReduction:true}).score,100);
 }
});
