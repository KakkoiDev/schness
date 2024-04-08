import { handleMove, handleDrop } from "/lib/index.js";

export const addEventListenersToDocument = ({ movingPiece }) => {
  document.addEventListener("mousemove", (event) =>
    handleMove({ event, movingPiece })
  );
  document.addEventListener("touchmove", (event) =>
    handleMove({ event, movingPiece })
  );
  document.addEventListener("mouseup", (event) =>
    handleDrop({ event, movingPiece })
  );
  document.addEventListener("touchend", (event) =>
    handleDrop({ event, movingPiece })
  );
};
