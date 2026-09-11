import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePuzzleLevels, puzzlePool } from '../src/puzzle-settings.js';

const puzzles = [1, 2, 3, 4, 1, 3].map((mate, id) => ({ id, mate }));

test('any combination of mate depths creates one mixed puzzle pool', () => {
  assert.deepEqual(puzzlePool(puzzles, [1, 2]).map(({ mate }) => mate), [1, 2, 1]);
  assert.deepEqual(puzzlePool(puzzles, [2, 4]).map(({ mate }) => mate), [2, 4]);
});

test('puzzle levels are unique, ordered, and limited to one through four', () => {
  assert.deepEqual(normalizePuzzleLevels([4, '2', 2, 8]), [2, 4]);
  assert.deepEqual(normalizePuzzleLevels([]), [1, 2, 3, 4]);
});
