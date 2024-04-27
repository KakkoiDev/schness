import { pieces, colors } from "/data/index.js";
import {
  filterAlliesFromMoves,
  getPiecePossibleMoves,
  getPieceType,
} from "/lib/index.js";

export const getPieceMoves = ({ history, movingPiece, possibleMoves }) => {
  const pieceIndex = Number(movingPiece.val.dataset.index);
  const currentPosition = history.val.at(-1);
  const isOnBoard = currentPosition.includes(pieceIndex);
  const pieceBoardIndex = currentPosition.findIndex(
    (index) => index === pieceIndex
  );
  const pieceType = movingPiece.val.dataset.type;
  const pieceColor = movingPiece.val.dataset.color;
  let moves = [];

  if (isOnBoard) {
    moves = getPiecePossibleMoves({
      pieceBoardIndex,
      pieceType,
      currentPosition,
    });
  }

  // can't put king in check
  if (isOnBoard && pieceType === pieces.king) {
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
    const enemyMoves = [
      ...new Set(
        enemyPieces
          .map((piece) => getPiecePossibleMoves(piece))
          .reduce((acc, curr) => [...acc, ...curr], [])
      ),
    ];

    moves = moves.filter((index) => !enemyMoves.includes(index));
  }

  if (!isOnBoard) {
    moves = Array.from({ length: 16 }, (_, index) => index);

    // can't drop on other pieces
    moves = currentPosition
      .map((value, index) => (value > 0 ? null : index))
      .filter((value) => value !== null);
  }

  // kings can only be placed on first and last row
  if (!isOnBoard && pieceType === pieces.king) {
    switch (pieceColor) {
      case colors.white:
        moves = [12, 13, 14, 15];
        break;
      default:
        moves = [0, 1, 2, 3];
    }
  }

  // kings must be played first
  if (
    pieceType !== pieces.king &&
    (!currentPosition.includes(1) || !currentPosition.includes(5))
  ) {
    moves = [];
  }

  // can't take friendly pieces
  moves = filterAlliesFromMoves({ pieceColor, moves, currentPosition });

  possibleMoves.val = currentPosition.map((_, squareIndex) => {
    return moves.includes(squareIndex);
  });
};
