import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  applyAction, createInitialPosition, isInCheck, legalActions, opponent, positionKey,
} from '../src/rules.js';
import { decodeAction } from '../src/library.js';
import { decodePuzzlePosition } from '../src/puzzle.js';

const corpus = JSON.parse(await readFile(new URL('../data/puzzles.json', import.meta.url), 'utf8'));
const library = JSON.parse(await readFile(new URL('../data/games.json', import.meta.url), 'utf8'));

test('the checked-in puzzle corpus has the complete verified extraction', () => {
  assert.equal(corpus.checkedPositions, 52_371);
  assert.equal(corpus.puzzles.length, 1_526);
  assert.deepEqual(corpus.counts, { 1: 537, 2: 510, 3: 323, 4: 156 });
  assert.equal(new Set(corpus.puzzles.map(({ position }) => positionKey(decodePuzzlePosition(position)))).size, 1_526);
});

test('every puzzle source resolves and every stored line ends in checkmate', () => {
  const games = new Map(library.games.map((game) => [game.id, game]));
  const timelines = new Map();
  function sourceKey(gameId, ply) {
    if (!timelines.has(gameId)) {
      const game = games.get(gameId);
      assert.ok(game, `source game ${gameId}`);
      let position = createInitialPosition();
      const timeline = [position];
      for (const encoded of game.actions) {
        position = applyAction(position, decodeAction(encoded));
        timeline.push(position);
      }
      timelines.set(gameId, timeline);
    }
    return positionKey(timelines.get(gameId)[ply]);
  }

  for (const puzzle of corpus.puzzles) {
    const start = decodePuzzlePosition(puzzle.position);
    const key = positionKey(start);
    for (const [gameId, ply] of puzzle.sources) assert.equal(sourceKey(gameId, ply), key, `puzzle ${puzzle.id} source`);
    for (const line of puzzle.solutions) {
      assert.ok(line.length <= puzzle.mate * 2 - 1, `puzzle ${puzzle.id} distance`);
      let position = start;
      for (const encoded of line) position = applyAction(position, decodeAction(encoded));
      assert.equal(legalActions(position).length, 0, `puzzle ${puzzle.id} is terminal`);
      assert.ok(isInCheck(position, position.turn), `puzzle ${puzzle.id} ends in check`);
      assert.equal(opponent(position.turn), start.turn, `puzzle ${puzzle.id} attacker wins`);
    }
  }
});
