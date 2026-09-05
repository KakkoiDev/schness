import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseAction } from '../src/bot.js';
import {
  BLACK,
  KING,
  ROOK,
  WHITE,
  actionKey,
  createPosition,
  legalActions,
} from '../src/rules.js';

test('the bot always returns a legal action', () => {
  const board = Array(16).fill(null);
  board[15] = { owner: WHITE, piece: KING };
  board[0] = { owner: BLACK, piece: KING };
  const game = createPosition({
    board,
    banks: { [WHITE]: [ROOK], [BLACK]: [ROOK] },
    turn: WHITE,
  });
  const action = chooseAction(game, { depth: 2 });
  const legal = new Set(legalActions(game).map(actionKey));
  assert.equal(legal.has(actionKey(action)), true);
});

test('the bot returns null when the game has no legal action', () => {
  const board = Array(16).fill(null);
  board[0] = { owner: WHITE, piece: KING };
  board[2] = { owner: BLACK, piece: KING };
  board[1] = { owner: BLACK, piece: 'bishop' };
  board[8] = { owner: BLACK, piece: ROOK };
  const game = createPosition({ board, banks: { [WHITE]: [], [BLACK]: [] }, turn: WHITE });
  assert.equal(chooseAction(game, { depth: 2 }), null);
});


test('the transposition cache preserves the uncached alpha-beta result', () => {
  const board = Array(16).fill(null);
  board[15] = { owner: WHITE, piece: KING };
  board[0] = { owner: BLACK, piece: KING };
  const game = createPosition({
    board,
    banks: { [WHITE]: [ROOK], [BLACK]: [ROOK] },
    turn: WHITE,
  });
  assert.equal(
    actionKey(chooseAction(game, { depth: 4 })),
    actionKey(chooseAction(game, { depth: 4, useCache: false })),
  );
});
