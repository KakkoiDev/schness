import { pieces, colors } from "/data/index.js";
import {
  filterAlliesFromMoves,
  getPiecePossibleMoves,
  getEnemyMoves,
} from "/lib/index.js";

export const getPieceMoves = ({ history, movingPiece }) => {
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

  // can't take friendly pieces
  moves = filterAlliesFromMoves({ pieceColor, moves, currentPosition });

  // can't put king in check
  if (isOnBoard && pieceType === pieces.king) {
    const enemyMoves = getEnemyMoves({ pieceIndex, currentPosition });
    moves = moves.filter((index) => !enemyMoves.includes(index));
  }

  // can't move piece if that would put our king in check
  if (isOnBoard && pieceType !== pieces.king) {
    const discoveredCheckMoves = [];
    // TODO: refactor in getAllyKingIndex
    const kingBoardIndex = currentPosition.findIndex((index) =>
      pieceColor === colors.white ? index === 1 : index === 5
    );

    for (const move of moves) {
      const newPosition = [...currentPosition];
      newPosition.splice(pieceBoardIndex, 1, 0);
      newPosition.splice(move, 1, pieceIndex);

      const enemyMoves = getEnemyMoves({
        pieceIndex,
        currentPosition: newPosition,
      });

      if (enemyMoves.includes(kingBoardIndex)) discoveredCheckMoves.push(move);
    }

    moves = moves.filter((index) => !discoveredCheckMoves.includes(index));
  }

  if (!isOnBoard) {
    moves = Array.from({ length: 16 }, (_, index) => index);

    // can't drop on other pieces
    moves = currentPosition
      .map((value, index) => (value > 0 ? null : index))
      .filter((value) => value !== null);

    // kings can only be placed on first and last row
    if (pieceType === pieces.king) {
      switch (pieceColor) {
        case colors.white:
          moves = [12, 13, 14, 15];
          break;
        default:
          moves = [0, 1, 2, 3];
      }
    }

    if (pieceType !== pieces.king) {
      // kings must be played first
      if (!currentPosition.includes(1) || !currentPosition.includes(5)) {
        moves = [];
      }

      // can't check opponent king on drop
      const enemyKingBoardIndex = currentPosition.findIndex((index) =>
        pieceColor === colors.black ? index === 1 : index === 5
      );
      const checkIndexes = [];

      for (const move of moves) {
        const newMoves = getPiecePossibleMoves({
          pieceBoardIndex: move,
          pieceType,
          currentPosition,
        });

        if (newMoves.includes(enemyKingBoardIndex)) checkIndexes.push(move);
      }

      moves = moves.filter((index) => !checkIndexes.includes(index));

      // if king in check, can only be dropped to block attacker
      const isCheck = ({ currentPosition }) => {
        const kingBoardIndex = currentPosition.findIndex((index) =>
          pieceColor === colors.white ? index === 1 : index === 5
        );
        const enemyMoves = getEnemyMoves({ pieceIndex, currentPosition });

        return (
          enemyMoves.find((index) => index === kingBoardIndex) !== undefined
        );
      };

      if (isCheck({ currentPosition })) {
        const checkBlockMoves = [];
        for (const move of moves) {
          // TODO: getNewPosition()
          const newPosition = [...currentPosition];
          newPosition.splice(pieceBoardIndex, 1, 0);
          newPosition.splice(move, 1, pieceIndex);

          if (!isCheck({ currentPosition: newPosition }))
            checkBlockMoves.push(move);
        }

        moves = checkBlockMoves;
      }
    }
  }

  return currentPosition.map((_, squareIndex) => {
    return moves.includes(squareIndex);
  });
};
