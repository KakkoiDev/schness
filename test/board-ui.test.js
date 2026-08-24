import test from 'node:test';
import assert from 'node:assert/strict';
import { actionHighlights } from '../src/board-ui.js';

test('moves highlight their origin and destination', () => {
  assert.deepEqual(actionHighlights({ type: 'move', from: 9, to: 5 }), { from: 9, to: 5 });
});

test('drops and king placements highlight only their destination', () => {
  assert.deepEqual(actionHighlights({ type: 'drop', piece: 'rook', to: 6 }), { from: null, to: 6 });
  assert.deepEqual(actionHighlights({ type: 'place-king', to: 13 }), { from: null, to: 13 });
  assert.deepEqual(actionHighlights(null), { from: null, to: null });
});
