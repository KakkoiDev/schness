import { initialPiecesPosition } from "/data/index.js";

export const getPieceType = (pieceIndex) =>
  initialPiecesPosition[(pieceIndex - 1) % 4];
