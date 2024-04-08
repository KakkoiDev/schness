import { movePieceToCursor } from "/lib/index.js";

export const handleMove = ({ event, movingPiece }) => {
  if (!movingPiece.val) return;

  movePieceToCursor({ event, movingPiece });
};
