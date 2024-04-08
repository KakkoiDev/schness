import { movePieceToCursor } from "/lib/index.js";

export const handlePickup = ({ event, movingPiece }) => {
  event.preventDefault();

  movingPiece.val = event.target;

  movingPiece.val.style.position = "fixed";
  movingPiece.val.style.pointerEvents = "none";

  movePieceToCursor({ event, movingPiece });
};
