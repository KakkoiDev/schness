import {
  BANK_PIECES, BLACK, KING, WHITE, createPosition, isInCheck, opponent, positionKey,
} from './rules.js';
import { levelDepth } from './watch.js';

export const CONTROLLERS = Object.freeze(['human', 'learning', 'steady', 'sharp']);

export function normalizeController(value, fallback = 'steady') {
  return CONTROLLERS.includes(value) ? value : fallback;
}

export function controllerSearch(controller) {
  if (controller === 'human') return null;
  return { depth: levelDepth(controller), repetitionAversion: controller === 'sharp' };
}

export function boardInventory(board) {
  const banks = { [WHITE]: [], [BLACK]: [] };
  for (const owner of [WHITE, BLACK]) {
    for (const piece of BANK_PIECES) {
      if (!board.some((occupant) => occupant?.owner === owner && occupant.piece === piece)) banks[owner].push(piece);
    }
  }
  return banks;
}

export function buildEditedPosition(board, turn) {
  if (!Array.isArray(board) || board.length !== 16) throw new Error('The board needs 16 squares.');
  for (const owner of [WHITE, BLACK]) {
    for (const piece of [KING, ...BANK_PIECES]) {
      const count = board.filter((occupant) => occupant?.owner === owner && occupant.piece === piece).length;
      if (piece === KING && count !== 1) throw new Error(`${title(owner)} needs exactly one king.`);
      if (count > 1) throw new Error(`${title(owner)} can only own one ${piece}.`);
    }
  }
  const base = createPosition({ board, banks: boardInventory(board), turn, phase: 'play' });
  if (isInCheck(base, opponent(turn))) throw new Error(`${title(opponent(turn))} cannot already be in check when it is ${title(turn)}'s turn.`);
  return createPosition({
    board, banks: base.banks, turn, phase: 'play', repetitions: { [positionKey(base)]: 1 },
  });
}

export function putEditorPiece(board, square, piece) {
  const next = board.map((occupant) => occupant ? { ...occupant } : null);
  if (!piece) {
    next[square] = null;
    return next;
  }
  for (let index = 0; index < next.length; index += 1) {
    if (next[index]?.owner === piece.owner && next[index].piece === piece.piece) next[index] = null;
  }
  next[square] = { ...piece };
  return next;
}

function title(value) {
  return `${value[0].toUpperCase()}${value.slice(1)}`;
}
