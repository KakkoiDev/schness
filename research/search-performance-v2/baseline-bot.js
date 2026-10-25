import {createSearchEngine} from './baseline-search.js';
import {
  BISHOP,
  BLACK,
  KING,
  KNIGHT,
  ROOK,
  WHITE,
  applyLegalAction,
  getResult,
  isInCheck,
  legalActionsUnchecked,
  positionKey,
} from './baseline-rules.js';

const VALUES = { [KING]: 0, [ROOK]: 500, [BISHOP]: 320, [KNIGHT]: 300 };
const MATE = 1_000_000;

/** Variant adapter keeps Schness legality, objectives and evaluation out of search. */
export const schnessSearch = createSearchEngine({
  actions: legalActionsUnchecked,
  apply: applyLegalAction,
  turn: p => p.turn,
  key: p => `${positionKey(p)}|history:${JSON.stringify(Object.entries(p.repetitions ?? {}).sort(([a],[b])=>a<b?-1:a>b?1:0))}`,
  terminal: (p, player, depth) => {
    const result=getResult(p);
    return !result ? null : result.type==='draw' ? 0 : result.winner===player ? MATE+depth : -MATE-depth;
  },
  evaluate,
  inDanger: p => isInCheck(p, p.turn),
  noisyActions: (p, actions) => actions.filter(a => a.type === 'move' && p.board[a.to]),
  order: orderActions,
  repetitions: p => p.repetitions[positionKey(p)] ?? 0,
});

/** Existing depth profiles stay supported; strength 0–100 enables bounded iterative search. */
export function chooseAction(position, options={}) { return analyzeAction(position,options).action; }
export function analyzeAction(position, options={}) { return schnessSearch.choose(position,options); }
/** White-positive score. */
export function scorePosition(position, depth=3) { return schnessSearch.score(position,WHITE,depth); }

function evaluate(position, player) {
  const enemy = player === WHITE ? BLACK : WHITE;
  let score = 0;
  // Material can transfer or disappear in these presets, so held pieces have value too.
  if (['capture-bank','permanent-loss'].includes(position.rules?.experiment)) {
    for (const piece of position.banks[player]) score += VALUES[piece];
    for (const piece of position.banks[enemy]) score -= VALUES[piece];
  }
  for (const occupant of position.board) {
    if (!occupant) continue;
    const deployed = VALUES[occupant.piece] + (occupant.piece === KING ? 0 : 20);
    score += occupant.owner === player ? deployed : -deployed;
  }
  score += (legalActionsUnchecked({ ...position, turn: player }).length -
            legalActionsUnchecked({ ...position, turn: enemy }).length) * 2;
  if (isInCheck(position, enemy)) score += 30;
  if (isInCheck(position, player)) score -= 30;
  return score;
}

function orderActions(position, actions) {
  return [...actions].sort((a, b) => actionPriority(position, b) - actionPriority(position, a));
}

function actionPriority(position, action) {
  if (action.type === 'move' && position.board[action.to]) return 100 + VALUES[position.board[action.to].piece];
  if (action.type === 'move') return 20;
  if (action.type === 'drop') return 10 + VALUES[action.piece] / 100;
  return 0;
}
