import { getPieceMoves } from "/lib/index.js";
export const handlePickup = ({
  event,
  movingPiece,
  history,
  possibleMoves,
}) => {
  event.preventDefault();

  movingPiece.val = event.target;

  getPieceMoves({ history, movingPiece, possibleMoves });
};
