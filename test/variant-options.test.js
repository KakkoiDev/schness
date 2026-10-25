import test from 'node:test';
import assert from 'node:assert/strict';
import * as R from '../research/variant-options-v1/core/rules.js';
import * as Old from '../research/bank-cooldown-levels-v1/core/rules.js';
import {VARIANTS,VARIANT_IDS} from '../research/variant-options-v1/core/variants.js';
import {chooseAction,scorePosition} from '../research/variant-options-v1/core/bot.js';
import {playTournamentGame} from '../research/variant-options-v1/core/tournament.js';
import {tasksFor} from '../research/variant-options-v1/run.js';

function position(id,pieces,{banks={white:[],black:[]},...extra}={}) {
  const board=Array(16).fill(null);
  for (const [sq,owner,piece] of pieces) board[sq]=R.occupantOf(owner,piece);
  return R.createPosition({board,banks,rules:VARIANTS[id],...extra});
}
const kings=[[15,'white','king'],[0,'black','king']];

test('nine distinct recipes have 96 Sharp-only games each and matched starts/seeds',()=>{
  const config={variants:VARIANT_IDS,seeds:[20261601,20261602,20261603,20261604,20261605,20261606],repetitions:1};
  const tasks=tasksFor(config);assert.equal(tasks.length,864);
  assert.equal(new Set(Object.values(VARIANTS).map(JSON.stringify)).size,9);
  for(const id of VARIANT_IDS) {
    const group=tasks.filter(t=>t.variant===id);assert.equal(group.length,96);
    assert.ok(group.every(t=>t.white==='sharp'&&t.black==='sharp'));
    for(const seed of config.seeds) assert.equal(new Set(group.filter(t=>t.seed===seed).map(t=>t.index%16)).size,16);
  }
});

test('overflow uses return delay, captures use capture delay, new arrivals do not tick immediately',()=>{
  for(const [id,delay] of [['delay-1-0',0],['control-delay-1-1',1],['delay-1-2',2]]) {
    const pieces=[[12,'white','king'],[3,'black','king'],[8,'white','rook'],[9,'black','bishop']];
    let p=position(id,pieces,{banks:{white:['rook','bishop','knight','knight'],black:[]}});
    const next=R.applyAction(p,{type:'move',from:8,to:9});
    assert.deepEqual(next.banks.black,['bishop']);assert.deepEqual(next.reserveTimers.black,[delay]);
    p=position(id,pieces,{banks:{white:['knight'],black:[]},reserveTimers:{white:[1],black:[]}});
    const capture=R.applyAction(p,{type:'move',from:8,to:9});
    assert.deepEqual(capture.reserveTimers.white,[0,1]);assert.equal(capture.banks.white.at(-1),'bishop');
  }
});

test('two-square rook/bishop range affects moves, attacks, king safety and checking-drop refusal',()=>{
  for(const [piece,king] of [['rook',0],['bishop',3]]) {
    const pieces=[[15,'white','king'],[king,'black','king'],[12,'white',piece]];
    const normal=position('control-delay-1-1',pieces),short=position('sliders-range-2',pieces);
    assert.equal(R.isInCheck(normal,'black'),true);assert.equal(R.isInCheck(short,'black'),false);
    assert.equal(R.attackersOf(short,king,'white').length,0);
    const target=piece==='rook'?0:3;
    const emptyTargetPieces=[[15,'white','king'],[piece==='rook'?2:0,'black','king'],[12,'white',piece]];
    assert.ok(!R.legalActions(position('sliders-range-2',emptyTargetPieces)).some(a=>a.type==='move'&&a.from===12&&a.to===target));
    const before=position('sliders-range-2',pieces.filter(x=>x[0]!==12),{banks:{white:[piece],black:[]}});
    assert.ok(R.legalActions(before).some(a=>a.type==='drop'&&a.to===12));
    assert.ok(!R.legalActions({...before,rules:VARIANTS['control-delay-1-1']}).some(a=>a.type==='drop'&&a.to===12));
  }
});

test('three/five-check count checking actions, end immediately, affect identity and guide search',()=>{
  for(const [id,target] of [['three-check',3],['five-check',5]]) {
    const p=position(id,[...kings,[5,'white','rook']],{objective:{checks:{white:target-1,black:0},hold:{white:null,black:null},winner:null}});
    const next=R.applyAction(p,{type:'move',from:5,to:4});
    assert.equal(next.objective.checks.white,target);
    assert.deepEqual(R.getResult(next),{type:'win',winner:'white',reason:`${target}-check`});
    assert.equal(R.legalActions(next).length,0);assert.equal(chooseAction(next),null);
    const chosen=chooseAction(p,{depth:1});assert.equal(R.getResult(R.applyAction(p,chosen))?.winner,'white');
    const zero=structuredClone(p);zero.objective.checks.white=0;
    assert.notEqual(R.positionKey(p),R.positionKey(zero));assert.ok(scorePosition(p,0)>scorePosition(zero,0));
  }
});

