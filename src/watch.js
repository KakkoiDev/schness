import { BLACK, WHITE, applyAction, getResult } from './rules.js';
import { recordAction } from './history.js';
import { AI_DEPTHS, difficultyDepth } from './settings.js';

// Compatibility export for tournament manifests; settings owns the only profile map.
export const LEVEL_DEPTH = AI_DEPTHS;

export function levelDepth(level) {
  return difficultyDepth(level);
}

export function advanceReview(index, length, direction) {
  return Math.max(0, Math.min(length, index + direction));
}

/** Number of positions the worker should keep ready beyond the one on screen. */
export function bufferNeeded(reviewIndex, historyLength, terminal = false, target = 10) {
  if (terminal) return 0;
  return Math.max(0, target - Math.max(0, historyLength - reviewIndex));
}

export function applySpectatorAction(position, history, action) {
  const next = applyAction(position, action);
  return { position: next, history: recordAction(history, position, action, next) };
}

export function resultLabel(result) {
  if (!result) return '';
  if (result.type === 'win') return `${result.winner === WHITE ? 'White' : 'Black'} wins by checkmate`;
  if (result.reason === 'threefold-repetition') return 'Draw by threefold repetition';
  return result.reason === 'stalemate' ? 'Draw by stalemate' : 'Draw';
}

export function sideName(side) {
  return side === BLACK ? 'Black' : 'White';
}
