export const handleDrop = ({ event, movingPiece }) => {
  if (!movingPiece.val) return;

  // workaround: on mobile, the currentTarget gives use the DOM element
  // so we select the element directly under the cursor.
  let pointedAtTarget = null;

  if (event.clientX) {
    pointedAtTarget = document.elementFromPoint(event.clientX, event.clientY);
  } else {
    pointedAtTarget = document.elementFromPoint(
      event.changedTouches[0].clientX,
      event.changedTouches[0].clientY
    );
  }

  // droped on an other piece
  // select parent
  if ([...pointedAtTarget.classList].includes("piece")) {
    pointedAtTarget = pointedAtTarget.parentElement;
  }

  pointedAtTarget.appendChild(movingPiece.val);

  movingPiece.val.style.left = "";
  movingPiece.val.style.top = "";
  movingPiece.val.style.position = "";
  movingPiece.val.style.pointerEvents = "";

  movingPiece.val = null;
};
