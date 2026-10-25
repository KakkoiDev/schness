import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as R from '../research/drop-policy-cooldown-v1/core/rules.js';
import {VARIANTS,VARIANT_IDS} from '../research/drop-policy-cooldown-v1/core/variants.js';
import {tasksFor} from '../research/drop-policy-cooldown-v1/run.js';
import {playTournamentGame} from '../research/drop-policy-cooldown-v1/core/tournament.js';
import {chooseAction} from '../research/drop-policy-cooldown-v1/core/bot.js';

function fixture(id,pieces,{banks={white:['rook'],black:[]},...extra}={}) {
  const board=Array(16).fill(null);
  for(const [sq,owner,piece] of pieces)board[sq]=R.occupantOf(owner,piece);
  return R.createPosition({board,banks,rules:VARIANTS[id],...extra});
}
const trap=[[0,'black','king'],[9,'white','king'],[6,'white','bishop']];

test('six matched recipes cover both cooldowns and every drop policy with 96 Sharp games each',()=>{
  const tasks=tasksFor({variants:VARIANT_IDS,seeds:[20261701,20261702,20261703,20261704,20261705,20261706],repetitions:1});
  assert.equal(tasks.length,576);assert.equal(new Set(tasks.map(t=>t.id)).size,576);
  for(const id of VARIANT_IDS) {
    const rows=tasks.filter(t=>t.variant===id);assert.equal(rows.length,96);
    assert.ok(rows.every(t=>t.white==='sharp'&&t.black==='sharp'));
    assert.equal(new Set(rows.map(t=>`${t.seed}:${t.index%16}`)).size,96);
  }
});

test('immediate drop mate is allowed only in the unrestricted checking recipe',()=>{
  for(const delay of [0,1]) {
    const action={type:'drop',piece:'rook',to:3};
    const p=fixture(`checking-delay-${delay}`,trap);
    assert.deepEqual(R.getResult(R.applyAction(p,action)),{type:'win',winner:'white',reason:'checkmate'});
    for(const id of [`quiet-delay-${delay}`,`no-drop-mate-delay-${delay}`]) {
      assert.throws(()=>R.applyAction(fixture(id,trap),action),/Illegal action/);
    }
    const choice=chooseAction(p,{depth:1});assert.equal(R.getResult(R.applyAction(p,choice))?.winner,'white');
  }
});

test('nonmating check drops allow king escapes and capturing the checking piece',()=>{
  const pieces=[[0,'black','king'],[15,'white','king']];
  let p=fixture('no-drop-mate-delay-1',pieces);
  let next=R.applyAction(p,{type:'drop',piece:'rook',to:3});
  assert.equal(R.isInCheck(next,'black'),true);assert.equal(R.getResult(next),null);
  assert.ok(R.legalActions(next).some(a=>a.type==='move'&&a.from===0&&a.to===4));
  next=R.applyAction(p,{type:'drop',piece:'rook',to:1});
  assert.ok(R.legalActions(next).some(a=>a.type==='move'&&a.from===0&&a.to===1));
});

test('a reserve block makes the checking drop legal, but cooling reserves cannot postpone mate',()=>{
  const p=fixture('no-drop-mate-delay-1',trap,{banks:{white:['rook'],black:['knight']}});
  const next=R.applyAction(p,{type:'drop',piece:'rook',to:3});
  assert.equal(R.getResult(next),null);
  assert.ok(R.legalActions(next).some(a=>a.type==='drop'&&a.to===1));
  const cooling=fixture('no-drop-mate-delay-1',trap,{banks:{white:['rook'],black:['knight']},reserveTimers:{white:[0],black:[1]}});
  assert.throws(()=>R.applyAction(cooling,{type:'drop',piece:'rook',to:3}),/Illegal action/);
});

test('no-drop-mate still permits mating board moves and preserves policy identity',()=>{
  const p=fixture('no-drop-mate-delay-1',[...trap,[7,'white','rook']],{banks:{white:[],black:[]}});
  assert.deepEqual(R.getResult(R.applyAction(p,{type:'move',from:7,to:3})),{type:'win',winner:'white',reason:'checkmate'});
  assert.notEqual(R.positionKey(p),R.positionKey({...p,rules:VARIANTS['checking-delay-1']}));
});

test('zero cooldown makes captures immediately ready for the next own turn; one retains full delay',()=>{
  for(const delay of [0,1]) for(const policy of ['quiet','checking','no-drop-mate']) {
    const p=fixture(`${policy}-delay-${delay}`,[[12,'white','king'],[3,'black','king'],[8,'white','rook'],[9,'black','bishop']],{banks:{white:[],black:[]}});
    const next=R.applyAction(p,{type:'move',from:8,to:9});
    assert.deepEqual(next.banks.white,['bishop']);assert.deepEqual(next.reserveTimers.white,[delay]);
  }
});

test('search/evaluation implementation is unchanged and every recipe has a replay-valid game',async()=>{
  assert.deepEqual(await readFile(new URL('../research/drop-policy-cooldown-v1/core/bot.js',import.meta.url)),await readFile(new URL('../research/variant-options-v1/core/bot.js',import.meta.url)));
  for(const id of VARIANT_IDS) {
    const game=playTournamentGame({index:5,seed:20261701,white:'learning',black:'learning',maxPlies:60,researchRules:VARIANTS[id]});
    let p=R.createInitialPosition(VARIANTS[id]);
    for(const e of game.transcript) {
      p=R.applyAction(p,e.action);assert.equal(R.positionKey(p),e.resultingKey);
      assert.equal(p.board.filter(x=>x&&x.piece!=='king').length+p.banks.white.length+p.banks.black.length,6);
    }
    assert.deepEqual(p,game.finalPosition);assert.equal(game.engines.white.engine,'variant-objective-search-v2');
    assert.deepEqual(R.getResult(p)??{type:'draw',reason:'ply-limit'},game.result);
  }
});
