export const handleDrop = ({ event, movingPiece, history, possibleMoves }) => {
  if (!movingPiece.val) return;

  // workaround: on mobile, the currentTarget gives use the DOM element
  // so we select the element directly under the cursor.
  let pointedAtTarget = document.elementFromPoint(event.pageX, event.pageY);

  // droped on an other piece
  // select parent
  if ([...pointedAtTarget.classList].includes("piece")) {
    pointedAtTarget = pointedAtTarget.parentElement;
  }

  const pieceIndex = Number(movingPiece.val.dataset.index);
  const squareIndex = Number(pointedAtTarget.dataset.index);

  if (!isNaN(squareIndex) && possibleMoves.val[squareIndex]) {
    let newPosition = history.val.at(-1);

    // update history
    newPosition = newPosition.map((value) =>
      value === pieceIndex ? 0 : value
    ); // remove piece from its square
    newPosition.splice(squareIndex, 1, pieceIndex); // place piece on new square

    history.val = [...history.val, newPosition];
  }

  possibleMoves.val = [...new Array(16).fill(false)];
  // remove moving piece from DOM
  movingPiece.val.remove();
  movingPiece.val = null;

  // force bank rerender
  const currentHistory = history.val;
  history.val = [...currentHistory];
};
