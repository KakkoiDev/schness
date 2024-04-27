import { getPieceColor } from "/lib/index.js";
import { colors } from "/data/index.js";

export const canMovePiece = ({ history, piece }) => {
  const pieceColor = getPieceColor(piece.dataset.index);
  const turnColor = history.val.length % 2 ? colors.white : colors.black;

  return pieceColor === turnColor;
};
