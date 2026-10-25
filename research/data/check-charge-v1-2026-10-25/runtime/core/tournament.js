import { BLACK, WHITE, applyAction, createInitialPosition, getResult, isInCheck, occupantOf } from './rules.js';
import { chooseAction } from './bot.js';
import { recordAction } from './history.js';
import { squareName } from './notation.js';
import { LEVEL_DEPTH } from './watch.js';

export const TOURNAMENT_SCHEMA = 3;
export const TOURNAMENT_RULES = tournamentRules();

export function tournamentRules({ allowCheckingDrops = false, experiment, setup, firstPlayer, hiddenSetup, bankCapacity, ...bench } = {}) {
  return Object.freeze([
  'The 4×4 board starts empty; White places a king on rank 1, then Black on rank 4.',
  'On each later turn, move one deployed piece or drop one owned reserve piece on an empty square.',
  allowCheckingDrops
    ? 'A drop may give check, just like a normal move.'
    : 'A drop may not give check; a normal move may give check.',
  ...(experiment ? [`Research variant: ${experiment}.`, ...(setup ? [`Alternate all six non-king placements without check, moves or captures; ${firstPlayer} starts normal play. A blocked setup is a draw.`] : []), ...(experiment === 'protected-recurring' ? ['No checking drop against a lone king, including after captures.'] : []), ...(experiment === 'protected-opening' ? ['No checking drop before the opponent first deploys a non-king; protection never returns.'] : []), ...(['grace', 'quiet-return'].includes(experiment) ? ['No checking drops until both players complete three post-king turns.'] : []), ...(experiment === 'quiet-return' ? ['Previously deployed pieces cannot give check on return drops.'] : [])] : []),
  ...(experiment === 'balance-bench' ? [`Captures transfer to the capturer up to ${bankCapacity} held pieces; overflow returns to the captured side.`, `Bench options: ${JSON.stringify(bench)}. Delays tick after the reserve owner's completed play turns, excluding the capture turn for new arrivals. Forced wait only without legal actions and outside check; it consumes one ply. Initial reserves are ready.`] : []),
  ...(hiddenSetup ? ['Each player privately samples a uniform legal arrangement on their home rank, independently of the other player’s pieces. Both reveal simultaneously; serialized setup drops are replay-only.'] : []),
  ...({ 'first-turn-quiet': ['Neither player may check by drop on their first post-king turn.'], 'protected-first-turn': ['Neither player may check by drop on their first post-king turn, and checking drops against lone kings stay forbidden.'], 'mutual-one': ['Checking drops unlock permanently once both players have deployed a non-king.'], 'mutual-two': ['Checking drops unlock permanently once both players have deployed two distinct non-kings.'], 'limited-check': ['Each player may make at most one checking drop.'], cooldown: ['No checking drop on the turn immediately following that player’s own checking drop.'], 'no-drop-mate': ['A drop may check but cannot immediately checkmate.'] }[experiment] ?? []),
  experiment === 'permanent-loss' ? 'Captured non-kings leave the game permanently; unused reserves remain available for one deployment.'
    : ['capture-bank','balance-bench'].includes(experiment) ? `Captured non-kings join the capturer’s reserve if fewer than ${bankCapacity} pieces are held; otherwise return to the captured side’s reserve.`
    : 'A captured rook, bishop, or knight returns to its original owner’s reserve.',
  ...(bench.sliderRange ? [`Rooks and bishops move and attack at most ${bench.sliderRange} squares.`] : []),
  ...(bench.checkTarget ? [`Delivering ${bench.checkTarget} checks wins; one checking action counts once, even a double check. Checkmate also wins.`] : []),
  ...(bench.centerHold ? ['Holding the same central square (b2/c2/b3/c3) with your king through one opponent reply wins if your king is not then in check. A checking reply cancels the claim. Checkmate also wins.'] : []),
  ...(bench.mandatoryCaptures ? ['If at least one king-safe capture is legal, only captures may be played. Otherwise all normal legal actions remain available.'] : []),
  ...(bench.homeHalfDrops ? ['All drops must land in the owner’s home half; ordinary board moves remain unrestricted.'] : []),
  ...(bench.returnDelay !== undefined ? [`Overflow pieces returning to the captured side wait ${bench.returnDelay} owner turns instead of using the capture delay.`] : []),
  ...(bench.noDropMate ? ['A checking drop is forbidden if the checked opponent has no legal reply under this same ruleset; mating board moves remain legal.'] : []),
  ...(bench.checkChargeCap ? [`Checking-drop charges start at zero with maximum ${bench.checkChargeCap}. A checking drop spends one and gives no recharge that turn; every other own play action restores one up to the cap. King placement does not charge. Normal checks spend nothing; drop-mate allowed when charged.`] : []),
  'Normal king safety and checkmate apply; stalemate and threefold repetition are draws.',
  ]);
}
export const TOURNAMENT_AI = Object.freeze({
  learning: Object.freeze({ version: 1, engine: 'variant-objective-search-v3', depth: 2, behavior: 'Shallow alpha-beta; seeded random choice among equally scored moves.' }),
  steady: Object.freeze({ version: 1, engine: 'variant-objective-search-v3', depth: 3, behavior: 'Medium alpha-beta; seeded random choice among equally scored moves.' }),
  sharp: Object.freeze({ version: 1, engine: 'variant-objective-search-v3', depth: 4, behavior: 'Research Sharp: history-aware alpha-beta and objective-aware evaluation; among equally scored moves, prefers the resulting position seen fewer times, while retaining a draw that avoids a worse score.' }),
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

export function playTournamentGame({
  index,
  seed,
  white = 'sharp',
  black = 'sharp',
  maxPlies = 200,
  allowCheckingDrops = false,
  researchRules = null,
}) {
  if (!Number.isInteger(index) || index < 0) throw new TypeError('index must be a non-negative integer');
  if (!LEVEL_DEPTH[white] || !LEVEL_DEPTH[black]) throw new TypeError('unknown AI level');
  const gameSeed = (Number(seed) + Math.imul(index + 1, 0x9e3779b9)) >>> 0;
  const random = seededRandom(gameSeed);
  const kings = startingKings(index);
  const ruleset = researchRules ?? { allowCheckingDrops: Boolean(allowCheckingDrops) };
  let position = createInitialPosition(ruleset);
  let history = [];

  for (const to of [kings.white, kings.black]) {
    const before = position;
    position = applyAction(position, { type: 'place-king', to });
    history = recordAction(history, before, { type: 'place-king', to }, position);
  }

  const hiddenSetup = ruleset.hiddenSetup ? hiddenSetupPlacements(kings, gameSeed) : null;
  if (hiddenSetup) {
    // Both choices are committed before either is applied; serialization is only for replay.
    for (let slot = 0; slot < 3; slot++) for (const player of [WHITE, BLACK]) {
      const before = position;
      const action = hiddenSetup[player][slot];
      position = applyAction(position, action);
      history = recordAction(history, before, action, position);
      Object.assign(history[history.length - 1], { mover: player, phase: 'setup', simultaneousReveal: true });
    }
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
    history[history.length - 1].mover = before.turn;
    history[history.length - 1].phase = before.phase;
    result = getResult(position);
  }
  result ??= { type: 'draw', reason: 'ply-limit' };

  return {
    schema: TOURNAMENT_SCHEMA,
    index,
    seed: gameSeed,
    levels: { white, black },
    ...(['capture-bank','permanent-loss','balance-bench'].includes(ruleset.experiment) ? { evaluationPolicy: `${ruleset.experiment === 'permanent-loss' ? 'finite' : 'capture'}-material-v1: reserve pieces valued at full base material; deployed pieces retain the existing activity bonus` } : {}),
    engines: {
      white: { level: white, ...TOURNAMENT_AI[white] },
      black: { level: black, ...TOURNAMENT_AI[black] },
    },
    ruleset,
    ...(hiddenSetup ? { hiddenSetup } : {}),
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

// Kings are public; each army is chosen without access to the opponent's arrangement.
export function hiddenSetupPlacements(kings, gameSeed) {
  const pieces = ['rook', 'bishop', 'knight'];
  const permutations = pieces.flatMap(a => pieces.filter(b => b !== a).map(b => [a, b, pieces.find(c => c !== a && c !== b)]));
  const result = { policy: 'independent-uniform-legal-home-rank-v1', seeds: {} };
  for (const player of [WHITE, BLACK]) {
    const enemy = player === WHITE ? BLACK : WHITE;
    const squares = Array.from({ length: 4 }, (_, c) => (player === WHITE ? 12 : 0) + c).filter(sq => sq !== kings[player]);
    const options = permutations.map(order => squares.map((to,i) => ({ type: 'drop', piece: order[i], to }))).filter(actions => {
      const board = Array(16).fill(null);
      board[kings.white] = occupantOf(WHITE, 'king');
      board[kings.black] = occupantOf(BLACK, 'king');
      for (const a of actions) board[a.to] = occupantOf(player, a.piece);
      return !isInCheck({ board }, enemy);
    });
    if (!options.length) throw new Error('No legal private setup');
    const seed = (gameSeed ^ (player === WHITE ? 0x1234abcd : 0x89abcdef)) >>> 0;
    result.seeds[player] = seed;
    result[player] = options[Math.floor(seededRandom(seed)() * options.length)];
  }
  return result;
}
