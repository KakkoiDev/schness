import { BLACK, WHITE, applyAction, createInitialPosition, getResult } from './rules.js';
import { chooseAction } from './bot.js';
import { recordAction } from './history.js';
import { squareName } from './notation.js';
import { LEVEL_DEPTH } from './watch.js';

export const TOURNAMENT_SCHEMA = 2;
export const TOURNAMENT_RULES = Object.freeze([
  'The 4×4 board starts empty; White places a king on rank 1, then Black on rank 4.',
  'On each later turn, move one deployed piece or drop one owned reserve piece on an empty square.',
  'A drop may not give check; a normal move may give check.',
  'A captured rook, bishop, or knight returns to its original owner’s reserve.',
  'Normal king safety and checkmate apply; stalemate and threefold repetition are draws.',
]);
export const TOURNAMENT_AI = Object.freeze({
  learning: Object.freeze({ version: 1, depth: 2, behavior: 'Shallow alpha-beta; seeded random choice among equally scored moves.' }),
  steady: Object.freeze({ version: 1, depth: 3, behavior: 'Medium alpha-beta; seeded random choice among equally scored moves.' }),
  sharp: Object.freeze({ version: 2, depth: 4, behavior: 'Deep alpha-beta; among equally scored moves, prefers the resulting position seen fewer times, while retaining a draw that avoids a worse score.' }),
});
export const RESEARCH_MATCHUPS = Object.freeze([
  Object.freeze({ white: 'sharp', black: 'sharp' }),
  Object.freeze({ white: 'sharp', black: 'steady' }),
  Object.freeze({ white: 'steady', black: 'sharp' }),
  Object.freeze({ white: 'sharp', black: 'learning' }),
  Object.freeze({ white: 'learning', black: 'sharp' }),
]);

/** Every matchup receives all 16 king placements before the next repeat. */
export function buildResearchPlan(repetitions = 13) {
  if (!Number.isInteger(repetitions) || repetitions < 1) throw new TypeError('repetitions must be a positive integer');
  const plan = [];
  for (let repetition = 0; repetition < repetitions; repetition += 1) {
    for (const levels of RESEARCH_MATCHUPS) {
      for (let opening = 0; opening < 16; opening += 1) {
        plan.push({ index: plan.length, repetition, opening, ...levels });
      }
    }
  }
  return plan;
}

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
    const action = chooseAction(position, {
      depth: LEVEL_DEPTH[level],
      random,
      repetitionAversion: level === 'sharp',
    });
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
    engines: {
      white: { level: white, ...TOURNAMENT_AI[white] },
      black: { level: black, ...TOURNAMENT_AI[black] },
    },
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
