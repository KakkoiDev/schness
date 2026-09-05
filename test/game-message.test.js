import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BLACK, KING, KNIGHT, WHITE,
  applyAction, createInitialPosition, createPosition, getResult, positionKey,
} from '../src/rules.js';
import { recordAction } from '../src/history.js';
import { applyActionMessage, makeActionMessage, outcomeSummary } from '../src/game-message.js';

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

test('a win names the mating piece, its square and the counts', () => {
  // White's rook steps off c2, mating with c4 while discovering the d1 bishop.
  const board = Array(16).fill(null);
  board[0] = { owner: 'black', piece: 'king' };
  board[10] = { owner: 'white', piece: 'rook' };
  board[15] = { owner: 'white', piece: 'bishop' };
  board[13] = { owner: 'white', piece: 'knight' };
  board[14] = { owner: 'white', piece: 'king' };
  const start = createPosition({ board, banks: { white: [], black: [] } });
  assert.equal(getResult(start), null);
  const mate = { type: 'move', from: 10, to: 2 };
  const after = applyAction(start, mate);
  assert.equal(getResult(after)?.reason, 'checkmate');
  const history = recordAction([], start, mate, after);
  const summary = outcomeSummary({
    position: after, timeline: [start, after], history, humanColor: 'white',
  });
  assert.equal(summary.headline, 'You win');
  assert.equal(summary.tone, 'win');
  assert.equal(summary.eyebrow, 'Checkmate');
  assert.match(summary.detail, /The rook on c4 closed off the last square/);
  assert.match(summary.detail, /1 moves, 0 deployments/);
});

test('a loss names the square and what would have held', () => {
  const board = Array(16).fill(null);
  board[0] = { owner: 'black', piece: 'king' };
  board[10] = { owner: 'white', piece: 'rook' };
  board[15] = { owner: 'white', piece: 'bishop' };
  board[13] = { owner: 'white', piece: 'knight' };
  board[14] = { owner: 'white', piece: 'king' };
  const start = createPosition({ board, banks: { white: [], black: [] } });
  const after = applyAction(start, { type: 'move', from: 10, to: 2 });
  const history = recordAction([], start, { type: 'move', from: 10, to: 2 }, after);
  const summary = outcomeSummary({
    position: after, timeline: [start, after], history, humanColor: 'black',
  });
  assert.equal(summary.headline, 'White wins');
  assert.equal(summary.tone, 'neutral');
  assert.match(summary.detail, /Your king ran out of squares on a4/);
});

test('stalemate says why it is a draw, including the reserve', () => {
  // Black king on a4 with every flight square covered, and nothing to deploy.
  const board = Array(16).fill(null);
  board[0] = { owner: 'black', piece: 'king' };
  board[8] = { owner: 'white', piece: 'knight' };
  board[7] = { owner: 'white', piece: 'rook' };
  board[15] = { owner: 'white', piece: 'king' };
  const position = createPosition({ board, banks: { white: [], black: [] }, turn: 'black' });
  assert.equal(getResult(position)?.reason, 'stalemate');
  const summary = outcomeSummary({ position, humanColor: 'white', history: [] });
  assert.equal(summary.headline, 'Stalemate');
  assert.match(summary.detail, /Black has no legal move and is not in check/);
  assert.match(summary.detail, /reserve/);
});

test('a resignation reports the move it ended on', () => {
  const summary = outcomeSummary({
    position: createInitialPosition(), history: [], humanColor: 'white',
    resigned: 'black', opponentName: 'Mira',
  });
  assert.equal(summary.headline, 'Mira resigned');
  assert.match(summary.detail, /You can still walk back through it/);
});

test('losing on the clock is not reported as resigning', () => {
  // The clock flag reuses the resignation state machine; the words must not.
  const mine = outcomeSummary({
    position: createInitialPosition(), history: [], humanColor: 'white',
    resigned: 'white', onTime: true,
  });
  assert.equal(mine.eyebrow, 'Time');
  assert.equal(mine.headline, 'You ran out of time');
  assert.doesNotMatch(mine.headline + mine.detail, /resign/i);
  const theirs = outcomeSummary({
    position: createInitialPosition(), history: [], humanColor: 'white',
    resigned: 'black', onTime: true, opponentName: 'Mira',
  });
  assert.equal(theirs.headline, 'Mira ran out of time');
  assert.equal(theirs.tone, 'win');
});

test('an agreed draw is distinct from a stalemate', () => {
  const summary = outcomeSummary({
    position: createInitialPosition(), history: [], humanColor: 'white', agreedDraw: true,
  });
  assert.equal(summary.headline, 'Draw agreed');
});

test('an unfinished game has no summary', () => {
  assert.equal(outcomeSummary({ position: createInitialPosition(), humanColor: 'white' }), null);
});
