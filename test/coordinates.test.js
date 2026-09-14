import test from 'node:test';
import assert from 'node:assert/strict';
import { squareCoordinate } from '../src/board-ui.js';
test('board coordinates follow algebraic notation independent of orientation', () => {
  assert.equal(squareCoordinate(0), 'a4');
  assert.equal(squareCoordinate(3), 'd4');
  assert.equal(squareCoordinate(12), 'a1');
  assert.equal(squareCoordinate(15), 'd1');
  assert.equal(new Set(Array.from({ length:16 }, (_, i) => squareCoordinate(i))).size, 16);
});
