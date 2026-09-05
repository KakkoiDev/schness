import test from 'node:test';
import assert from 'node:assert/strict';
import { pieceCode, pieceName, squareIndex, squareName } from '../src/notation.js';

test('square 0 is a4 and square 15 is d1', () => {
  // Row 0 is Black's home rank, so the rank counts down as the index rises.
  assert.equal(squareName(0), 'a4');
  assert.equal(squareName(3), 'd4');
  assert.equal(squareName(12), 'a1');
  assert.equal(squareName(15), 'd1');
});

test('square names round-trip through their index', () => {
  for (let square = 0; square < 16; square += 1) {
    assert.equal(squareIndex(squareName(square)), square, `square ${square}`);
  }
});

test('square names are rejected outside the 4 x 4 board', () => {
  assert.equal(squareIndex('e1'), null);
  assert.equal(squareIndex('a5'), null);
  assert.equal(squareIndex('a0'), null);
  assert.equal(squareIndex(''), null);
  assert.throws(() => squareName(16));
  assert.throws(() => squareName(-1));
});

test('pieces carry a notation code and a prose name', () => {
  assert.equal(pieceCode('knight'), 'N');
  assert.equal(pieceCode('king'), 'K');
  assert.equal(pieceCode('nothing'), '');
  assert.equal(pieceName('bishop'), 'Bishop');
  assert.equal(pieceName(''), '');
});
