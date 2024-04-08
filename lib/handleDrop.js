export const handleDrop = ({ event, movingPiece }) => {
  if (!movingPiece.val) return;

  const currentTarget = event.currentTarget;
  if (currentTarget !== document) currentTarget.appendChild(movingPiece.val);

  movingPiece.val.style.left = "";
  movingPiece.val.style.top = "";
  movingPiece.val.style.position = "";
  movingPiece.val.style.pointerEvents = "";

  movingPiece.val = null;
};
