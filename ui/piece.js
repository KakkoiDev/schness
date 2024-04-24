import van from "/lib/van.min.js";
import { handlePickup } from "/lib/index.js";

const { img } = van.tags;

export const piece = (props) =>
  img({
    ...props,
    onpointerdown: (event) =>
      handlePickup({
        event,
        movingPiece: props.movingPiece,
        history: props.history,
        possibleMoves: props.possibleMoves,
      }),
    className: "piece",
  });
