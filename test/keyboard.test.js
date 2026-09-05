import test from 'node:test';
import assert from 'node:assert/strict';
import { isCursorKey, moveCursor, readEntry } from '../src/keyboard.js';

test('arrow keys move the cursor one square', () => {
  assert.equal(moveCursor(5, 'ArrowUp'), 1);
  assert.equal(moveCursor(5, 'ArrowDown'), 9);
  assert.equal(moveCursor(5, 'ArrowLeft'), 4);
  assert.equal(moveCursor(5, 'ArrowRight'), 6);
});

test('the cursor wraps at every edge', () => {
  assert.equal(moveCursor(0, 'ArrowUp'), 12);
  assert.equal(moveCursor(12, 'ArrowDown'), 0);
  assert.equal(moveCursor(4, 'ArrowLeft'), 7);
  assert.equal(moveCursor(7, 'ArrowRight'), 4);
});

test('the cursor never leaves the board', () => {
  for (const key of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']) {
    for (let visual = 0; visual < 16; visual += 1) {
      const next = moveCursor(visual, key);
      assert.ok(Number.isInteger(next) && next >= 0 && next < 16, `${key} from ${visual}`);
    }
  }
  assert.equal(moveCursor(5, 'Enter'), 5);
  assert.ok(isCursorKey('ArrowLeft'));
  assert.ok(!isCursorKey('Enter'));
});

test('a file then a rank jumps straight to that square', () => {
  const afterFile = readEntry(null, 'b');
  assert.equal(afterFile.pending, 'b');
  assert.equal(afterFile.square, null);
  const afterRank = readEntry(afterFile.pending, '1');
  assert.equal(afterRank.square, 13);
  assert.equal(afterRank.pending, null);
});

test('a bare digit picks a reserve slot, and 4 alone does nothing', () => {
  assert.equal(readEntry(null, '1').reserve, 0);
  assert.equal(readEntry(null, '3').reserve, 2);
  assert.equal(readEntry(null, '4').reserve, null);
  assert.equal(readEntry(null, '4').square, null);
});

test('an unrelated key clears a pending file', () => {
  assert.deepEqual(readEntry('b', 'Enter'), { pending: null, square: null, reserve: null });
  assert.equal(readEntry('b', 'c').pending, 'c');
});
