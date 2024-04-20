import { pieces } from "/data/index.js";

export const getPieceMoves = ({ currentPosition, movingPiece }) => {
  const pieceIndex = Number(movingPiece.val.dataset.index);
  const pieceBoardIndex = currentPosition.findIndex(
    (index) => index === pieceIndex
  );
  const pieceType = movingPiece.val.dataset.type;
  const spaceLeft = pieceBoardIndex % 4;
  const spaceRight = 4 - spaceLeft - 1;
  let moves = [];

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
      ];
      break;
    case pieces.rook:
      const movesRow = [];
      for (let i = 1; i <= spaceLeft; i++) {
        movesRow.push(pieceBoardIndex - i);
      }
      for (let i = 1; i <= spaceRight; i++) {
        movesRow.push(pieceBoardIndex + i);
      }

      const movesColumn = [];
      for (let i = pieceBoardIndex + 4; i < 16; i += 4) {
        movesColumn.push(i);
      }
      for (let i = pieceBoardIndex - 4; i >= 0; i -= 4) {
        movesColumn.push(i);
      }

      moves = [...movesRow, ...movesColumn];
      break;
    case pieces.bishop:
      let loopCount = 1;
      for (let i = pieceBoardIndex + 4; i < 16; i += 4) {
        if (loopCount <= spaceLeft) moves.push(i - loopCount);
        if (loopCount <= spaceRight) moves.push(i + loopCount);
        loopCount++;
      }

      loopCount = 1;
      for (let i = pieceBoardIndex - 4; i >= 0; i -= 4) {
        if (loopCount <= spaceLeft) moves.push(i - loopCount);
        if (loopCount <= spaceRight) moves.push(i + loopCount);
        loopCount++;
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
