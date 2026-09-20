import test from 'node:test';
import assert from 'node:assert/strict';
import {
  actionSequenceKey, decodeAction, encodeAction, matchesFilters, profilePairs, resultCode,
  resultTone, sortGames,
} from '../src/library.js';

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

test('the result is a colour before it is a sentence', () => {
  assert.equal(resultTone('w'), 'white-won');
  assert.equal(resultTone('b'), 'black-won');
  for (const draw of ['r', 's', 'p', 'anything else']) assert.equal(resultTone(draw), 'draw');
});

test('sorting is stable, so an unsorted list keeps the order the archive gives it', () => {
  const games = [
    { id: 1, plies: 40, sources: [0] },
    { id: 2, plies: 12, sources: [0, 0, 0] },
    { id: 3, plies: 40, sources: [0, 0] },
  ];
  assert.deepEqual(sortGames(games, '').map((game) => game.id), [1, 2, 3]);
  assert.deepEqual(sortGames(games, 'short').map((game) => game.id), [2, 1, 3]);
  assert.deepEqual(sortGames(games, 'long').map((game) => game.id), [1, 3, 2]);
  assert.deepEqual(sortGames(games, 'repeated').map((game) => game.id), [2, 3, 1]);
  // Ties keep their original order rather than whatever the sort happens to do.
  assert.deepEqual(sortGames(games, 'short').slice(1).map((game) => game.plies), [40, 40]);
  assert.notEqual(sortGames(games, 'short'), games, 'the input array must not be reordered');
});
