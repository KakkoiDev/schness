import van from "/lib/van.min.js";
import { colors } from "/data/index.js";
import { bank, cursorSquare, board } from "/ui/index.js";

const { div } = van.tags;

export const game = ({ history, movingPiece, possibleMoves }) =>
  div(
    bank({ color: colors.black, history, movingPiece, possibleMoves }),
    board({ history, movingPiece, possibleMoves }),
    bank({ color: colors.white, history, movingPiece, possibleMoves }),
    cursorSquare({ history, movingPiece, possibleMoves })
  );
