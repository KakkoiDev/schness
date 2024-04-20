import { getPieceMoves } from "/lib/index.js";
export const handlePickup = ({
  event,
  movingPiece,
  history,
  possibleMoves,
}) => {
  event.preventDefault();
  movingPiece.val = event.target;

  const currentPosition = history.val.at(-1);
  const pieceIndex = Number(movingPiece.val.dataset.index);

  const isOnBoard = currentPosition.includes(pieceIndex);

  if (isOnBoard) {
    const moves = getPieceMoves({ currentPosition, movingPiece });

    possibleMoves.val = currentPosition.map((_, squareIndex) => {
      return moves.includes(squareIndex);
    });
  }

  if (!isOnBoard) {
    possibleMoves.val = currentPosition.map((squareValue) => squareValue === 0);
  }
};
