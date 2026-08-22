import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BISHOP,
  BLACK,
  KING,
  KNIGHT,
  ROOK,
  WHITE,
  actionKey,
  applyAction,
  createInitialPosition,
  createPosition,
  getResult,
  isInCheck,
  legalActions,
  positionKey,
} from '../src/rules.js';

const piece = (owner, kind) => ({ owner, piece: kind });
const emptyBoard = () => Array(16).fill(null);
const has = (actions, wanted) => actions.some((action) => actionKey(action) === actionKey(wanted));

function position({ pieces, whiteBank = [], blackBank = [], turn = WHITE, repetitions = {} }) {
  const board = emptyBoard();
  for (const [square, owner, kind] of pieces) board[square] = piece(owner, kind);
  return createPosition({
    board,
    banks: { [WHITE]: whiteBank, [BLACK]: blackBank },
    turn,
    repetitions,
  });
}

test('players place kings on their own home ranks, then white starts', () => {
  let game = createInitialPosition();
  assert.deepEqual(legalActions(game).map((action) => action.to), [12, 13, 14, 15]);
  game = applyAction(game, { type: 'place-king', to: 13 });
  assert.equal(game.turn, BLACK);
  assert.deepEqual(legalActions(game).map((action) => action.to), [0, 1, 2, 3]);
  game = applyAction(game, { type: 'place-king', to: 2 });
  assert.equal(game.phase, 'play');
  assert.equal(game.turn, WHITE);
  assert.equal(game.repetitions[positionKey(game)], 1);
});

test('king placement outside the home rank is illegal', () => {
  assert.throws(
    () => applyAction(createInitialPosition(), { type: 'place-king', to: 8 }),
    /Illegal action/,
  );
});

test('rook moves orthogonally and cannot pass through a piece', () => {
  const game = position({ pieces: [[15, WHITE, KING], [0, BLACK, KING], [9, WHITE, ROOK], [5, WHITE, BISHOP]] });
  const actions = legalActions(game);
  assert.equal(has(actions, { type: 'move', from: 9, to: 10 }), true);
  assert.equal(has(actions, { type: 'move', from: 9, to: 5 }), false);
  assert.equal(has(actions, { type: 'move', from: 9, to: 1 }), false);
});

test('bishop moves diagonally and knight jumps', () => {
  const game = position({ pieces: [[15, WHITE, KING], [3, BLACK, KING], [10, WHITE, BISHOP], [12, WHITE, KNIGHT]] });
  const actions = legalActions(game);
  assert.equal(has(actions, { type: 'move', from: 10, to: 5 }), true);
  assert.equal(has(actions, { type: 'move', from: 10, to: 9 }), false);
  assert.equal(has(actions, { type: 'move', from: 12, to: 5 }), true);
});

test('kings cannot move into check or become adjacent', () => {
  const game = position({ pieces: [[9, WHITE, KING], [2, BLACK, KING], [4, BLACK, ROOK]] });
  const actions = legalActions(game);
  assert.equal(has(actions, { type: 'move', from: 9, to: 8 }), false);
  assert.equal(has(actions, { type: 'move', from: 9, to: 6 }), false);
});

test('a captured piece returns to its original owner bank', () => {
  const game = position({ pieces: [[15, WHITE, KING], [0, BLACK, KING], [9, WHITE, ROOK], [1, BLACK, BISHOP]] });
  const next = applyAction(game, { type: 'move', from: 9, to: 1 });
  assert.deepEqual(next.banks[BLACK], [BISHOP]);
  assert.deepEqual(next.board[1], piece(WHITE, ROOK));
});

test('a bank piece can be dropped onto an empty square', () => {
  const game = position({ pieces: [[15, WHITE, KING], [0, BLACK, KING]], whiteBank: [KNIGHT] });
  const next = applyAction(game, { type: 'drop', piece: KNIGHT, to: 10 });
  assert.deepEqual(next.banks[WHITE], []);
  assert.deepEqual(next.board[10], piece(WHITE, KNIGHT));
});

test('a piece cannot be dropped onto an occupied square or from the opponent bank', () => {
  const game = position({
    pieces: [[15, WHITE, KING], [0, BLACK, KING]],
    whiteBank: [KNIGHT],
    blackBank: [ROOK],
  });
  const actions = legalActions(game);
  assert.equal(has(actions, { type: 'drop', piece: KNIGHT, to: 15 }), false);
  assert.equal(has(actions, { type: 'drop', piece: ROOK, to: 8 }), false);
});

