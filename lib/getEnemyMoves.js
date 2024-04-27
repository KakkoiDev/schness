import {
  getPieceColor,
  getPieceType,
  getPiecePossibleMoves,
} from "/lib/index.js";
import { colors } from "/data/index.js";

export const getEnemyMoves = ({ pieceIndex, currentPosition }) => {
  const pieceColor = getPieceColor(pieceIndex);

  const enemyPieceIndexes =
    pieceColor === colors.white ? [5, 6, 7, 8] : [1, 2, 3, 4];

  const enemyPieces = currentPosition
    .map((piece, index) =>
      enemyPieceIndexes.includes(piece)
        ? {
            pieceBoardIndex: index,
            pieceType: getPieceType(piece),
            currentPosition,
          }
        : null
    )
    .filter(Boolean);

  return [
    ...new Set(
      enemyPieces
        .map((piece) => getPiecePossibleMoves(piece))
        .reduce((acc, curr) => [...acc, ...curr], [])
    ),
  ];
};
