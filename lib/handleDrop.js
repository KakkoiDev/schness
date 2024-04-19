import { pieces } from "/data/index.js";

export const handleDrop = ({ event, movingPiece, history, possibleMoves }) => {
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

  const pieceIndex = Number(movingPiece.val.dataset.index);
  const squareIndex = Number(pointedAtTarget.dataset.index);

  if (!isNaN(squareIndex) && possibleMoves.val[squareIndex]) {
    let newPosition = history.val.at(-1);

    // check legal moves
    const pieceType = movingPiece.val.dataset.type;

    switch (pieceType) {
      case pieces.king:
        break;
      case pieces.rook:
        break;
      case pieces.bishop:
        break;
      case pieces.knight:
        break;
    }

    // update history
    newPosition = newPosition.map((value) =>
      value === pieceIndex ? 0 : value
    ); // remove piece from its square
    newPosition.splice(squareIndex, 1, pieceIndex); // place piece on new square

    history.val = [...history.val, newPosition];

    // remove moving piece from DOM
    movingPiece.val.remove();
  }

  possibleMoves.val = new Array(false);

  movingPiece.val.style.left = "";
  movingPiece.val.style.top = "";
  movingPiece.val.style.position = "";
  movingPiece.val.style.pointerEvents = "";

  movingPiece.val = null;
};
