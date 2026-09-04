import { BLACK, WHITE, getResult, isInCheck, opponent, positionKey } from './rules.js';
import { colorName, pieceCode, pieceName, squareName } from './notation.js';

/** Turns alternate strictly, so the first ply is always White's. */
export function moverOfPly(ply) {
  return ply % 2 === 1 ? WHITE : BLACK;
}

export function actionNotation(position, action, next) {
  const suffix = notationSuffix(position, next);
  if (action.type === 'place-king') return `@K${squareName(action.to)}${suffix}`;
  // Standard algebraic has no notation for a drop; @ follows shogi and crazyhouse.
  if (action.type === 'drop') return `@${pieceCode(action.piece)}${squareName(action.to)}${suffix}`;
  const moving = position.board[action.from];
  const captured = position.board[action.to];
  return `${pieceCode(moving?.piece)}${captured ? 'x' : ''}${squareName(action.to)}${suffix}`;
}

export function actionNote(history, position, action) {
  if (action.type === 'place-king') return `King placed on ${squareName(action.to)}`;
  if (action.type === 'drop') return `${pieceName(action.piece)} deployed from reserve`;
  const moving = pieceName(position.board[action.from]?.piece);
  const captured = position.board[action.to];
  if (!captured) return `${moving} to ${squareName(action.to)}`;
  const deployed = arrivedByDeployment(history, action.to) ? 'deployed ' : '';
  return `${moving} takes the ${deployed}${captured.piece} on ${squareName(action.to)}`;
}

export function actionSentence(history, position, action) {
  const mover = colorName(position.turn);
  if (action.type === 'place-king') return `${mover} placed their king on ${squareName(action.to)}`;
  if (action.type === 'drop') return `${mover} dropped a ${action.piece} on ${squareName(action.to)}`;
  const moving = position.board[action.from]?.piece;
  const captured = position.board[action.to];
  if (!captured) return `${mover} moved a ${moving} to ${squareName(action.to)}`;
  const deployed = arrivedByDeployment(history, action.to) ? 'deployed ' : '';
  return `${mover}'s ${moving} took the ${deployed}${captured.piece} on ${squareName(action.to)}`;
}

export function recordAction(history, position, action, next) {
  return [...history, {
    ply: history.length + 1,
    action,
    notation: actionNotation(position, action, next),
    note: actionNote(history, position, action),
    sentence: actionSentence(history, position, action),
    resultingKey: positionKey(next),
  }];
}

/** One row per move number: White's ply and Black's reply. */
export function pairMoves(history) {
  const rows = [];
  for (const entry of history) {
    const number = Math.ceil(entry.ply / 2);
    if (moverOfPly(entry.ply) === WHITE) rows.push({ number, white: entry, black: null });
    else if (rows.length) rows[rows.length - 1].black = entry;
    else rows.push({ number, white: null, black: entry });
  }
  return rows;
}

export function moveCount(history) {
  return Math.ceil(history.length / 2);
}

export function deploymentCount(history) {
  return history.filter((entry) => entry.action.type === 'drop').length;
}

export function gameText(history) {
  return pairMoves(history)
    .map(({ number, white, black }) => [`${number}.`, white?.notation, black?.notation].filter(Boolean).join(' '))
    .join('  ');
}

/**
 * How many plies to walk back so it is the given player's turn again, taking
 * at least one ply. Against the bot that is a full turn: their reply and ours.
 */
export function pliesToUndo(history, timeline, player) {
  for (let taken = 1; taken <= history.length; taken += 1) {
    const position = timeline[timeline.length - 1 - taken];
    if (position && position.turn === player) return taken;
  }
  return 0;
}

function notationSuffix(position, next) {
  if (getResult(next)?.reason === 'checkmate') return '#';
  return isInCheck(next, opponent(position.turn)) ? '+' : '';
}

/** The last action that landed on a square is how its occupant got there. */
function arrivedByDeployment(history, square) {
  for (let index = history.length - 1; index >= 0; index -= 1) {
    if (history[index].action.to === square) return history[index].action.type === 'drop';
  }
  return false;
}
