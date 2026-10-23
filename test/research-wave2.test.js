import test from 'node:test';
import assert from 'node:assert/strict';
import { createPosition, createInitialPosition, applyAction, legalActions, positionKey, getResult, isInCheck } from '../src/rules.js';
import { playTournamentGame, hiddenSetupPlacements } from '../src/tournament.js';
import { VARIANTS } from '../scripts/research-variants.js';

function fixture(id) {
  const board = Array(16).fill(null);
  board[12] = { owner: 'white', piece: 'king' };
  board[0] = { owner: 'black', piece: 'king' };
  board[3] = { owner: 'black', piece: 'knight' };
  return createPosition({ board, banks: { white: ['rook','bishop','knight'], black: [] }, rules: VARIANTS[id] });
}
const hasRookCheck = p => legalActions(p).some(a => a.type === 'drop' && a.piece === 'rook' && a.to === 4);

test('first-turn quiet applies to each player, not only White or king placement', () => {
  for (const id of ['first-turn-quiet','protected-first-turn']) {
    const p = fixture(id);
    assert.equal(hasRookCheck(p), false);
    p.research.turns.white = 1;
    assert.equal(hasRookCheck(p), true);
    p.turn = 'black';
    p.board[3] = null;
    p.board[15] = {owner:'white',piece:'knight'};
    p.banks.black = ['rook'];
    assert.equal(legalActions(p).some(a => a.type === 'drop' && isInCheck(applyAction(p,a),'white')), false);
  }
  let p = createInitialPosition(VARIANTS['first-turn-quiet']);
  p = applyAction(p,{type:'place-king',to:12});
  p = applyAction(p,{type:'place-king',to:0});
  assert.deepEqual(p.research.turns,{white:0,black:0});
});

test('mutual gate unlocks only after both players meet the distinct-deployment threshold', () => {
  for (const [id,n] of [['mutual-one',1],['mutual-two',2]]) {
    const p=fixture(id);
    p.research.deployed.white=['bishop','knight'].slice(0,n);
    assert.equal(hasRookCheck(p),false);
    p.research.deployed.black=['bishop','knight'].slice(0,n);
    assert.equal(hasRookCheck(p),true);
    const key=positionKey(p);
    p.research.deployed.black=[];
    assert.notEqual(positionKey(p),key);
  }
});

test('checking-drop budget and cooldown survive apply and distinguish position rights', () => {
  for (const id of ['limited-check','cooldown']) {
    const p=fixture(id);
    const next=applyAction(p,{type:'drop',piece:'rook',to:4});
    assert.equal(next.research.checkingDrops.white,1);
    assert.equal(next.research.lastCheckingDrop.white,true);
    assert.equal(p.research.checkingDrops.white,0);
    const q=fixture(id);
    const before=positionKey(q);
    if(id==='limited-check') q.research.checkingDrops.white=1;
    else q.research.lastCheckingDrop.white=true;
    assert.equal(hasRookCheck(q),false);
    assert.notEqual(positionKey(q),before);
  }
});

test('no-drop-mate forbids an actual immediate mate while allowing a nonmating checking drop', () => {
  const board=Array(16).fill(null);
  board[0]={owner:'black',piece:'king'};
  board[9]={owner:'white',piece:'king'};
  board[8]={owner:'white',piece:'knight'};
  // Bishop on b3 checks a4; knight covers b4, king covers a3/b3.
  const action={type:'drop',piece:'bishop',to:5};
  const unrestricted=createPosition({board,banks:{white:['bishop'],black:[]},rules:VARIANTS.unrestricted});
  assert.equal(getResult(applyAction(unrestricted,action))?.reason,'checkmate');
  const restricted=createPosition({board,banks:{white:['bishop'],black:[]},rules:VARIANTS['no-drop-mate']});
  assert.equal(legalActions(restricted).some(a=>a.type==='drop'&&a.to===5),false);
  assert.equal(hasRookCheck(fixture('no-drop-mate')),true);
});

test('private setups are reproducible, home-rank-only, quiet and replayable for all king starts', () => {
  for (let index=0;index<16;index++) {
    const rules=VARIANTS['hidden-checking'];
    const game=playTournamentGame({index,seed:20261024,white:'learning',black:'learning',maxPlies:8,researchRules:rules});
    assert.equal(game.plies,8);
    assert.equal(game.finalPosition.board.filter(Boolean).length,8);
    assert.equal(game.finalPosition.turn,'white');
    assert.equal(isInCheck(game.finalPosition,'white'),false);
    assert.equal(isInCheck(game.finalPosition,'black'),false);
    const kings={white:12+index%4,black:Math.floor(index/4)};
    assert.deepEqual(hiddenSetupPlacements(kings,game.seed),game.hiddenSetup);
    for (const player of ['white','black']) for (const a of game.hiddenSetup[player]) assert.equal(Math.floor(a.to/4),player==='white'?3:0);
    let p=createInitialPosition(rules);
    for (const e of game.transcript) {p=applyAction(p,e.action);assert.equal(positionKey(p),e.resultingKey);}
    assert.deepEqual(p,game.finalPosition);
  }
});
