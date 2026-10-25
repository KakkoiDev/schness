import { BISHOP, BOARD_SIZE, KING, KNIGHT, ROOK } from './rules.js';

export const FILES = Object.freeze(['a', 'b', 'c', 'd']);
export const PIECE_CODES = Object.freeze({ [KING]: 'K', [ROOK]: 'R', [BISHOP]: 'B', [KNIGHT]: 'N' });

/** Square 0 is a4: row 0 is Black's home rank, so the rank counts down as the index rises. */
export function squareName(square) {
  assertSquare(square);
  return `${FILES[square % BOARD_SIZE]}${BOARD_SIZE - Math.floor(square / BOARD_SIZE)}`;
}

export function squareIndex(name) {
  const file = FILES.indexOf(String(name)[0]?.toLowerCase());
  const rank = Number(String(name)[1]);
  if (file === -1 || !Number.isInteger(rank) || rank < 1 || rank > BOARD_SIZE) return null;
  return (BOARD_SIZE - rank) * BOARD_SIZE + file;
}

export function pieceCode(piece) {
  return PIECE_CODES[piece] ?? '';
}

/** "Bishop", for prose like "Bishop on b3 is selected". */
export function pieceName(piece) {
  return typeof piece === 'string' && piece ? piece[0].toUpperCase() + piece.slice(1) : '';
}

export function colorName(color) {
  return pieceName(color);
}

function assertSquare(square) {
  if (!Number.isInteger(square) || square < 0 || square >= BOARD_SIZE * BOARD_SIZE) {
    throw new Error(`Invalid square: ${square}`);
  }
}
