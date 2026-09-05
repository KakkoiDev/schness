import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { BISHOP, BLACK, KING, WHITE, applyAction, createPosition } from '../src/rules.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PAGES = ['index.html', 'game.html'];

/** Which bank a captured piece actually lands in, asked of the engine. */
function bankAfterACapture() {
  const board = Array(16).fill(null);
  board[12] = { owner: WHITE, piece: KING };
  board[3] = { owner: BLACK, piece: KING };
  board[8] = { owner: WHITE, piece: BISHOP };
  board[5] = { owner: BLACK, piece: BISHOP };
  const position = createPosition({
    board, banks: { [WHITE]: [], [BLACK]: [] }, turn: WHITE, phase: 'play',
  });
  // White's bishop on a2 takes Black's bishop on b3.
  const next = applyAction(position, { type: 'move', from: 8, to: 5 });
  return { white: next.banks[WHITE], black: next.banks[BLACK] };
}

test('a capture hands the piece back to the player who owned it', () => {
  const banks = bankAfterACapture();
  assert.deepEqual(banks.black, [BISHOP], 'the victim should get their bishop back');
  assert.deepEqual(banks.white, [], 'the capturer keeps nothing');
});

test('the rules a player reads match the rules the engine plays', async () => {
  // These disagreed: the lobby said a captured piece "joins its owner's
  // reserve" while the rules dialog on both pages said it "goes into your own
  // reserve" — the opposite, on the mechanic the whole game is built around.
  // Whoever edits this text next should have to look at the engine.
  const capturerGainsNothing = bankAfterACapture().white.length === 0;
  assert.ok(capturerGainsNothing, 'the engine changed; the rules text below needs rewriting too');
  for (const page of PAGES) {
    const html = await readFile(resolve(root, page), 'utf8');
    assert.doesNotMatch(html, /you capture goes into your own reserve/i,
      `${page} tells players captures fill their own reserve, which is backwards`);
  }
});

test('both pages tell the same story about captures', async () => {
  const [lobby, invite] = await Promise.all(
    PAGES.map((page) => readFile(resolve(root, page), 'utf8')),
  );
  const rule = (html) => html.match(/<li><strong>Captures come back<\/strong><span>(.*?)<\/span><\/li>/s)?.[1];
  assert.ok(rule(lobby), 'the lobby lost its capture rule');
  assert.equal(rule(lobby), rule(invite), 'the two pages describe captures differently');
});
