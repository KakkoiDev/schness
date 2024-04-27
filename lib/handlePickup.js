import { getPieceMoves, canMovePiece } from "/lib/index.js";
export const handlePickup = ({
  event,
  movingPiece,
  history,
  possibleMoves,
}) => {
  event.preventDefault();

  const piece = event.target;

  if (!canMovePiece({ history, piece })) return;

  movingPiece.val = piece;

  possibleMoves.val = getPieceMoves({ history, movingPiece });
};
