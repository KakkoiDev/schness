import { movePieceToCursor } from "/lib/index.js";

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
    possibleMoves.val = currentPosition.map(() => true);
  }

  if (!isOnBoard) {
    possibleMoves.val = currentPosition.map((squareValue) => squareValue === 0);
  }

  movingPiece.val.style.position = "fixed";
  movingPiece.val.style.pointerEvents = "none";

  movePieceToCursor({ event, movingPiece });
};
