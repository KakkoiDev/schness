import test from 'node:test';
import assert from 'node:assert/strict';
import { scorePosition } from '../src/bot.js';
import { forcedMate, decodePuzzlePosition } from '../src/puzzle.js';
import { createInitialPosition } from '../src/rules.js';
import { readFile } from 'node:fs/promises';

const mateInOne = decodePuzzlePosition({ b: [6,5,0,0,8,0,2,7,0,1,0,0,0,0,4,0], t: 'w' });

test('training reports an exact forced mate, not just a promising move', () => {
  assert.equal(forcedMate(mateInOne, 1)?.moves, 1);
  assert.equal(forcedMate(mateInOne, 0), null);
});

test('advantage is White-positive and does not change its input position', () => {
  const before = structuredClone(mateInOne);
  assert.ok(scorePosition(mateInOne, 2) > 0);
  assert.deepEqual(mateInOne, before);
});

test('analysis is opt-in on bot game and library replay, not P2P', async () => {
  const files = await Promise.all(['game.html', 'library.html', 'src/main.js', 'src/library-ui.js', 'src/analysis-ui.js', 'sw.js'].map((name) => readFile(new URL(`../${name}`, import.meta.url), 'utf8')));
  assert.match(files[0], /id="training-mate" type="checkbox"/);
  assert.match(files[0], /id="training-advantage" type="checkbox"/);
  assert.match(files[1], /id="replay-advantage" type="checkbox"/);
  assert.match(files[2], /mode === 'bot'/);
  assert.match(files[4], /worker\?\.terminate\(\)/);
  assert.match(files[4], /Mate search incomplete/);
  assert.match(files[5], /analysis-worker\.js/);
  assert.ok(createInitialPosition());
});
