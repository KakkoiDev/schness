import van from "/lib/van.min.js";
import { getPieceSrc } from "/lib/index.js";
import { piece } from "/ui/index.js";

const { div } = van.tags;

export const cursorSquare = (props) =>
  div(
    {
      id: "cursor-square",
      className: "square cursor-square",
    },
    () => {
      const pieceVal = props.movingPiece.val;
      let pieceElement = null;

      if (pieceVal) {
        const type = pieceVal.dataset.type;
        const color = pieceVal.dataset.color;
        const index = pieceVal.dataset.index;
        pieceElement = piece({
          src: getPieceSrc({ piece: type, color }),
          "data-type": type,
          "data-color": color,
          "data-index": index,
          movingPiece: props.movingPiece,
          history: props.history,
          possibleMoves: props.possibleMoves,
        });
      }

      return div(pieceElement);
    }
  );
