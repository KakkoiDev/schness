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

test('the English interface offers the shorter Japanese language label', async () => {
  const source = await readFile(new URL('../src/i18n.js', import.meta.url), 'utf8');
  assert.match(source, /locale === 'ja' \? 'EN' : '日本'/);
  assert.doesNotMatch(source, /locale === 'ja' \? 'EN' : '日本語'/);
});

test('every page entry point loads the shared bilingual interface', async () => {
  for (const file of ['lobby', 'main', 'watch-ui', 'library-ui', 'puzzle-ui']) {
    const source = await readFile(new URL(`../src/${file}.js`, import.meta.url), 'utf8');
    assert.match(source, /initI18n\(\)/, file);
  }
});

test('page entries and their i18n import are cache-busted together', async () => {
  const entries = [
    ['index.html', 'lobby'], ['game.html', 'main'], ['watch.html', 'watch-ui'],
    ['library.html', 'library-ui'], ['puzzles.html', 'puzzle-ui'],
  ];
  for (const [pageFile, moduleName] of entries) {
    const page = await readFile(new URL(`../${pageFile}`, import.meta.url), 'utf8');
    const module = await readFile(new URL(`../src/${moduleName}.js`, import.meta.url), 'utf8');
    const pageVersion = page.match(new RegExp(`src="\\./src/${moduleName}\\.js\\?v=(\\d+)"`))?.[1];
    const importVersion = module.match(/from '\.\/i18n\.js\?v=(\d+)'/)?.[1];
    assert.ok(pageVersion, pageFile);
    assert.equal(importVersion, pageVersion, moduleName);
  }
});

test('every visible page header uses the same S product mark', async () => {
  for (const file of ['index.html', 'game.html', 'watch.html', 'library.html', 'puzzles.html']) {
    const page = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.match(page, /class="brand-mark"[^>]*>S<\/span>/, file);
    assert.match(page, /class="header-actions"/, file);
  }
});

test('Japanese tutorial actions stay horizontal in the mobile rule grid', async () => {
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.rules-strip \.rule-demo-trigger \{ grid-column:2;[^}]*white-space:nowrap/);
  assert.doesNotMatch(css, /lang="ja"[^}]*overflow-wrap:anywhere/);
});

test('Japanese mobile navigation stays horizontal and compact', async () => {
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.header-actions \.text-button\s*\{[^}]*white-space:\s*nowrap/);
  assert.match(css, /@media\(max-width:480px\)[\s\S]*?\.lobby-page header\s*\{[\s\S]*?margin-bottom:1\.25rem/);
  assert.match(css, /@media\(max-width:350px\)[\s\S]*?\.brand h1/);
});

test('phone navigation uses compact text controls without decorative icons', async () => {
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  assert.match(css, /@media\(max-width:480px\)[\s\S]*?header \.brand h1,[\s\S]*?display:none/);
  assert.match(css, /header \.header-actions \.text-button\s*\{[\s\S]*?width:auto;[\s\S]*?min-width:44px;[\s\S]*?height:44px;[\s\S]*?font-size:\.72rem/);
  assert.doesNotMatch(css, /header \.rules-button::before\s*\{\s*content/);
  for (const file of ['index.html', 'game.html', 'watch.html', 'library.html', 'puzzles.html']) {
    const page = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.match(page, /href="\.\/styles\.css\?v=63"/, file);
  }
});

test('core and variable game language has Japanese coverage', () => {
  assert.equal(translateText('Create an online game', 'ja'), 'オンライン対局を作る');
  assert.equal(translateText('White to move · mate in 3', 'ja'), '白の手番・3手詰め');
  assert.equal(translateText('Your reserve · 2', 'ja'), 'あなたの持ち駒・2');
  assert.equal(translateText('Create an online game', 'en'), 'Create an online game');
});

test('common live network, media, tutorial, and move states are translated', () => {
  assert.equal(translateText('Your connection is unstable', 'ja'), '接続が不安定です');
  assert.equal(translateText('Microphone permission was not granted.', 'ja'), 'マイクの使用が許可されませんでした。');
  assert.equal(translateText('Move your rook to one of the highlighted squares.', 'ja'), 'ルークを光っているマスのいずれかへ動かしてください。');
  assert.equal(translateText('White deployed a knight on b2', 'ja'), '白がナイトをb2に配置');
  assert.equal(translateText('Rook on b2 is selected. Your turn.', 'ja'), 'ルーク（b2）を選択中。あなたの手番です。');
  assert.equal(translateText('1:00 left', 'ja'), '1:00 残り');
});

test('the language switch is inserted into the same action group as the theme switch', async () => {
  const source = await readFile(new URL('../src/i18n.js', import.meta.url), 'utf8');
  assert.match(source, /querySelector\('header \.header-actions'\)\s*\?\?/);
  assert.doesNotMatch(source, /querySelector\('header \.header-actions, header nav, header'\)/);
});
