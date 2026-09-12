import test from 'node:test';
import assert from 'node:assert/strict';
import { actionHighlights, checkedSquares, checkmateSquare } from '../src/board-ui.js';
import { createPosition } from '../src/rules.js';

test('moves highlight their origin and destination', () => {
  assert.deepEqual(actionHighlights({ type: 'move', from: 9, to: 5 }), { from: 9, to: 5 });
});

test('drops and king placements highlight only their destination', () => {
  assert.deepEqual(actionHighlights({ type: 'drop', piece: 'rook', to: 6 }), { from: null, to: 6 });
  assert.deepEqual(actionHighlights({ type: 'place-king', to: 13 }), { from: null, to: 13 });
  assert.deepEqual(actionHighlights(null), { from: null, to: null });
});

test('checked squares are derived from the actual board for both king colors', () => {
  const board = Array(16).fill(null);
  board[0] = { owner: 'black', piece: 'king' };
  board[10] = { owner: 'black', piece: 'rook' };
  board[14] = { owner: 'white', piece: 'king' };
  const position = createPosition({ board, banks: {
    white: ['rook', 'bishop', 'knight'], black: ['bishop', 'knight'],
  }, turn: 'white' });
  assert.deepEqual([...checkedSquares(position)], [14]);
  assert.equal(checkmateSquare(position), null, 'a check with legal defenses must not say mate');
  board[10] = null;
  assert.deepEqual([...checkedSquares(createPosition({ board, banks: {
    white: ['rook', 'bishop', 'knight'], black: ['rook', 'bishop', 'knight'],
  }, turn: 'white' }))], []);
});

test('a mated king is distinct from one merely in check, including a defensive drop', () => {
  const board = Array(16).fill(null);
  board[0] = { owner: 'white', piece: 'king' };
  board[2] = { owner: 'black', piece: 'king' };
  board[1] = { owner: 'black', piece: 'bishop' };
  board[8] = { owner: 'black', piece: 'rook' };
  const banks = { white: [], black: [] };
  const mate = createPosition({ board, banks, turn: 'white' });
  assert.deepEqual([...checkedSquares(mate)], [0]);
  assert.equal(checkmateSquare(mate), 0);
  const defended = createPosition({ board, banks: { ...banks, white: ['rook'] }, turn: 'white' });
  assert.deepEqual([...checkedSquares(defended)], [0]);
  assert.equal(checkmateSquare(defended), null);
});
