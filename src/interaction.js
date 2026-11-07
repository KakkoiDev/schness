import { actionKey, legalActions } from './rules.js';

export function boardSelection(square) {
  return { type: 'board', square };
}

export function bankSelection(piece) {
  return { type: 'bank', piece };
}

export function actionsForSelection(position, selection) {
  if (!selection) return [];
  return legalActions(position).filter((action) => {
    if (selection.type === 'board') return action.type === 'move' && action.from === selection.square;
    if (selection.type === 'bank') return action.type === 'drop' && action.piece === selection.piece;
    return false;
  });
}

export function destinations(position, selection) {
  return new Set(actionsForSelection(position, selection).map((action) => action.to));
}

export function actionAt(position, selection, square) {
  return actionsForSelection(position, selection).find((action) => action.to === square) ?? null;
}

export function setupActionAt(position, square) {
  return legalActions(position).find(
    (action) => action.type === 'place-king' && action.to === square,
  ) ?? null;
}

export function setupDestinations(position) {
  return new Set(legalActions(position)
    .filter((action) => action.type === 'place-king')
    .map((action) => action.to));
}

export function isLegalAction(position, action) {
  const key = actionKey(action);
  return legalActions(position).some((candidate) => actionKey(candidate) === key);
}

// Experiments that change captures or the opening, never which drops may check. With quiet drops
// they refuse exactly what Classic refuses, so the Classic comparison and copy are correct for them.
const QUIET_DROP_EXPERIMENTS = new Set(['permanent-loss', 'capture-bank', 'setup']);

/** Quiet-drop rules only: compare legal drops with checking enabled, preserving king safety. */
export function refusedDrops(position, selection) {
  const experiment = position.rules?.experiment;
  if (position.phase !== 'play' || selection?.type !== 'bank' || position.rules?.allowCheckingDrops
      || (experiment && !QUIET_DROP_EXPERIMENTS.has(experiment))) return new Set();
  const allowed = destinations(position, selection);
  const relaxed = { ...position, rules: { ...position.rules, allowCheckingDrops: true } };
  return new Set(actionsForSelection(relaxed, selection)
    .filter(action => !allowed.has(action.to)).map(action => action.to));
}

export const DROP_REFUSAL = 'A dropped piece may not give check. Your piece is still in reserve.';
