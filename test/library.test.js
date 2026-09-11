import test from 'node:test';
import assert from 'node:assert/strict';
import { actionSequenceKey, decodeAction, encodeAction, matchesFilters, profilePairs, resultCode } from '../src/library.js';

test('compact actions round-trip all action types', () => {
  for (const action of [{ type: 'place-king', to: 12 }, { type: 'drop', piece: 'knight', to: 5 }, { type: 'move', from: 5, to: 2 }]) {
    assert.deepEqual(decodeAction(encodeAction(action)), action);
  }
});

test('uniqueness depends on the complete action sequence, not engine metadata', () => {
  const transcript = [{ action: { type: 'place-king', to: 12 } }, { action: { type: 'place-king', to: 0 } }];
  assert.equal(actionSequenceKey({ transcript, levels: { white: 'sharp' } }), actionSequenceKey({ transcript, levels: { white: 'learning' } }));
  assert.notEqual(actionSequenceKey({ transcript }), actionSequenceKey({ transcript: [...transcript, { action: { type: 'drop', piece: 'rook', to: 1 } }] }));
});

test('filters include every preserved engine provenance', () => {
  const game = { result: 'w', sources: [[1, 0, 'Sharp v1', 'Steady v1'], [2, 0, 'Sharp v2', 'Steady v1']] };
  assert.deepEqual(profilePairs(game), ['Sharp v1 vs Steady v1', 'Sharp v2 vs Steady v1']);
  assert.ok(matchesFilters(game, { white: '', black: '', result: 'w', version: 'Sharp v1' }));
  assert.ok(matchesFilters(game, { white: 'Sharp v2', black: 'Steady v1', result: '', version: '' }));
  assert.ok(!matchesFilters(game, { white: '', black: '', result: 'b', version: '' }));
});

test('tournament outcomes receive stable compact codes', () => {
  assert.equal(resultCode({ type: 'win', winner: 'white' }), 'w');
  assert.equal(resultCode({ type: 'draw', reason: 'threefold-repetition' }), 'r');
  assert.equal(resultCode({ type: 'draw', reason: 'ply-limit' }), 'p');
});
