import test from 'node:test';
import assert from 'node:assert/strict';
import { applyAction, getResult } from '../src/rules.js';
import { decodePuzzlePosition, encodePuzzlePosition, forcedMate, solutionLine } from '../src/puzzle.js';

const positions = [
  { mate: 1, board: [6,5,0,0,8,0,2,7,0,1,0,0,0,0,4,0] },
  { mate: 2, board: [6,5,0,0,8,4,2,3,0,1,7,0,0,0,0,0] },
  { mate: 3, board: [6,5,0,0,8,4,2,3,1,0,0,0,0,0,0,7] },
  { mate: 4, board: [0,0,0,0,0,0,5,0,3,0,6,4,0,2,7,1] },
];

test('known tournament positions are classified by shortest forced mate', () => {
  for (const example of positions) {
    const position = decodePuzzlePosition({ b: example.board, t: 'w' });
    const result = forcedMate(position, 4);
    assert.equal(result?.moves, example.mate);
    assert.equal(forcedMate(position, example.mate - 1), null);
  }
});

test('every recorded solution line ends in checkmate for the solver', () => {
  const position = decodePuzzlePosition({ b: positions[3].board, t: 'w' });
  const mate = forcedMate(position, 4);
  for (const first of mate.actions) {
    let current = position;
    for (const action of solutionLine(position, first, mate.moves)) current = applyAction(current, action);
    assert.deepEqual(getResult(current), { type: 'win', winner: 'white', reason: 'checkmate' });
  }
});

test('puzzle position encoding preserves board, reserves, and side to move', () => {
  const position = decodePuzzlePosition({ b: positions[0].board, t: 'w' });
  const decoded = decodePuzzlePosition(encodePuzzlePosition(position));
  assert.deepEqual(decoded.board, position.board);
  assert.deepEqual(decoded.banks, position.banks);
  assert.equal(decoded.turn, position.turn);
});
