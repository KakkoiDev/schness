import test from 'node:test';
import assert from 'node:assert/strict';
import { scorePosition } from '../src/bot.js';
import { forcedMate, decodePuzzlePosition } from '../src/puzzle.js';
import { applyAction, createInitialPosition, legalActions } from '../src/rules.js';
import { mateOutlookAtDepth, movesAllowingMate } from '../src/training.js';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const mateInOne = decodePuzzlePosition({ b: [6,5,0,0,8,0,2,7,0,1,0,0,0,0,4,0], t: 'w' });

test('training entry modules parse before a browser attempts to start them', () => {
  for (const file of ['main', 'watch-ui', 'library-ui', 'analysis-ui', 'analysis-worker', 'training']) {
    execFileSync(process.execPath, ['--check', fileURLToPath(new URL(`../src/${file}.js`, import.meta.url))]);
  }
});

test('training reports an exact forced mate, not just a promising move', () => {
  assert.equal(forcedMate(mateInOne, 1)?.moves, 1);
  assert.equal(forcedMate(mateInOne, 0), null);
  assert.deepEqual(mateOutlookAtDepth(mateInOne, 1), { kind: 'opportunity', side: 'white', moves: 1 });
});

test('the defender is warned of an unavoidable mate while it is their turn', () => {
  const opening = decodePuzzlePosition({ b: [6,5,0,0,8,4,2,3,0,1,7,0,0,0,0,0], t: 'w' });
  const after = applyAction(opening, forcedMate(opening, 2).actions[0]);
  assert.equal(after.turn, 'black');
  assert.deepEqual(mateOutlookAtDepth(after, 1), { kind: 'threat', side: 'white', moves: 1 });
  assert.equal(mateOutlookAtDepth(opening, 1), null);
  const risks = movesAllowingMate(opening, 1);
  assert.ok(risks.length > 0 && risks.length < legalActions(opening).length,
    'risky moves must not be mislabeled as an unavoidable forced mate');
  assert.deepEqual(opening.turn, 'white', 'search must not mutate the side to move');
});

test('advantage is White-positive and does not change its input position', () => {
  const before = structuredClone(mateInOne);
  assert.ok(scorePosition(mateInOne, 2) > 0);
  assert.deepEqual(mateInOne, before);
});

test('analysis is opt-in on bot game and arena and library replay, not P2P', async () => {
  const files = await Promise.all(['game.html', 'library.html', 'src/main.js', 'src/library-ui.js', 'src/analysis-ui.js', 'sw.js', 'watch.html', 'src/watch-ui.js'].map((name) => readFile(new URL(`../${name}`, import.meta.url), 'utf8')));
  assert.match(files[0], /id="training-mate" type="checkbox"/);
  assert.match(files[0], /id="training-advantage" type="checkbox"/);
  assert.match(files[1], /id="replay-advantage" type="checkbox"/);
  assert.match(files[2], /mode === 'bot'/);
  assert.match(files[4], /worker\?\.terminate\(\)/);
  assert.match(files[4], /Mate search incomplete/);
  assert.match(files[5], /analysis-worker\.js/);
  assert.match(files[5], /training\.js/);
  assert.match(files[6], /id="watch-training-mate" type="checkbox"/);
  assert.match(files[6], /id="watch-training-advantage" type="checkbox"/);
  assert.match(files[7], /trainingAnalysis\.refresh\(\)/);
  assert.ok(createInitialPosition());
});

test('online clock is chosen before creating a link; tutorial can be opened in-page', async () => {
  const [home, lobby, tutorial, main] = await Promise.all(['index.html', 'src/lobby.js', 'src/tutorial.js', 'src/main.js'].map((name) => readFile(new URL(`../${name}`, import.meta.url), 'utf8')));
  assert.match(home, /<dialog id="online-setup"/);
  assert.match(home, /id="online-setup-form"/);
  assert.doesNotMatch(home, /id="replay-tutorial"/);
  assert.match(home, /id="rules-demo"/);
  assert.match(lobby, /onlineSetup\.showModal\(\)/);
  assert.match(lobby, /setClockMode\(new FormData\(event\.currentTarget\)/);
  assert.match(tutorial, /\.rule-demo-trigger/);
  assert.match(main, /createClock\(nextMode === 'online' \? clockMode\(\) : 'untimed'\)/);
});
