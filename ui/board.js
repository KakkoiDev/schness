import van from "/lib/van.min.js";
import { squares } from "/data/index.js";
import { square } from "/ui/index.js";

const { div } = van.tags;

export const board = (props) => {
  return div(
    {
      className: "board",
    },
    squares.map((color, index) =>
      square({
        color,
        index,
        movingPiece: props.movingPiece,
        history: props.history,
        possibleMoves: props.possibleMoves,
      })
    )
  );
};
