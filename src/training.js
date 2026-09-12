import { applyAction, getResult, legalActions, opponent } from './rules.js';
import { forcesMate } from './puzzle.js';

/** A proof for either side, from the actual side-to-move (never swap `turn`). */
export function mateOutlookAtDepth(position, moves, memo = new Map()) {
  if (position.phase !== 'play' || getResult(position)) return null;
  if (forcesMate(position, position.turn, moves, memo)) {
    return { kind: 'opportunity', side: position.turn, moves };
  }
  const attacker = opponent(position.turn);
  if (forcesMate(position, attacker, moves, memo)) {
    return { kind: 'threat', side: attacker, moves };
  }
  return null;
}

/** Candidate blunders: after this legal move, the opponent has a forced mate. */
export function movesAllowingMate(position, moves, memo = new Map()) {
  if (position.phase !== 'play' || getResult(position)) return [];
  return legalActions(position).filter((action) => {
    const after = applyAction(position, action);
    return !getResult(after) && forcesMate(after, after.turn, moves, memo);
  });
}
