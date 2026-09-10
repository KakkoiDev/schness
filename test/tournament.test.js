import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TOURNAMENT_AI,
  TOURNAMENT_RULES,
  buildResearchPlan,
  playTournamentGame,
  seededRandom,
  startingKings,
} from '../src/tournament.js';
import { bufferNeeded } from '../src/watch.js';

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

test('a research set balances levels, colors, and all king placements', () => {
  const plan = buildResearchPlan(1);
  assert.equal(plan.length, 80);
  for (const matchup of ['sharp-sharp', 'sharp-steady', 'steady-sharp', 'sharp-learning', 'learning-sharp']) {
    const games = plan.filter((game) => `${game.white}-${game.black}` === matchup);
    assert.equal(games.length, 16, matchup);
    assert.deepEqual(games.map((game) => game.opening), Array.from({ length: 16 }, (_, index) => index));
  }
  assert.equal(buildResearchPlan(13).length, 1040);
});

test('the spectator maintains a bounded ten-move rolling buffer', () => {
  assert.equal(bufferNeeded(0, 0), 10);
  assert.equal(bufferNeeded(3, 10), 3);
  assert.equal(bufferNeeded(4, 14), 0);
  assert.equal(bufferNeeded(4, 20), 0);
  assert.equal(bufferNeeded(4, 5, true), 0);
});

test('a tournament transcript is self-contained and bounded', () => {
  const game = playTournamentGame({ index: 5, seed: 7, white: 'learning', black: 'steady', maxPlies: 6 });
  assert.equal(game.schema, 2);
  assert.equal(game.transcript.length, 6);
  assert.equal(game.result.reason, 'ply-limit');
  assert.deepEqual(game.startingKings, { white: 'b1', black: 'b4' });
  assert.ok(game.transcript.every((entry) => entry.action && entry.notation && entry.resultingKey));
  assert.equal(game.finalPosition.board.length, 16);
  assert.equal(game.engines.white.version, 1);
  assert.equal(game.engines.black.depth, 3);
});

test('tournament metadata records the rules and Sharp v2 behavior', () => {
  assert.ok(TOURNAMENT_RULES.some((rule) => rule.includes('threefold repetition')));
  assert.deepEqual(TOURNAMENT_AI.sharp, {
    version: 2,
    depth: 4,
    behavior: 'Deep alpha-beta; among equally scored moves, prefers the resulting position seen fewer times, while retaining a draw that avoids a worse score.',
  });
});
