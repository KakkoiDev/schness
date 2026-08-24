export function actionHighlights(action) {
  if (!action || !Number.isInteger(action.to)) return { from: null, to: null };
  return { from: action.type === 'move' && Number.isInteger(action.from) ? action.from : null, to: action.to };
}
