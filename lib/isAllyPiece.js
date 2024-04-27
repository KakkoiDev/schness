import { colors } from "/data/index.js";

export const isAllyPiece = ({ pieceColor, pieceIndex }) =>
  pieceColor === colors.white
    ? pieceIndex > 0 && pieceIndex <= 4
    : pieceIndex >= 5;
