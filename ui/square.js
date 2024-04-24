import van from "/lib/van.min.js";
import { getPieceSrc } from "/lib/index.js";
import { colors, initialPiecesPosition } from "/data/index.js";
import { piece } from "/ui/index.js";

const { div } = van.tags;

export const square = (props) => {
  return () =>
    div(
      {
        className: `square ${
          props.possibleMoves.val[props.index]
            ? colors.info
            : props.color === colors.white
            ? colors.white
            : colors.black
        }`,
        "data-index": props.index,
      },
      () => {
        const squareIndex = props.history.val.at(-1)[props.index];
        const movingPieceIndex = Number(props.movingPiece.val?.dataset.index);

        if (squareIndex !== 0 && squareIndex !== movingPieceIndex) {
          const type = initialPiecesPosition[(squareIndex - 1) % 4];
          const color =
            squareIndex - 1 < initialPiecesPosition.length
              ? colors.white
              : colors.black;
          const pieceSrc = getPieceSrc({ piece: type, color });

          return piece({
            src: pieceSrc,
            "data-type": type,
            "data-color": color,
            "data-index": squareIndex,
            movingPiece: props.movingPiece,
            history: props.history,
            possibleMoves: props.possibleMoves,
          });
        }
      }
    );
};
