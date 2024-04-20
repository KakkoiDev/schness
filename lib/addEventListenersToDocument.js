import { handleDrop, moveCursorSquare } from "/lib/index.js";

export const addEventListenersToDocument = ({
  movingPiece,
  history,
  possibleMoves,
}) => {
  let cursorSquare = null;

  document.addEventListener("DOMContentLoaded", () => {
    cursorSquare = document.querySelector("#cursor-square");
  });

  document.addEventListener("mousemove", (event) => {
    moveCursorSquare({ event, cursorSquare });
  });

  document.addEventListener("touchmove", (event) => {
    moveCursorSquare({ event, cursorSquare });
  });

  document.addEventListener("mouseup", (event) =>
    handleDrop({ event, movingPiece, history, possibleMoves })
  );

  document.addEventListener("touchend", (event) =>
    handleDrop({ event, movingPiece, history, possibleMoves })
  );
};
