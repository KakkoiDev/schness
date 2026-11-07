import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BLACK,
  KING,
  KNIGHT,
  ROOK,
  WHITE,
  createPosition,
} from '../src/rules.js';
import {
  actionAt,
  bankSelection,
  boardSelection,
  destinations,
  setupActionAt,
  setupDestinations,
} from '../src/interaction.js';

function game() {
  const board = Array(16).fill(null);
  board[15] = { owner: WHITE, piece: KING };
  board[0] = { owner: BLACK, piece: KING };
  board[9] = { owner: WHITE, piece: ROOK };
  return createPosition({ board, banks: { [WHITE]: [KNIGHT], [BLACK]: [] }, turn: WHITE });
}

test('board selection exposes only that piece legal destinations', () => {
  const position = game();
  const targets = destinations(position, boardSelection(9));
  assert.equal(targets.has(10), true);
  assert.equal(targets.has(15), false);
  assert.deepEqual(actionAt(position, boardSelection(9), 10), { type: 'move', from: 9, to: 10 });
});

test('bank selection exposes legal non-checking drops', () => {
  const position = game();
  const targets = destinations(position, bankSelection(KNIGHT));
  assert.equal(targets.has(10), true);
  assert.equal(targets.has(9), false);
  assert.equal(targets.has(6), false);
});

test('setup square resolves to a king placement only on the home rank', () => {
  const position = {
    board: Array(16).fill(null),
    banks: { [WHITE]: [ROOK, 'bishop', KNIGHT], [BLACK]: [ROOK, 'bishop', KNIGHT] },
    turn: WHITE,
    phase: 'place-white-king',
    repetitions: {},
  };
  assert.deepEqual(setupActionAt(position, 12), { type: 'place-king', to: 12 });
  assert.equal(setupActionAt(position, 0), null);
  assert.deepEqual([...setupDestinations(position)], [12, 13, 14, 15]);
});

test('a reserve selection exposes a legal square that blocks check', () => {
  const board = Array(16).fill(null);
  board[12] = { owner: WHITE, piece: KING };
  board[3] = { owner: BLACK, piece: KING };
  board[0] = { owner: BLACK, piece: ROOK };
  const position = createPosition({ board, banks: { [WHITE]: ['bishop'], [BLACK]: [] }, turn: WHITE });
  assert.deepEqual([...destinations(position, bankSelection('bishop'))], [4, 8]);
  assert.deepEqual(actionAt(position, bankSelection('bishop'), 4), { type: 'drop', piece: 'bishop', to: 4 });
});

test('Classic refused drops exclude legal targets and unsafe king defenses', async () => {
  const { refusedDrops } = await import('../src/interaction.js');
  const board = Array(16).fill(null);
  board[1] = { owner: BLACK, piece: KING };
  board[13] = { owner: WHITE, piece: KING };
  const position = createPosition({ board, banks: { white: [ROOK], black: [] }, turn: WHITE });
  const selected = bankSelection(ROOK);
  assert.deepEqual([...refusedDrops(position, selected)].sort((a,b) => a-b), [0,2,3,5,9]);
  assert.equal(refusedDrops({ ...position, rules: { allowCheckingDrops: true } }, selected).size, 0);
  assert.equal(refusedDrops(position, boardSelection(13)).size, 0);
  board[12] = { owner: BLACK, piece: ROOK };
  const checked = createPosition({ board, banks: { white: [ROOK], black: [] }, turn: WHITE });
  assert.equal(refusedDrops(checked, selected).has(0), false);
});

test('quiet capture-policy and setup presets refuse the same drops as Classic', async () => {
  const { refusedDrops } = await import('../src/interaction.js');
  const { VARIANTS } = await import('../src/variants.js');
  const board = Array(16).fill(null);
  board[1] = { owner: BLACK, piece: KING };
  board[13] = { owner: WHITE, piece: KING };
  const at = (rules) => createPosition({ board, banks: { white: [ROOK], black: [] }, turn: WHITE, rules });
  const refused = (rules) => [...refusedDrops(at(rules), bankSelection(ROOK))].sort((a, b) => a - b);
  const quiet = Object.entries(VARIANTS).filter(([id, rules]) => rules.experiment && !rules.allowCheckingDrops);
  assert.deepEqual(quiet.map(([id]) => id).sort(), ['capture-bank-3-quiet', 'capture-bank-4-quiet',
    'capture-bank-5-quiet', 'capture-bank-6-quiet', 'hidden-quiet', 'permanent-loss-quiet',
    'setup-black-quiet', 'setup-white-quiet']);
  for (const [id, rules] of quiet) assert.deepEqual(refused(rules), [0, 2, 3, 5, 9], id);
  // Presets that allow checking drops, with or without a restriction policy, still explain nothing:
  // a restriction needs its own reason, which does not exist yet.
  for (const id of ['unrestricted', 'capture-bank-4-checking', 'knight-check', 'distant-check', 'cooldown']) {
    assert.deepEqual(refused(VARIANTS[id]), [], id);
  }
});
