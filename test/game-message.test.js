import test from 'node:test';
import assert from 'node:assert/strict';
import { BLACK, KING, KNIGHT, WHITE, createPosition, positionKey } from '../src/rules.js';
import { applyActionMessage, makeActionMessage } from '../src/game-message.js';

function game() {
  const board = Array(16).fill(null);
  board[15] = { owner: WHITE, piece: KING };
  board[0] = { owner: BLACK, piece: KING };
  return createPosition({ board, banks: { [WHITE]: [KNIGHT], [BLACK]: [] }, turn: WHITE });
}

test('a legal action message reproduces the same position on a peer', () => {
  const position = game();
  const message = makeActionMessage(position, { type: 'drop', piece: KNIGHT, to: 10 });
  const next = applyActionMessage(position, message);
  assert.equal(message.before, positionKey(position));
  assert.equal(message.after, positionKey(next));
  assert.deepEqual(next.board[10], { owner: WHITE, piece: KNIGHT });
});

test('malformed, illegal, stale, and forged messages are rejected', () => {
  const position = game();
  assert.throws(() => applyActionMessage(position, null), /Malformed/);
  assert.throws(() => makeActionMessage(position, { type: 'drop', piece: KNIGHT, to: 6 }), /illegal/);
  const valid = makeActionMessage(position, { type: 'drop', piece: KNIGHT, to: 10 });
  assert.throws(() => applyActionMessage(position, { ...valid, before: 'old' }), /out of sync/);
  assert.throws(() => applyActionMessage(position, { ...valid, after: 'forged' }), /does not match/);
});
