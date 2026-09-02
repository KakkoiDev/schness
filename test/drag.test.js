import test from 'node:test';
import assert from 'node:assert/strict';
import { movedEnough } from '../src/drag.js';

test('a pointer becomes a drag only after a deliberate movement', () => {
  const start = { startX: 10, startY: 10 };
  assert.equal(movedEnough(start, { clientX: 15, clientY: 14 }), false);
  assert.equal(movedEnough(start, { clientX: 18, clientY: 10 }), true);
});
