import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialPosition, createPosition, applyAction, legalActions, positionKey, getResult } from '../src/rules.js';
import { VARIANTS } from '../scripts/research-variants.js';
import { playTournamentGame } from '../src/tournament.js';

function fixture(variant, deployed = [], enemyPiece = false) {
  const board = Array(16).fill(null);
  board[12] = { owner: 'white', piece: 'king' };
  board[0] = { owner: 'black', piece: 'king' };
  if (enemyPiece) board[3] = { owner: 'black', piece: 'knight' };
  return createPosition({ board, banks: { white: ['rook', 'bishop', 'knight'], black: [] }, rules: VARIANTS[variant],
    research: { turns: { white: 3, black: 3 }, deployed: { white: [], black: deployed } } });
}
const checkingRook = { type: 'drop', piece: 'rook', to: 4 };
const permits = position => legalActions(position).some(a => JSON.stringify(a) === JSON.stringify(checkingRook));

test('lone-king protection distinguishes recurring protection from first-deployment protection', () => {
  for (const variant of ['protected-recurring', 'protected-opening']) {
    assert.equal(permits(fixture(variant)), false);
    assert.equal(permits(fixture(variant, ['knight'], true)), true);
  }
  assert.equal(permits(fixture('protected-recurring', ['knight'])), false);
  assert.equal(permits(fixture('protected-opening', ['knight'])), true);
  const before = fixture('protected-opening');
  const after = fixture('protected-opening', ['knight']);
  assert.notEqual(positionKey(before), positionKey(after));
});

test('grace requires three completed turns by both players; returned pieces stay quiet', () => {
  const p = fixture('grace');
  assert.equal(permits(p), true);
  p.research.turns.black = 2;
  assert.equal(permits(p), false);
  const q = fixture('quiet-return');
  assert.equal(permits(q), true);
  q.research.deployed.white.push('rook');
  assert.equal(permits(q), false);
});

test('all setup combinations finish with a full quiet army and the requested first mover', () => {
  for (const id of Object.keys(VARIANTS).filter(id => id.startsWith('setup-'))) {
    let p = createInitialPosition(VARIANTS[id]);
    p = applyAction(p, { type: 'place-king', to: 12 });
    p = applyAction(p, { type: 'place-king', to: 0 });
    assert.equal(p.phase, 'setup');
    // Find an actual complete setup instead of assuming greedy placement cannot block.
    function finish(pos, remaining) {
      if (pos.phase === 'play') return pos;
      if (!remaining) return null;
      for (const a of legalActions(pos)) {
        assert.equal(a.type, 'drop');
        const next = finish(applyAction(pos, a), remaining - 1);
        if (next) return next;
      }
      return null;
    }
    const done = finish(p, 6);
    assert.ok(done);
    assert.equal(done.board.filter(Boolean).length, 8);
    assert.equal(done.turn, VARIANTS[id].firstPlayer);
    assert.deepEqual(done.banks, { white: [], black: [] });
    assert.equal(p.board.filter(Boolean).length, 2, 'search must not mutate initial state');
  }
});

test('research tournament replay preserves every state key, mover and result', () => {
  for (const [id, rules] of Object.entries(VARIANTS)) {
    const game = playTournamentGame({ index: 0, seed: 42, white: 'learning', black: 'learning', maxPlies: 16, researchRules: rules });
    let p = createInitialPosition(rules);
    for (const entry of game.transcript) {
      if (entry.mover) assert.equal(entry.mover, p.turn, id);
      p = applyAction(p, entry.action);
      assert.equal(positionKey(p), entry.resultingKey, id);
    }
    assert.deepEqual(p, game.finalPosition, id);
    if (getResult(p)) assert.deepEqual(getResult(p), game.result);
  }
});

test('capturing the last deployed non-king restores only recurring protection', () => {
  for (const id of ['protected-recurring', 'protected-opening']) {
    const board = Array(16).fill(null);
    board[12] = { owner: 'white', piece: 'king' };
    board[0] = { owner: 'black', piece: 'king' };
    board[7] = { owner: 'white', piece: 'knight' };
    board[1] = { owner: 'black', piece: 'rook' };
    let p = createPosition({ board, banks: { white: ['rook','bishop'], black: ['bishop','knight'] }, rules: VARIANTS[id],
      research: { turns: { white:3, black:3 }, deployed: { white:['knight'], black:['rook'] } } });
    p = applyAction(p, { type: 'move', from:7, to:1 });
    assert.ok(p.banks.black.includes('rook'));
    p = applyAction(p, { type: 'move', from:0, to:4 });
    const allowed = legalActions(p).some(a => a.type === 'drop' && a.piece === 'rook' && a.to === 5);
    assert.equal(allowed, id === 'protected-opening');
  }
});
