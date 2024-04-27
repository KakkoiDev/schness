import { isAllyPiece } from "/lib/index.js";

export const filterAlliesFromMoves = ({ pieceColor, moves, currentPosition }) =>
  moves.filter((index) => {
    return !isAllyPiece({
      pieceColor,
      pieceIndex: currentPosition[index],
    });
  });
