import test from 'node:test';
import assert from 'node:assert/strict';
import { humanSeatControllers } from '../src/arena.js';
test('switching human sides preserves bot difficulty', () => {
  for (const bot of ['learning', 'steady', 'sharp']) {
    assert.deepEqual(humanSeatControllers('black', 'human', bot), { white: bot, black: 'human' });
    assert.deepEqual(humanSeatControllers('white', bot, 'human'), { white: 'human', black: bot });
    assert.deepEqual(humanSeatControllers('watch', 'human', bot), { white: bot, black: bot });
  }
});
test('two human seats fall back to a steady opponent', () => {
  assert.deepEqual(humanSeatControllers('black', 'human', 'human'), { white: 'steady', black: 'human' });
});
