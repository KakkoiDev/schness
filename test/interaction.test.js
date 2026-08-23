import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BLACK,
  KING,
  KNIGHT,
  ROOK,
  WHITE,
  createPosition,
} from '../src/rules.js';
import {
  actionAt,
  bankSelection,
  boardSelection,
  destinations,
  setupActionAt,
  setupDestinations,
} from '../src/interaction.js';

function game() {
  const board = Array(16).fill(null);
  board[15] = { owner: WHITE, piece: KING };
  board[0] = { owner: BLACK, piece: KING };
  board[9] = { owner: WHITE, piece: ROOK };
  return createPosition({ board, banks: { [WHITE]: [KNIGHT], [BLACK]: [] }, turn: WHITE });
}

test('board selection exposes only that piece legal destinations', () => {
  const position = game();
  const targets = destinations(position, boardSelection(9));
  assert.equal(targets.has(10), true);
  assert.equal(targets.has(15), false);
  assert.deepEqual(actionAt(position, boardSelection(9), 10), { type: 'move', from: 9, to: 10 });
});

test('bank selection exposes legal non-checking drops', () => {
  const position = game();
  const targets = destinations(position, bankSelection(KNIGHT));
  assert.equal(targets.has(10), true);
  assert.equal(targets.has(9), false);
  assert.equal(targets.has(6), false);
});

test('setup square resolves to a king placement only on the home rank', () => {
  const position = {
    board: Array(16).fill(null),
    banks: { [WHITE]: [ROOK, 'bishop', KNIGHT], [BLACK]: [ROOK, 'bishop', KNIGHT] },
    turn: WHITE,
    phase: 'place-white-king',
    repetitions: {},
  };
  assert.deepEqual(setupActionAt(position, 12), { type: 'place-king', to: 12 });
  assert.equal(setupActionAt(position, 0), null);
  assert.deepEqual([...setupDestinations(position)], [12, 13, 14, 15]);
});

test('a reserve selection exposes a legal square that blocks check', () => {
  const board = Array(16).fill(null);
  board[12] = { owner: WHITE, piece: KING };
  board[3] = { owner: BLACK, piece: KING };
  board[0] = { owner: BLACK, piece: ROOK };
  const position = createPosition({ board, banks: { [WHITE]: ['bishop'], [BLACK]: [] }, turn: WHITE });
  assert.deepEqual([...destinations(position, bankSelection('bishop'))], [4, 8]);
  assert.deepEqual(actionAt(position, bankSelection('bishop'), 4), { type: 'drop', piece: 'bishop', to: 4 });
});
