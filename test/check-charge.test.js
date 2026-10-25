import test from 'node:test';
import assert from 'node:assert/strict';
import * as R from '../research/check-charge-v1/core/rules.js';
import {VARIANTS,VARIANT_IDS} from '../research/check-charge-v1/core/variants.js';
import {tasksFor} from '../research/check-charge-v1/run.js';
import {playTournamentGame} from '../research/check-charge-v1/core/tournament.js';

function fixture(cap,charges=0,pieces=[],banks={white:['rook','knight'],black:[]}) {
  const board=Array(16).fill(null);board[15]=R.occupantOf('white','king');board[0]=R.occupantOf('black','king');
  for(const [sq,owner,piece] of pieces)board[sq]=R.occupantOf(owner,piece);
  return R.createPosition({board,banks,rules:VARIANTS[`charges-${cap}-delay-1`],checkCharges:{white:charges,black:0}});
}
test('576 matched Sharp games cover charge caps 1/2/3 and capture delays 0/1',()=>{
  const tasks=tasksFor({variants:VARIANT_IDS,seeds:[20261801,20261802,20261803,20261804,20261805,20261806],repetitions:1});
  assert.equal(tasks.length,576);assert.equal(new Set(tasks.map(t=>t.id)).size,576);
  for(const id of VARIANT_IDS)assert.equal(tasks.filter(t=>t.variant===id&&t.white==='sharp'&&t.black==='sharp').length,96);
});
test('king placements never charge; first quiet action charges only its owner',()=>{
  let p=R.createInitialPosition(VARIANTS['charges-3-delay-1']);
  p=R.applyAction(p,{type:'place-king',to:15});p=R.applyAction(p,{type:'place-king',to:0});
  assert.deepEqual(p.checkCharges,{white:0,black:0});
  assert.ok(!R.legalActions(p).some(a=>a.type==='drop'&&a.piece==='rook'&&a.to===3));
  p=R.applyAction(p,{type:'drop',piece:'knight',to:10});assert.deepEqual(p.checkCharges,{white:1,black:0});
});
test('checking drops spend exactly one with no recharge; ordinary checks restore rather than spend',()=>{
  for(const cap of [1,2,3]) {
    let p=fixture(cap,cap);p=R.applyAction(p,{type:'drop',piece:'rook',to:3});assert.equal(p.checkCharges.white,cap-1);
    p=R.applyAction(p,{type:'move',from:0,to:4});assert.equal(p.checkCharges.black,1);
    p=R.applyAction(p,{type:'move',from:3,to:7});assert.equal(R.isInCheck(p,'black'),true);assert.equal(p.checkCharges.white,cap);
  }
});
test('zero charge refuses check drops, cap is enforced, charged drop mate remains legal',()=>{
  for(const cap of [1,2,3]) {
    assert.throws(()=>R.applyAction(fixture(cap,0),{type:'drop',piece:'rook',to:3}),/Illegal action/);
    let p=R.applyAction(fixture(cap,cap),{type:'move',from:15,to:14});assert.equal(p.checkCharges.white,cap);
    const trap=fixture(cap,1,[[15,'white','king'],[9,'white','king'],[6,'white','bishop']]);
    trap.board[15]=null;
    p=R.applyAction(trap,{type:'drop',piece:'rook',to:3});
    assert.equal(R.getResult(p)?.reason,'checkmate');assert.equal(p.checkCharges.white,0);
  }
});
test('charge state changes identity and transitions leave the input untouched',()=>{
  const p=fixture(3,0),copy=structuredClone(p);const q=fixture(3,1);
  assert.notEqual(R.positionKey(p),R.positionKey(q));
  R.applyAction(p,{type:'move',from:15,to:14});assert.deepEqual(p,copy);
});
test('all six recipes replay exactly, conserve material, respect charges and use distinct adapter identity',()=>{
  for(const id of VARIANT_IDS) {
    const game=playTournamentGame({index:5,seed:20261801,white:'learning',black:'learning',maxPlies:50,researchRules:VARIANTS[id]});
    let p=R.createInitialPosition(VARIANTS[id]);
    for(const e of game.transcript) {
      p=R.applyAction(p,e.action);assert.equal(R.positionKey(p),e.resultingKey);
      for(const side of ['white','black'])assert.ok(p.checkCharges[side]>=0&&p.checkCharges[side]<=p.rules.checkChargeCap);
      assert.equal(p.board.filter(x=>x&&x.piece!=='king').length+p.banks.white.length+p.banks.black.length,6);
    }
    assert.deepEqual(p,game.finalPosition);assert.equal(game.engines.white.engine,'variant-objective-search-v3');
  }
});
