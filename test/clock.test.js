import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CLOCK_PRESETS, addIncrement, clockPreset, createClock, flagged, formatClock,
  isLow, isTimed, spend,
} from '../src/clock.js';

test('the clock is untimed by default', () => {
  const clock = createClock();
  assert.equal(clock.mode, 'untimed');
  assert.equal(isTimed(clock), false);
  assert.equal(CLOCK_PRESETS[0].id, 'untimed');
  assert.equal(clockPreset('nonsense').id, 'untimed');
});

test('a preset seeds both sides equally', () => {
  const clock = createClock('3+2');
  assert.equal(clock.white, 180);
  assert.equal(clock.black, 180);
  assert.equal(clock.increment, 2);
  assert.ok(isTimed(clock));
});

test('time comes off the side on the move and never goes below zero', () => {
  const clock = spend(createClock('5+0'), 'white', 4000);
  assert.equal(clock.white, 296);
  assert.equal(clock.black, 300);
  assert.equal(spend(clock, 'white', 10_000_000).white, 0);
});

test('an untimed clock ignores spending and increments', () => {
  const clock = createClock();
  assert.equal(spend(clock, 'white', 5000), clock);
  assert.equal(addIncrement(clock, 'white'), clock);
});

test('the increment is added only when the preset has one', () => {
  assert.equal(addIncrement(createClock('3+2'), 'black').black, 182);
  assert.equal(addIncrement(createClock('5+0'), 'black').black, 300);
});

test('a side that reaches zero has flagged', () => {
  assert.equal(flagged(createClock('3+2')), null);
  assert.equal(flagged(spend(createClock('3+2'), 'black', 200_000)), 'black');
  assert.equal(flagged(createClock()), null);
});

test('clocks read as whole seconds and go low under thirty', () => {
  assert.equal(formatClock(180), '3:00');
  assert.equal(formatClock(7.2), '0:08');
  assert.equal(formatClock(0), '0:00');
  assert.equal(formatClock(-5), '0:00');
  assert.ok(isLow(29));
  assert.ok(!isLow(30));
});
