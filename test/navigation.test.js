import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameId, gameRoute, gameUrl } from '../src/navigation.js';

test('every generated match id is a UUID v4', () => {
  const ids = new Set(Array.from({ length: 64 }, () => createGameId()));
  assert.equal(ids.size, 64);
  for (const id of ids) assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});

test('game URLs keep the app path but create an isolated game route', () => {
  const id = '7e42a0a1-710c-4d91-b753-4a18d7fec92f';
  assert.equal(
    gameUrl('https://schness.com/?old=value#fragment', 'online', id),
    `https://schness.com/game.html?game=${id}&mode=online`,
  );
  assert.deepEqual(gameRoute(`?game=${id}&mode=online`), { gameId: id, mode: 'online' });
});

test('the lobby ignores malformed or unsupported game routes', () => {
  assert.equal(gameRoute(''), null);
  assert.equal(gameRoute('?game=not-a-uuid&mode=online'), null);
  assert.equal(gameRoute('?game=7e42a0a1-710c-4d91-b753-4a18d7fec92f&mode=other'), null);
});
