import test from 'node:test';
import assert from 'node:assert/strict';
import { applyAction, createInitialPosition, createPosition } from '../src/rules.js';
import {
  actionNotation, deploymentCount, gameText, moveCount, moverOfPly, pairMoves,
  pliesToUndo, recordAction,
} from '../src/history.js';

/** Replay a list of actions, returning the history and the position timeline. */
function replay(actions, start = createInitialPosition()) {
  let position = start;
  let history = [];
  const timeline = [position];
  for (const action of actions) {
    const before = position;
    position = applyAction(before, action);
    history = recordAction(history, before, action, position);
    timeline.push(position);
  }
  return { history, position, timeline };
}

const OPENING = [
  { type: 'place-king', to: 13 },
  { type: 'place-king', to: 1 },
  { type: 'drop', piece: 'rook', to: 10 },
  { type: 'drop', piece: 'knight', to: 5 },
];

test('plies alternate starting with White', () => {
  assert.equal(moverOfPly(1), 'white');
  assert.equal(moverOfPly(2), 'black');
  assert.equal(moverOfPly(3), 'white');
});

test('entries carry a ply, notation, note and resulting key', () => {
  const { history } = replay(OPENING);
  assert.deepEqual(history.map((entry) => entry.ply), [1, 2, 3, 4]);
  assert.deepEqual(history.map((entry) => entry.notation), ['@Kb1', '@Kb4', '@Rc2', '@Nb3']);
  assert.equal(history[2].note, 'Rook deployed from reserve');
  assert.equal(history[3].sentence, 'Black dropped a knight on b3');
  assert.ok(history.every((entry) => typeof entry.resultingKey === 'string'));
});

test('moves use algebraic notation and mark captures', () => {
  // White king on a1 so the Black knight on c3, which covers b1, is not a check.
  const board = Array(16).fill(null);
  board[12] = { owner: 'white', piece: 'king' };
  board[1] = { owner: 'black', piece: 'king' };
  board[10] = { owner: 'white', piece: 'rook' };
  board[6] = { owner: 'black', piece: 'knight' };
  const position = createPosition({ board, banks: { white: ['bishop'], black: ['bishop'] } });
  const capture = { type: 'move', from: 10, to: 6 };
  assert.equal(actionNotation(position, capture, applyAction(position, capture)), 'Rxc3');
  const quiet = { type: 'move', from: 10, to: 11 };
  assert.equal(actionNotation(position, quiet, applyAction(position, quiet)), 'Rd2');
});

test('a capture note says when the taken piece had been deployed', () => {
  const board = Array(16).fill(null);
  board[12] = { owner: 'white', piece: 'king' };
  board[1] = { owner: 'black', piece: 'king' };
  board[14] = { owner: 'white', piece: 'rook' };
  const start = createPosition({ board, banks: { white: [], black: ['knight'] } });

  // Black deploys a knight onto c3 and White's rook takes it where it landed.
  const deployed = replay([
    { type: 'move', from: 14, to: 10 },
    { type: 'drop', piece: 'knight', to: 6 },
    { type: 'move', from: 10, to: 6 },
  ], start);
  assert.equal(deployed.history.at(-1).note, 'Rook takes the deployed knight on c3');

  // The same knight, taken after it has moved on, is just a knight.
  const moved = replay([
    { type: 'move', from: 14, to: 10 },
    { type: 'drop', piece: 'knight', to: 6 },
    { type: 'move', from: 10, to: 11 },
    { type: 'move', from: 6, to: 8 },
    { type: 'move', from: 11, to: 8 },
  ], start);
  assert.equal(moved.history.at(-1).note, 'Rook takes the knight on a2');
});

test('check and mate are marked in notation', () => {
  const board = Array(16).fill(null);
  board[0] = { owner: 'black', piece: 'king' };
  board[13] = { owner: 'white', piece: 'king' };
  board[11] = { owner: 'white', piece: 'rook' };
  const position = createPosition({ board, banks: { white: [], black: ['rook', 'bishop', 'knight'] } });
  // Rook to d4 checks along the fourth rank.
  const check = { type: 'move', from: 11, to: 3 };
  assert.equal(actionNotation(position, check, applyAction(position, check)), 'Rd4+');
});

test('moves pair by number and render as game text', () => {
  const { history } = replay(OPENING);
  assert.deepEqual(pairMoves(history).map((row) => [row.number, row.white.notation, row.black.notation]), [
    [1, '@Kb1', '@Kb4'],
    [2, '@Rc2', '@Nb3'],
  ]);
  assert.equal(gameText(history), '1. @Kb1 @Kb4  2. @Rc2 @Nb3');
  assert.equal(moveCount(history), 2);
  assert.equal(deploymentCount(history), 2);
});

test('a half-finished move number leaves Black empty', () => {
  const { history } = replay(OPENING.slice(0, 3));
  const rows = pairMoves(history);
  assert.equal(rows.length, 2);
  assert.equal(rows[1].black, null);
  assert.equal(moveCount(history), 2);
});

test('undo walks back to the asking player and takes at least one ply', () => {
  const { history, timeline } = replay(OPENING);
  // After four plies it is White's turn, so White walks back two: Black's reply and their own.
  assert.equal(pliesToUndo(history, timeline, 'white'), 2);
  assert.equal(pliesToUndo(history, timeline, 'black'), 1);
  assert.equal(pliesToUndo([], [createInitialPosition()], 'white'), 0);
});
