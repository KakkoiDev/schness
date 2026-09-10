import { BLACK, WHITE, applyAction, createInitialPosition, getResult } from './rules.js';
import { chooseAction } from './bot.js';
import { recordAction } from './history.js';
import { squareName } from './notation.js';
import { LEVEL_DEPTH } from './watch.js';

export const TOURNAMENT_SCHEMA = 1;

export function seededRandom(seed) {
  let state = Number(seed) >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function startingKings(index) {
  const combination = index % 16;
  return { white: 12 + (combination % 4), black: Math.floor(combination / 4) };
}

export function playTournamentGame({ index, seed, white = 'sharp', black = 'sharp', maxPlies = 200 }) {
  if (!Number.isInteger(index) || index < 0) throw new TypeError('index must be a non-negative integer');
  if (!LEVEL_DEPTH[white] || !LEVEL_DEPTH[black]) throw new TypeError('unknown AI level');
  const gameSeed = (Number(seed) + Math.imul(index + 1, 0x9e3779b9)) >>> 0;
  const random = seededRandom(gameSeed);
  const kings = startingKings(index);
  let position = createInitialPosition();
  let history = [];

  for (const to of [kings.white, kings.black]) {
    const before = position;
    position = applyAction(position, { type: 'place-king', to });
    history = recordAction(history, before, { type: 'place-king', to }, position);
  }

  let result = getResult(position);
  while (!result && history.length < maxPlies) {
    const level = position.turn === WHITE ? white : black;
    const action = chooseAction(position, { depth: LEVEL_DEPTH[level], random });
    if (!action) break;
    const before = position;
    position = applyAction(position, action);
    history = recordAction(history, before, action, position);
    result = getResult(position);
  }
  result ??= { type: 'draw', reason: 'ply-limit' };

  return {
    schema: TOURNAMENT_SCHEMA,
    index,
    seed: gameSeed,
    levels: { white, black },
    startingKings: { white: squareName(kings.white), black: squareName(kings.black) },
    result,
    plies: history.length,
    transcript: history,
    finalPosition: position,
  };
}

export function resultKey(result) {
  if (result.type === 'win') return `${result.winner}-win`;
  return `draw-${result.reason}`;
}
