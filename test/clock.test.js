import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CLOCK_PRESETS, SYNC_TOLERANCE, addIncrement, adoptReport, clockPreset, clockReport, createClock,
  flagged, formatClock, isClockReport, isLow, isTimed, spend,
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

test('a move carries the mover\'s account of both clocks, or nothing when untimed', () => {
  assert.deepEqual(clockReport(spend(createClock('3+2'), 'white', 4000)), { white: 176, black: 180 });
  assert.equal(clockReport(createClock()), null);
  assert.ok(isClockReport({ white: 1, black: 0 }));
  for (const bad of [null, 'x', {}, { white: 1 }, { white: -1, black: 2 }, { white: NaN, black: 2 }, { white: '3', black: 2 }]) {
    assert.equal(isClockReport(bad), false, JSON.stringify(bad));
  }
});

test('the receiver adopts the mover\'s own clock, but never more than tolerance above its own view', () => {
  const view = { ...createClock('3+2'), white: 100, black: 150 };
  // A mover reporting less than we thought is conceding time: taken as is.
  assert.equal(adoptReport(view, 'white', { white: 97, black: 999 }).white, 97);
  // The report never touches the receiver's own side, whatever it says.
  assert.equal(adoptReport(view, 'white', { white: 97, black: 999 }).black, 150);
  // Latency makes an honest report a little generous; a lie is capped there.
  assert.equal(adoptReport(view, 'white', { white: 102, black: 150 }).white, 102);
  assert.equal(adoptReport(view, 'white', { white: 500, black: 150 }).white, 100 + SYNC_TOLERANCE);
  // No report (an older build), a malformed one, or an untimed game: local view stands.
  assert.equal(adoptReport(view, 'white', undefined), view);
  assert.equal(adoptReport(view, 'white', { white: 'lots' }), view);
  assert.deepEqual(adoptReport(createClock(), 'white', { white: 1, black: 1 }), createClock());
});

/*
 * The protocol main.js runs, replayed here without the DOM: each side charges
 * whoever moved for the time since its clock last changed hands, and the
 * receiver then adopts the mover's report. Before the report existed the
 * receiving side charged nobody, so a player's own clock paid for both sides.
 */
test('two players keep one clock: their views never drift past the tolerance', () => {
  const latency = 250; // ms one way, deliberately bad
  const sides = { white: { clock: createClock('3+2'), since: 0 }, black: { clock: createClock('3+2'), since: latency } };
  let now = 0;
  const charge = (view, mover, at, report) => {
    view.clock = spend(view.clock, mover, at - view.since);
    view.clock = addIncrement(view.clock, mover);
    view.clock = adoptReport(view.clock, mover, report);
    view.since = at;
  };
  let mover = 'white';
  for (let ply = 0; ply < 80; ply += 1) {
    const think = 1000 + ((ply * 7919) % 5000); // 1-6 s, not symmetric
    now += think;
    charge(sides[mover], mover, now, null);               // the mover presses its clock
    const report = clockReport(sides[mover].clock);       // and its move carries the account
    const other = mover === 'white' ? 'black' : 'white';
    charge(sides[other], mover, now + latency, report);   // which lands one trip later
    const gap = Math.abs(sides.white.clock[mover] - sides.black.clock[mover]);
    assert.ok(gap <= SYNC_TOLERANCE, `ply ${ply}: views of ${mover} differ by ${gap}s`);
    mover = other;
  }
  // The mover's own screen is the authority, and the other screen agrees to the second.
  assert.ok(Math.abs(sides.white.clock.white - sides.black.clock.white) < 0.001);
  assert.ok(Math.abs(sides.white.clock.black - sides.black.clock.black) < 0.001);
});
