import { BOARD_SIZE } from './rules.js';
import { FILES, squareIndex } from './notation.js';

const STEPS = Object.freeze({
  ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1],
});

export function isCursorKey(key) {
  return Object.hasOwn(STEPS, key);
}

/**
 * Moves the cursor one square, wrapping at the edges. This works in visual
 * space, so it is orientation-agnostic: main.js translates to a logical
 * square the same way a click does.
 */
export function moveCursor(visual, key) {
  const step = STEPS[key];
  if (!step) return visual;
  const row = (Math.floor(visual / BOARD_SIZE) + step[0] + BOARD_SIZE) % BOARD_SIZE;
  const column = ((visual % BOARD_SIZE) + step[1] + BOARD_SIZE) % BOARD_SIZE;
  return row * BOARD_SIZE + column;
}

/**
 * Digits are shared: a file letter followed by a rank names a square, while a
 * bare 1-3 picks a reserve slot. Returns the pending file, if any, plus
 * whichever jump the key completed.
 */
export function readEntry(pending, key) {
  const typed = typeof key === 'string' ? key.toLowerCase() : '';
  if (FILES.includes(typed)) return { pending: typed, square: null, reserve: null };
  if (/^[1-4]$/.test(typed)) {
    if (pending) return { pending: null, square: squareIndex(pending + typed), reserve: null };
    const slot = Number(typed) - 1;
    return { pending: null, square: null, reserve: slot < 3 ? slot : null };
  }
  return { pending: null, square: null, reserve: null };
}
