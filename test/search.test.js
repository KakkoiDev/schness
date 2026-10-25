import test from 'node:test';
import assert from 'node:assert/strict';
import {createSearchEngine,strengthOptions} from '../src/search.js';
import {analyzeAction} from '../src/bot.js';
import {createInitialPosition,applyAction,legalActions,actionKey} from '../src/rules.js';
function game(misere=false){return createSearchEngine({actions:p=>[1,2].filter(n=>n<=p.n),apply:(p,n)=>({n:p.n-n,turn:1-p.turn}),turn:p=>p.turn,key:p=>`${p.n}:${p.turn}`,evaluate:()=>0,terminal:(p,who,d)=>p.n?null:((misere?p.turn:1-p.turn)===who?1000+d:-1000-d)});}
test('search supports different win/loss objectives without changes to search',()=>{
 assert.equal(game().choose({n:2,turn:0},{depth:3}).action,2);
 assert.equal(game(true).choose({n:2,turn:0},{depth:3}).action,1);
 assert.equal(game().choose({n:0,turn:0}).action,null);
});
test('budgeted iterative search respects node cap and returns only complete depth or legal fallback',()=>{
 const engine=game(),p={n:8,turn:0};const r=engine.choose(p,{depth:8,maxNodes:1});assert.equal(r.nodes,1);assert.equal(r.completedDepth,0);assert.equal(r.stopped,true);assert.ok([1,2].includes(r.action));
 const a=engine.choose(p,{depth:4,maxNodes:10000});assert.equal(a.completedDepth,4);assert.equal(a.stopped,false);assert.equal(a.action,engine.choose(p,{depth:4}).action);
});
test('strength is a validated deterministic budget, not a claimed Elo',()=>{
 for(let s=0;s<=100;s++){const a=strengthOptions(s);assert.ok(a.depth===s);if(s)assert.ok(a.maxNodes>=strengthOptions(s-1).maxNodes);}
 for(const bad of [-1,101,NaN])assert.throws(()=>strengthOptions(bad));
 for(const options of [{depth:-1},{depth:101},{maxNodes:0},{maxMillis:-1}])assert.throws(()=>game().choose({n:2,turn:0},options));
});
test('Schness adapter budgets return a legal action without mutating position',()=>{
 let p=createInitialPosition();p=applyAction(p,{type:'place-king',to:15});p=applyAction(p,{type:'place-king',to:0});const saved=structuredClone(p);
 const r=analyzeAction(p,{strength:20,maxNodes:100});assert.ok(r.nodes<=100);assert.ok(legalActions(p).some(a=>actionKey(a)===actionKey(r.action)));assert.deepEqual(p,saved);
});

