import van from "/lib/van.min.js";
import { getPieceSrc } from "/lib/index.js";
import { colors, initialPiecesPosition } from "/data/index.js";
import { piece } from "/ui/index.js";

const { div } = van.tags;

export const bank = ({ color, history, movingPiece, possibleMoves }) => {
  return () =>
    div(
      { className: "bank" },
      initialPiecesPosition.map((p, index) => {
        const pieceSrc = getPieceSrc({ piece: p, color });
        const indexModifier = color === colors.black ? 5 : 1;
        const computedIndex = index + indexModifier;

        if (
          history.val.at(-1).includes(computedIndex) ||
          Number(movingPiece.val?.dataset.index) === computedIndex
        ) {
          return div({ className: "square" });
        }

        return div(
          { className: "square" },
          piece({
            src: pieceSrc,
            "data-type": p,
            "data-color": color,
            "data-index": computedIndex,
            history,
            movingPiece,
            possibleMoves,
          })
        );
      })
    );
};
