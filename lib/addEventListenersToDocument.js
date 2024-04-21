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

  document.addEventListener("pointermove", (event) => {
    moveCursorSquare({ event, cursorSquare });
  });

  document.addEventListener("pointerup", (event) => {
    handleDrop({ event, movingPiece, history, possibleMoves });
  });
};
