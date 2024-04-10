export const handleDrop = ({ event, movingPiece }) => {
  if (!movingPiece.val) return;

  const currentTarget = event.currentTarget;
  if (currentTarget !== document) {
    // if square occupied, send prevPiece back to bank
    const prevPiece = currentTarget.querySelector("img");

    if (prevPiece)
      document
        .querySelector(`#${prevPiece.dataset.name}`)
        .appendChild(prevPiece);

    currentTarget.appendChild(movingPiece.val);
  }

  movingPiece.val.style.left = "";
  movingPiece.val.style.top = "";
  movingPiece.val.style.position = "";
  movingPiece.val.style.pointerEvents = "";

  movingPiece.val = null;
};