test('a discovered double check counts once; a quiet action does not increment checks',()=>{
  const p=position('three-check',[[15,'white','king'],[0,'black','king'],[12,'white','rook'],[8,'white','bishop']]);
  const next=R.applyAction(p,{type:'move',from:8,to:5});
  assert.equal(R.attackersOf(next,0,'white').length,2);assert.equal(next.objective.checks.white,1);
  const quiet=position('three-check',kings);
  assert.equal(R.applyAction(quiet,{type:'move',from:15,to:14}).objective.checks.white,0);
});

test('center hold needs one opponent reply, checking reply cancels claim, search sees the threat',()=>{
  const p=position('center-hold',[[13,'white','king'],[0,'black','king']]);
  const entered=R.applyAction(p,{type:'move',from:13,to:9});
  assert.equal(R.getResult(entered),null);assert.equal(entered.objective.hold.white,9);
  assert.notEqual(R.positionKey(entered),R.positionKey({...entered,objective:{...entered.objective,hold:{white:null,black:null}}}));
  const win=R.applyAction(entered,{type:'move',from:0,to:1});
  assert.deepEqual(R.getResult(win),{type:'win',winner:'white',reason:'center-hold'});
  const threatened=position('center-hold',[[9,'white','king'],[0,'black','king'],[2,'black','rook']],{turn:'black',objective:{checks:{white:0,black:0},hold:{white:9,black:null},winner:null}});
  const checked=R.applyAction(threatened,{type:'move',from:2,to:1});
  assert.equal(R.isInCheck(checked,'white'),true);assert.equal(R.getResult(checked),null);assert.equal(checked.objective.hold.white,null);
  const action=chooseAction(threatened,{depth:1});assert.equal(R.getResult(R.applyAction(threatened,action)),null);
});

test('mandatory captures filter only king-safe captures and allow quiet moves when all captures are pinned',()=>{
  let p=position('mandatory-captures',[[12,'white','king'],[3,'black','king'],[8,'white','rook'],[9,'black','bishop']],{banks:{white:['knight'],black:[]}});
  assert.ok(R.legalActions(p).every(a=>a.type==='move'&&p.board[a.to]));
  p=position('mandatory-captures',[[12,'white','king'],[3,'black','king'],[8,'white','knight'],[14,'black','bishop'],[0,'black','rook']]);
  assert.ok(!R.legalActions(p).some(a=>a.type==='move'&&a.from===8&&a.to===14));
  assert.ok(R.legalActions(p).some(a=>a.type==='move'&&!p.board[a.to]));
});

test('own-half drop restriction applies to both colors, leaving board moves unrestricted',()=>{
  for(const turn of ['white','black']) {
    const p=position('home-half-drops',kings,{turn,banks:{white:['knight'],black:['knight']}});
    const drops=R.legalActions(p).filter(a=>a.type==='drop');assert.ok(drops.length>0);
    assert.ok(drops.every(a=>turn==='white'?a.to>=8:a.to<8));
  }
});

test('control rule actions and position keys match frozen baseline through a full replay',()=>{
  let p=R.createInitialPosition(VARIANTS['control-delay-1-1']),old=Old.createInitialPosition(VARIANTS['control-delay-1-1']);
  for(let i=0;i<100&&!R.getResult(p);i++) {
    assert.deepEqual(R.legalActions(p),Old.legalActions(old));assert.equal(R.positionKey(p),Old.positionKey(old));
    const actions=R.legalActions(p),a=actions[(i*17+3)%actions.length];p=R.applyAction(p,a);old=Old.applyAction(old,a);
    assert.deepEqual(R.getResult(p),Old.getResult(old));
  }
});

test('every recipe has replay-valid play, conserved material and explicit engine identity',()=>{
  for(const id of VARIANT_IDS) {
    const g=playTournamentGame({index:5,seed:20261601,white:'learning',black:'learning',maxPlies:60,researchRules:VARIANTS[id]});
    let p=R.createInitialPosition(VARIANTS[id]);
    for(const e of g.transcript) {p=R.applyAction(p,e.action);assert.equal(R.positionKey(p),e.resultingKey);assert.equal(p.board.filter(x=>x&&x.piece!=='king').length+p.banks.white.length+p.banks.black.length,6);}
    assert.deepEqual(p,g.finalPosition);assert.equal(g.engines.white.engine,'variant-objective-search-v1');
    assert.deepEqual(R.getResult(p)??{type:'draw',reason:'ply-limit'},g.result);
  }
});
