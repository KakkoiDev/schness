import test from 'node:test';
import assert from 'node:assert/strict';
import { BLACK, KING, ROOK, WHITE } from '../src/rules.js';
import { boardInventory, buildEditedPosition, controllerSearch, putEditorPiece } from '../src/arena.js';

test('two configurable seats map human to no search and bots to their strength', () => {
  assert.equal(controllerSearch('human'), null);
  assert.deepEqual(controllerSearch('learning'), { depth: 2, repetitionAversion: false });
  assert.deepEqual(controllerSearch('sharp'), { depth: 4, repetitionAversion: true });
});

test('the editor moves an owned piece instead of cloning it', () => {
  let board = Array(16).fill(null);
  board = putEditorPiece(board, 12, { owner: WHITE, piece: KING });
  board = putEditorPiece(board, 13, { owner: WHITE, piece: KING });
  assert.equal(board[12], null);
  assert.deepEqual(board[13], { owner: WHITE, piece: KING });
});

test('pieces omitted from an edited board return to their own reserve', () => {
  const board = Array(16).fill(null);
  board[12] = { owner: WHITE, piece: KING };
  board[0] = { owner: BLACK, piece: KING };
  board[9] = { owner: WHITE, piece: ROOK };
  const banks = boardInventory(board);
  assert.ok(!banks[WHITE].includes(ROOK));
  assert.ok(banks[BLACK].includes(ROOK));
  const position = buildEditedPosition(board, WHITE);
  assert.equal(position.repetitions[Object.keys(position.repetitions)[0]], 1);
});

test('the editor rejects incomplete or impossible side-to-move positions', () => {
  const board = Array(16).fill(null);
  board[12] = { owner: WHITE, piece: KING };
  assert.throws(() => buildEditedPosition(board, WHITE), /Black needs exactly one king/);
  board[0] = { owner: BLACK, piece: KING };
  board[4] = { owner: WHITE, piece: ROOK };
  assert.throws(() => buildEditedPosition(board, WHITE), /Black cannot already be in check/);
});
