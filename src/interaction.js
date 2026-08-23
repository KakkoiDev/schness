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
