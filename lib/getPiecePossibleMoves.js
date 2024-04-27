import { pieces } from "/data/index.js";

export const getPiecePossibleMoves = ({
  pieceBoardIndex,
  pieceType,
  currentPosition,
}) => {
  let moves = [];
  const spaceLeft = pieceBoardIndex % 4;
  const spaceRight = 4 - spaceLeft - 1;

  switch (pieceType) {
    case pieces.king:
      moves = [
        spaceLeft > 0 && pieceBoardIndex - 1,
        spaceRight > 0 && pieceBoardIndex - 3,
        pieceBoardIndex - 4,
        spaceLeft > 0 && pieceBoardIndex - 5,
        spaceRight > 0 && pieceBoardIndex + 1,
        spaceLeft > 0 && pieceBoardIndex + 3,
        pieceBoardIndex + 4,
        spaceRight > 0 && pieceBoardIndex + 5,
      ].filter(
        (index) => typeof index === "number" && index >= 0 && index <= 15
      );
      break;
    case pieces.rook:
      const movesRow = [];
      for (let i = 1; i <= spaceLeft; i++) {
        const currentIndex = pieceBoardIndex - i;
        movesRow.push(currentIndex);
        if (currentPosition[currentIndex] > 0) break;
      }
      for (let i = 1; i <= spaceRight; i++) {
        const currentIndex = pieceBoardIndex + i;
        movesRow.push(currentIndex);
        if (currentPosition[currentIndex] > 0) break;
      }

      const movesColumn = [];
      for (let i = pieceBoardIndex + 4; i < 16; i += 4) {
        movesColumn.push(i);
        if (currentPosition[i] > 0) break;
      }
      for (let i = pieceBoardIndex - 4; i >= 0; i -= 4) {
        movesColumn.push(i);
        if (currentPosition[i] > 0) break;
      }

      moves = [...movesRow, ...movesColumn];
      break;
    case pieces.bishop:
      let loopCount = 1;
      // down left
      for (let i = pieceBoardIndex + 4; i < 16; i += 4) {
        const currentIndex = i - loopCount;
        if (loopCount <= spaceLeft) moves.push(currentIndex);
        loopCount++;
        if (currentPosition[currentIndex] > 0) break;
      }

      loopCount = 1;
      // down right
      for (let i = pieceBoardIndex + 4; i < 16; i += 4) {
        const currentIndex = i + loopCount;
        if (loopCount <= spaceRight) moves.push(currentIndex);
        loopCount++;
        if (currentPosition[currentIndex] > 0) break;
      }

      loopCount = 1;
      for (let i = pieceBoardIndex - 4; i >= 0; i -= 4) {
        const currentIndex = i - loopCount;
        if (loopCount <= spaceLeft) moves.push(currentIndex);
        loopCount++;
        if (currentPosition[currentIndex] > 0) break;
      }

      loopCount = 1;
      for (let i = pieceBoardIndex - 4; i >= 0; i -= 4) {
        const currentIndex = i + loopCount;
        if (loopCount <= spaceRight) moves.push(currentIndex);
        loopCount++;
        if (currentPosition[currentIndex] > 0) break;
      }
      break;
    case pieces.knight:
      let jumpModifier = 2;
      for (let i = pieceBoardIndex + 4; i < 16; i += 4) {
        if (jumpModifier === 0) break;
        if (jumpModifier <= spaceLeft) moves.push(i - jumpModifier);
        if (jumpModifier <= spaceRight) moves.push(i + jumpModifier);
        jumpModifier--;
      }

      jumpModifier = 2;
      for (let i = pieceBoardIndex - 4; i >= 0; i -= 4) {
        if (jumpModifier === 0) break;
        if (jumpModifier <= spaceLeft) moves.push(i - jumpModifier);
        if (jumpModifier <= spaceRight) moves.push(i + jumpModifier);
        jumpModifier--;
      }
      break;
  }

  return moves;
};
