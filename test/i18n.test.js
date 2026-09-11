import test from 'node:test';
import assert from 'node:assert/strict';
import { language, translateText } from '../src/i18n.js';
import { readFile } from 'node:fs/promises';

test('Japanese devices default to Japanese and a saved choice wins', () => {
  const empty = { getItem: () => null };
  assert.equal(language(empty, 'ja-JP'), 'ja');
  assert.equal(language(empty, 'en-US'), 'en');
  assert.equal(language({ getItem: () => 'en' }, 'ja-JP'), 'en');
});

test('every page entry point loads the shared bilingual interface', async () => {
  for (const file of ['lobby', 'main', 'watch-ui', 'library-ui', 'puzzle-ui']) {
    const source = await readFile(new URL(`../src/${file}.js`, import.meta.url), 'utf8');
    assert.match(source, /initI18n\(\)/, file);
  }
});

test('every visible page header uses the same S product mark', async () => {
  for (const file of ['index.html', 'game.html', 'watch.html', 'library.html', 'puzzles.html']) {
    const page = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.match(page, /class="brand-mark"[^>]*>S<\/span>/, file);
    assert.match(page, /class="header-actions"/, file);
  }
});

test('core and variable game language has Japanese coverage', () => {
  assert.equal(translateText('Create an online game', 'ja'), 'オンライン対局を作る');
  assert.equal(translateText('White to move · mate in 3', 'ja'), '白の手番・3手詰め');
  assert.equal(translateText('Your reserve · 2', 'ja'), 'あなたの持ち駒・2');
  assert.equal(translateText('Create an online game', 'en'), 'Create an online game');
});
