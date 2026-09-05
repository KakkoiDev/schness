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
  applyLegalAction,
  createInitialPosition,
  createPosition,
  getResult,
  isInCheck,
  legalActions,
  legalActionsUnchecked,
  occupantOf,
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

test('position keys distinguish kings from knights', () => {
  const kingBoard = emptyBoard();
  kingBoard[15] = piece(WHITE, KING);
  kingBoard[0] = piece(BLACK, KING);
  const knightBoard = kingBoard.map((occupant) => occupant ? { ...occupant } : null);
  knightBoard[8] = piece(WHITE, KNIGHT);
  const withKnightOnBoard = createPosition({
    board: knightBoard,
    banks: { [WHITE]: [], [BLACK]: [] },
    turn: WHITE,
  });
  const withKnightInBank = createPosition({
    board: kingBoard,
    banks: { [WHITE]: [KNIGHT], [BLACK]: [] },
    turn: WHITE,
  });
  assert.notEqual(positionKey(withKnightOnBoard), positionKey(withKnightInBank));
  assert.match(positionKey(withKnightOnBoard), /N/);
});

test('the third occurrence of a complete position is a draw', () => {
  const game = position({ pieces: [[15, WHITE, KING], [0, BLACK, KING]], whiteBank: [ROOK] });
  const key = positionKey(game);
  game.repetitions[key] = 3;
  assert.deepEqual(getResult(game), { type: 'draw', reason: 'threefold-repetition' });
});

/*
 * Move generation, counted exhaustively to a fixed depth. These numbers are
 * the engine's fingerprint: any change to legality, to how a capture refills
 * a reserve, or to where a king may be placed moves at least one of them.
 *
 * They were pinned while making the search 4.3x faster, where the whole risk
 * was that a hot-path rewrite would quietly play a different game. Nothing
 * else in the suite would have caught that. If you change the rules on
 * purpose, recompute them and say so in DECISIONS.md; if one moves and you
 * did not mean it, you have a bug.
 */
function perft(position, depth) {
  const actions = legalActions(position);
  if (depth === 1) return actions.length;
  let total = 0;
  for (const action of actions) total += perft(applyAction(position, action), depth - 1);
  return total;
}

test('move generation counts exactly what it has always counted', () => {
  const start = createInitialPosition();
  assert.equal(perft(start, 1), 4);
  assert.equal(perft(start, 2), 16);
  assert.equal(perft(start, 3), 558);
  assert.equal(perft(start, 4), 17896);
});

test('occupants are frozen shared values, so sharing a board can never leak a write', () => {
  // `boardAfter` and `clonePosition` copy arrays, not occupants. That is only
  // safe while nothing ever mutates an occupant, and a comment saying so is
  // not a guard. Every occupant is one of eight frozen values instead: two
  // boards holding a white rook hold the same object, and a write throws.
  const start = applyAction(createInitialPosition(), { type: 'place-king', to: 13 });
  const next = applyAction(start, { type: 'place-king', to: 2 });
  assert.equal(next.board[13], start.board[13], 'a clone should share the occupant, not copy it');
  assert.equal(next.board[13], occupantOf(WHITE, KING));
  assert.ok(Object.isFrozen(next.board[13]));
  assert.throws(() => { next.board[13].piece = ROOK; }, TypeError);
  const fromOutside = createPosition({
    board: [piece(WHITE, KING), ...Array(14).fill(null), piece(BLACK, KING)],
    banks: { [WHITE]: [], [BLACK]: [] },
  });
  assert.equal(fromOutside.board[0], occupantOf(WHITE, KING), 'createPosition canonicalises what it is given');
});

test('the search shortcuts agree with the validating entry points', () => {
  // The bot skips validation and re-derivation on paths where it produced the
  // position itself. Skipping them may not change a single answer.
  const walk = (node, depth) => {
    const guarded = legalActions(node);
    const direct = legalActionsUnchecked(node);
    assert.deepEqual(direct.map(actionKey).sort(), guarded.map(actionKey).sort());
    if (depth === 0) return;
    for (const action of guarded) {
      const viaChecked = applyAction(node, action);
      const viaDirect = applyLegalAction(node, action);
      assert.equal(positionKey(viaDirect), positionKey(viaChecked));
      assert.deepEqual(viaDirect.repetitions, viaChecked.repetitions);
      walk(viaChecked, depth - 1);
    }
  };
  walk(createInitialPosition(), 3);
});