// A tiny graph game makes horizon behavior explicit without any chess assumptions.
function graphEngine(nodes, extra={}) {
 return createSearchEngine({
  actions:p=>Object.keys(nodes[p].next??{}), apply:(p,a)=>nodes[p].next[a],
  turn:p=>nodes[p].turn, key:p=>p,
  terminal:(p,who)=>nodes[p].terminal===undefined?null:nodes[p].terminal*(who==='A'?1:-1),
  evaluate:(p,who)=>(nodes[p].value??0)*(who==='A'?1:-1),
  ...extra,
 });
}
const tacticalGraph={
 root:{turn:'A',next:{greedy:'trap',safe:'safe'}},
 trap:{turn:'B',value:10,next:{recapture:'loss'}},
 safe:{turn:'B',value:2,next:{wait:'draw'}},
 loss:{turn:'A',terminal:-100},draw:{turn:'A',terminal:0},
};
test('optional tactical extension sees a recapture beyond the nominal horizon',()=>{
 const e=graphEngine(tacticalGraph,{noisyActions:(p,a)=>p==='trap'?a:[]});
 assert.equal(e.choose('root',{depth:1}).action,'greedy');
 const r=e.choose('root',{depth:1,quiescenceDepth:2,multiPv:2});
 assert.equal(r.action,'safe');assert.equal(r.score,2);
 assert.deepEqual(r.variations[1].pv,['greedy','recapture']);
 assert.ok(r.quiescenceNodes>0);
});
test('danger forbids standing pat and searches quiet forced replies',()=>{
 const e=graphEngine(tacticalGraph,{inDanger:p=>p==='safe'});
 const r=e.choose('root',{depth:1,quiescenceDepth:1,multiPv:2});
 assert.equal(r.variations.find(v=>v.action==='safe').score,0);
 assert.deepEqual(r.variations.find(v=>v.action==='safe').pv,['safe','wait']);
});
test('extra turns use the actual player identity rather than alternating signs',()=>{
 const e=graphEngine({root:{turn:'A',next:{extra:'again',end:'end'}},again:{turn:'A',next:{win:'win',lose:'lose'}},end:{turn:'B',terminal:2},win:{turn:'B',terminal:100},lose:{turn:'B',terminal:-100}});
 assert.equal(e.choose('root',{depth:2}).action,'extra');
 assert.equal(e.choose('root',{depth:2}).score,100);
});
test('ranked lines are distinct, sorted, legal and agree with uncached search',()=>{
 for(const misere of [false,true]) {
  const e=game(misere),p={n:8,turn:0};
  const a=e.choose(p,{depth:8,multiPv:10}),b=e.choose(p,{depth:8,multiPv:10,useCache:false});
  assert.equal(a.score,b.score);assert.equal(a.action,b.action);
  assert.equal(new Set(a.variations.map(v=>v.action)).size,2);
  assert.deepEqual(a.pv,a.variations[0].pv);
  for(let i=0;i<a.variations.length;i++) {
   const v=a.variations[i];if(i)assert.ok(a.variations[i-1].score>=v.score);
   let n=8;for(const action of v.pv){assert.ok(action>=1&&action<=2&&action<=n);n-=action;}
   assert.equal(n,0);
  }
 }
});
test('tactical nodes share the cap and incomplete iterations publish no partial lines',()=>{
 const e=graphEngine(tacticalGraph,{noisyActions:(p,a)=>a});
 for(let cap=1;cap<=8;cap++) {
  const r=e.choose('root',{depth:4,maxNodes:cap,quiescenceDepth:2,multiPv:2});
  assert.ok(r.nodes<=cap);
  if(!r.completedDepth){assert.equal(r.score,null);assert.deepEqual(r.pv,[]);assert.deepEqual(r.variations,[]);}
  else {const fixed=e.choose('root',{depth:r.completedDepth,quiescenceDepth:2,multiPv:2});assert.equal(r.score,fixed.score);assert.deepEqual(r.variations,fixed.variations);}
 }
});
test('adapter failures and invalid analysis options fail explicitly',()=>{
 assert.throws(()=>createSearchEngine({}),/adapter/);
 for(const opts of [{multiPv:0},{multiPv:11},{quiescenceDepth:-1},{quiescenceDepth:9},{depth:1.5}])assert.throws(()=>game().choose({n:2,turn:0},opts));
 assert.throws(()=>graphEngine({x:{turn:'A'}}).choose('x'),/adjudicate/);
 assert.throws(()=>graphEngine({x:{turn:'A',next:{go:'y'}},y:{turn:'B',value:NaN}}).choose('x',{depth:1}),/finite/);
});
test('Schness analysis continuations replay legally and preserve the source state',()=>{
 let p=createInitialPosition();p=applyAction(p,{type:'place-king',to:15});p=applyAction(p,{type:'place-king',to:0});
 const saved=structuredClone(p),r=analyzeAction(p,{depth:2,maxNodes:2000,multiPv:3,quiescenceDepth:1});
 assert.ok(r.completedDepth>0);
 for(const v of r.variations){let state=p;for(const a of v.pv){assert.ok(legalActions(state).some(x=>actionKey(x)===actionKey(a)));state=applyAction(state,a);}}
 assert.deepEqual(p,saved);
});
test('tic-tac-toe search agrees with exhaustive minimax on every reachable state',()=>{
 const wins=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
 const terminal=(p,who)=>{
  for(const line of wins)if(p.b[line[0]]&&line.every(i=>p.b[i]===p.b[line[0]]))return p.b[line[0]]===who?100:-100;
  return p.b.every(Boolean)?0:null;
 };
 const actions=p=>p.b.flatMap((x,i)=>x?[]:[i]);
 const apply=(p,i)=>({b:p.b.map((x,j)=>j===i?p.turn:x),turn:p.turn==='X'?'O':'X'});
 const key=p=>p.b.map(x=>x||'-').join('')+p.turn;
 const e=createSearchEngine({actions,apply,turn:p=>p.turn,key,terminal,evaluate:()=>0});
 const memo=new Map(),seen=new Set();
 function oracle(p,who){const k=key(p)+who;if(memo.has(k))return memo.get(k);const t=terminal(p,who);if(t!==null)return t;const values=actions(p).map(a=>oracle(apply(p,a),who));const v=p.turn===who?Math.max(...values):Math.min(...values);memo.set(k,v);return v;}
 function check(p){const k=key(p);if(seen.has(k))return;seen.add(k);const expected=oracle(p,p.turn);
  const result=e.choose(p,{depth:Math.max(1,actions(p).length)});assert.equal(result.score,expected,k);
  if(terminal(p,p.turn)!==null){assert.equal(result.action,null);return;}
  assert.equal(oracle(apply(p,result.action),p.turn),expected,k);
  for(const a of actions(p))check(apply(p,a));
 }
 check({b:Array(9).fill(null),turn:'X'});assert.equal(seen.size,5478);
});
test('level equals requested lookahead, with honest zero and budget-limited results',()=>{
 for(const level of [0,1,11,100])assert.equal(strengthOptions(level).depth,level);
 const e=game(),zero=e.choose({n:8,turn:0},{strength:0});
 assert.equal(zero.nodes,0);assert.equal(zero.score,null);assert.equal(zero.completedDepth,0);assert.ok([1,2].includes(zero.action));
 const capped=e.choose({n:80,turn:0},{strength:100,maxNodes:10});
 assert.equal(capped.requestedDepth,100);assert.ok(capped.completedDepth<100);assert.equal(capped.stopped,true);assert.ok(capped.nodes<=10);
 assert.throws(()=>strengthOptions(1.5));
});
test('time exhaustion returns an honest fallback and terminal roots never expand',()=>{
 const saved=Date.now;let clock=0;
 try{Date.now=()=>clock++;
  const r=game().choose({n:8,turn:0},{depth:100,maxMillis:1});
  assert.equal(r.stopped,true);assert.equal(r.completedDepth,0);assert.equal(r.score,null);assert.deepEqual(r.variations,[]);
 }finally{Date.now=saved;}
 const e=createSearchEngine({actions:()=>{throw Error('expanded terminal');},apply:()=>{},turn:()=>0,key:()=>'',terminal:()=>0,evaluate:()=>{throw Error('evaluated terminal');}});
 const r=e.choose({}, {strength:100});assert.equal(r.action,null);assert.equal(r.nodes,0);assert.equal(r.score,0);assert.equal(r.requestedDepth,100);
});

