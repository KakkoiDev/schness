export const movePieceToCursor = ({ event, movingPiece }) => {
  if (event.clientX) {
    movingPiece.val.style.left =
      event.clientX - movingPiece.val.clientWidth / 2 + "px";
    movingPiece.val.style.top =
      event.clientY - movingPiece.val.clientHeight / 2 + "px";
  } else {
    movingPiece.val.style.left =
      event.changedTouches[0].clientX - movingPiece.val.clientWidth / 2 + "px";
    movingPiece.val.style.top =
      event.changedTouches[0].clientY - movingPiece.val.clientHeight / 2 + "px";
  }
};
