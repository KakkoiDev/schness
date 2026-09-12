import test from 'node:test';
import assert from 'node:assert/strict';
import { actionHighlights, checkedSquares } from '../src/board-ui.js';
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
  board[10] = null;
  assert.deepEqual([...checkedSquares(createPosition({ board, banks: {
    white: ['rook', 'bishop', 'knight'], black: ['rook', 'bishop', 'knight'],
  }, turn: 'white' }))], []);
});