test('play prunes root alternatives while multi-PV retains exact alternative scores',()=>{
 const nodes={root:{turn:'A',next:{best:'best',bad:'bad'}},best:{turn:'B',next:{a:'five',b:'six'}},bad:{turn:'B',next:{a:'four',b:'minus'}},five:{turn:'A',terminal:5},six:{turn:'A',terminal:6},four:{turn:'A',terminal:4},minus:{turn:'A',terminal:-10}};
 const e=graphEngine(nodes),play=e.choose('root',{depth:2}),analysis=e.choose('root',{depth:2,multiPv:2});
 assert.equal(play.score,5);assert.equal(play.action,'best');assert.ok(play.nodes<analysis.nodes);assert.ok(play.stats.cutoffs>0);
 assert.deepEqual(analysis.variations.map(v=>v.score),[5,-10]);
});
test('fail-low equality cannot masquerade as a real tie for randomness or repetition',()=>{
 const e=graphEngine({root:{turn:'A',next:{best:'best',trap:'trap'}},best:{turn:'B',terminal:5},trap:{turn:'B',next:{looksEqual:'five',actuallyBad:'zero'}},five:{turn:'A',terminal:5},zero:{turn:'A',terminal:0}},{repetitions:p=>p==='best'?2:0});
 for(const options of [{random:()=>0},{repetitionAversion:true}]){
  const r=e.choose('root',{depth:2,...options});assert.equal(r.action,'best');assert.equal(r.score,5);assert.equal(r.stats.rootResearches,1);
 }
});
test('bounded cache and cross-iteration hints preserve exact-depth minimax',()=>{
 const e=game(),p={n:9,turn:0};const expected=e.choose(p,{depth:7,useCache:false});
 for(const maxTableEntries of [1,2,100]){
  const r=e.choose(p,{depth:7,maxNodes:100000,maxTableEntries});assert.equal(r.score,expected.score);assert.ok(r.stats.tableEntries<=maxTableEntries);assert.ok(r.stats.hintEntries<=maxTableEntries);
 }
 assert.ok(e.choose(p,{depth:7,maxNodes:100000}).stats.hintHits>0);
 assert.throws(()=>e.choose(p,{maxTableEntries:0}));
});
test('random transposition graphs agree with independent exhaustive minimax at every depth',()=>{
 let seed=42;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
 for(let trial=0;trial<60;trial++){
  const nodes=Array.from({length:16},(_,i)=>({turn:random()<0.5?'A':'B',value:Math.floor(random()*21)-10,next:{}}));nodes[0].turn='A';
  for(let i=0;i<16;i++)if(i>12)nodes[i].terminal=Math.floor(random()*5-2)*100;else for(let a=0;a<3;a++)nodes[i].next[a]=i+1+Math.floor(random()*(15-i));
  const e=graphEngine(nodes);
  function oracle(p,d){const n=nodes[p];if(n.terminal!==undefined)return n.terminal;if(!d)return n.value;const values=Object.values(n.next).map(next=>oracle(next,d-1));return n.turn==='A'?Math.max(...values):Math.min(...values);}
  for(let depth=1;depth<=6;depth++){
   const expected=oracle(0,depth);
   for(const options of [{},{useCache:false},{multiPv:3},{iterativeDeepening:true},{maxTableEntries:1}]){
    const r=e.choose(0,{depth,...options});assert.equal(r.score,expected,`graph ${trial}, depth ${depth}`);assert.equal(oracle(nodes[0].next[r.action],depth-1),expected);
   }
  }
 }
});
test('per-node legal actions are lazy and shared by terminal, search and evaluation',()=>{
 const counts=new Map();const e=createSearchEngine({actions:p=>{counts.set(p,(counts.get(p)??0)+1);return p?[]:[1];},apply:()=>1,turn:()=>0,key:String,terminal:(p,who,d,facts)=>{facts.actions();return p?2:null;},evaluate:(p,who,facts)=>facts.actions().length});
 assert.equal(e.choose(0,{depth:1}).score,2);assert.deepEqual([...counts.values()],[1,1]);
});