test('a drop that gives check is forbidden', () => {
  const game = position({ pieces: [[15, WHITE, KING], [0, BLACK, KING]], whiteBank: [ROOK, KNIGHT] });
  const actions = legalActions(game);
  assert.equal(has(actions, { type: 'drop', piece: ROOK, to: 3 }), false);
  assert.equal(has(actions, { type: 'drop', piece: KNIGHT, to: 6 }), false);
  assert.equal(has(actions, { type: 'drop', piece: ROOK, to: 10 }), true);
});

test('a normal move may give check', () => {
  const game = position({ pieces: [[15, WHITE, KING], [0, BLACK, KING], [7, WHITE, ROOK]] });
  const next = applyAction(game, { type: 'move', from: 7, to: 4 });
  assert.equal(isInCheck(next, BLACK), true);
});

test('a drop may block an existing rook check', () => {
  const game = position({
    pieces: [[12, WHITE, KING], [3, BLACK, KING], [0, BLACK, ROOK]],
    whiteBank: [BISHOP],
    turn: WHITE,
  });
  assert.equal(isInCheck(game, WHITE), true);
  assert.equal(has(legalActions(game), { type: 'drop', piece: BISHOP, to: 4 }), true);
  const next = applyAction(game, { type: 'drop', piece: BISHOP, to: 4 });
  assert.equal(isInCheck(next, WHITE), false);
});

test('an action that does not resolve check is illegal', () => {
  const game = position({
    pieces: [[12, WHITE, KING], [3, BLACK, KING], [0, BLACK, ROOK]],
    whiteBank: [KNIGHT],
  });
  assert.equal(has(legalActions(game), { type: 'drop', piece: KNIGHT, to: 10 }), false);
});

test('a knight check cannot be blocked by a drop', () => {
  const game = position({
    pieces: [[15, WHITE, KING], [0, BLACK, KING], [9, BLACK, KNIGHT]],
    whiteBank: [ROOK, BISHOP],
  });
  assert.equal(isInCheck(game, WHITE), true);
  assert.equal(legalActions(game).some((action) => action.type === 'drop'), false);
});

test('checkmate includes all possible defensive drops', () => {
  const noBank = position({ pieces: [[0, WHITE, KING], [2, BLACK, KING], [1, BLACK, BISHOP], [8, BLACK, ROOK]] });
  assert.deepEqual(getResult(noBank), { type: 'win', winner: BLACK, reason: 'checkmate' });

  const withDefender = position({
    pieces: [[0, WHITE, KING], [2, BLACK, KING], [1, BLACK, BISHOP], [8, BLACK, ROOK]],
    whiteBank: [ROOK],
  });
  assert.equal(getResult(withDefender), null);
  assert.equal(has(legalActions(withDefender), { type: 'drop', piece: ROOK, to: 4 }), true);
});

test('stalemate is a draw', () => {
  const game = position({ pieces: [[0, WHITE, KING], [2, BLACK, KING], [1, BLACK, BISHOP], [3, BLACK, ROOK]] });
  assert.equal(isInCheck(game, WHITE), false);
  assert.deepEqual(getResult(game), { type: 'draw', reason: 'stalemate' });
});

test('position keys include board, banks, and side to move but not history', () => {
  const base = position({ pieces: [[15, WHITE, KING], [0, BLACK, KING]], whiteBank: [ROOK] });
  const same = createPosition({ ...base, repetitions: { old: 12 } });
  assert.equal(positionKey(base), positionKey(same));
  assert.notEqual(positionKey(base), positionKey({ ...base, turn: BLACK }));
  assert.notEqual(positionKey(base), positionKey({ ...base, banks: { ...base.banks, [WHITE]: [BISHOP] } }));
});

test('the third occurrence of a complete position is a draw', () => {
  const game = position({ pieces: [[15, WHITE, KING], [0, BLACK, KING]], whiteBank: [ROOK] });
  const key = positionKey(game);
  game.repetitions[key] = 3;
  assert.deepEqual(getResult(game), { type: 'draw', reason: 'threefold-repetition' });
});
