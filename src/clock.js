import { BLACK, WHITE } from './rules.js';

export const CLOCK_PRESETS = Object.freeze([
  { id: 'untimed', label: 'Untimed', initial: 0, increment: 0 },
  { id: '3+2', label: '3+2', initial: 180, increment: 2 },
  { id: '5+0', label: '5+0', initial: 300, increment: 0 },
  { id: '10+0', label: '10+0', initial: 600, increment: 0 },
]);

export const LOW_TIME = 30;

/**
 * How far apart, in seconds, two players' views of one clock are allowed to
 * be before one is disbelieved. It covers one move's network latency with
 * room to spare; a peer cannot gain more than this per move by lying.
 */
export const SYNC_TOLERANCE = 3;

export function clockPreset(id) {
  return CLOCK_PRESETS.find((preset) => preset.id === id) ?? CLOCK_PRESETS[0];
}

export function createClock(id = 'untimed') {
  const preset = clockPreset(id);
  return {
    mode: preset.id,
    increment: preset.increment,
    running: false,
    [WHITE]: preset.initial,
    [BLACK]: preset.initial,
  };
}

export function isTimed(clock) {
  return Boolean(clock) && clock.mode !== 'untimed';
}

/** Spends elapsed milliseconds off the player on the move, never past zero. */
export function spend(clock, player, elapsedMs) {
  if (!isTimed(clock) || elapsedMs <= 0) return clock;
  return { ...clock, [player]: Math.max(0, clock[player] - elapsedMs / 1000) };
}

export function addIncrement(clock, player) {
  if (!isTimed(clock) || !clock.increment) return clock;
  return { ...clock, [player]: clock[player] + clock.increment };
}

export function flagged(clock) {
  if (!isTimed(clock)) return null;
  if (clock[WHITE] <= 0) return WHITE;
  if (clock[BLACK] <= 0) return BLACK;
  return null;
}

/** What a move carries: the mover's own account of both clocks after the move. */
export function clockReport(clock) {
  if (!isTimed(clock)) return null;
  return { [WHITE]: clock[WHITE], [BLACK]: clock[BLACK] };
}

export function isClockReport(value) {
  return Boolean(value) && typeof value === 'object' &&
    [WHITE, BLACK].every((side) => Number.isFinite(value[side]) && value[side] >= 0);
}

/**
 * Adopt the mover's account of its own clock, within tolerance of what the
 * receiver has already worked out for it. Each side is the authority on its
 * own time — it alone knows when it pressed the clock — so the receiver takes
 * the mover's number unless it is implausibly generous, and never touches its
 * own side. A report that is missing or malformed leaves the local view alone,
 * which is also what keeps a player on an older build in the game.
 */
export function adoptReport(clock, mover, report) {
  if (!isTimed(clock) || !isClockReport(report)) return clock;
  return { ...clock, [mover]: Math.min(report[mover], clock[mover] + SYNC_TOLERANCE) };
}

export function isLow(seconds) {
  return seconds < LOW_TIME;
}

/** Whole seconds, so a clock never shows 0:00 while time remains. */
export function formatClock(seconds) {
  const whole = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}
