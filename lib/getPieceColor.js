import { colors, initialPiecesPosition } from "/data/index.js";

export const getPieceColor = (pieceIndex) =>
  pieceIndex - 1 < initialPiecesPosition.length ? colors.white : colors.black;
