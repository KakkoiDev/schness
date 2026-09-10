import test from 'node:test';
import assert from 'node:assert/strict';
import { playTournamentGame, seededRandom, startingKings } from '../src/tournament.js';

test('the tournament PRNG and transcripts are reproducible', () => {
  const one = seededRandom(42);
  const two = seededRandom(42);
  assert.deepEqual([one(), one(), one()], [two(), two(), two()]);
  const options = { index: 0, seed: 42, white: 'learning', black: 'learning', maxPlies: 8 };
  assert.deepEqual(playTournamentGame(options), playTournamentGame(options));
});

test('the sixteen opening combinations are balanced before repeating', () => {
  const combinations = new Set(Array.from({ length: 16 }, (_, index) => JSON.stringify(startingKings(index))));
  assert.equal(combinations.size, 16);
  assert.deepEqual(startingKings(16), startingKings(0));
});

test('a tournament transcript is self-contained and bounded', () => {
  const game = playTournamentGame({ index: 5, seed: 7, white: 'learning', black: 'steady', maxPlies: 6 });
  assert.equal(game.schema, 1);
  assert.equal(game.transcript.length, 6);
  assert.equal(game.result.reason, 'ply-limit');
  assert.deepEqual(game.startingKings, { white: 'b1', black: 'b4' });
  assert.ok(game.transcript.every((entry) => entry.action && entry.notation && entry.resultingKey));
  assert.equal(game.finalPosition.board.length, 16);
});
