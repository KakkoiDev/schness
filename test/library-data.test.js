import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { applyAction, createInitialPosition } from '../src/rules.js';
import { decodeAction } from '../src/library.js';

const library = JSON.parse(await readFile(new URL('../data/games.json', import.meta.url), 'utf8'));

test('the checked-in library represents both complete experiments without duplicate games', () => {
  assert.equal(library.records, 2080);
  assert.equal(library.uniqueGames, 1099);
  assert.equal(library.duplicatesRemoved, 981);
  assert.deepEqual(library.runs.map(({ run, sharpVersion }) => [run, sharpVersion]), [[1, 1], [2, 2]]);
  assert.equal(new Set(library.games.map((game) => JSON.stringify(game.actions))).size, library.uniqueGames);
  assert.ok(library.games.some((game) => game.sources.some((source) => source.includes('Sharp v1'))));
  assert.ok(library.games.some((game) => game.sources.some((source) => source.includes('Sharp v2'))));
});

test('every archived game replays legally from start to finish', () => {
  for (const game of library.games) {
    let position = createInitialPosition();
    for (const encoded of game.actions) position = applyAction(position, decodeAction(encoded));
    assert.equal(game.actions.length, game.plies, `game ${game.id}`);
  }
});
