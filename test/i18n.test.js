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

test('nothing carries a hand-maintained cache-busting string', async () => {
  // There were 31 of them — styles.css?v=74 against ui.css?v=84 against
  // rules-modal.js?v=84 — each bumped by hand. Bump one and forget another and
  // a returning visitor gets new CSS against an old module, a bug that
  // reproduces for nobody. They also defeated the precache they sat beside:
  // sw.js lists './src/main.js', the page asked for './src/main.js?v=71', and
  // caches.match does not ignore the search string.
  //
  // The service worker owns cache identity now. CACHE is the one number, and
  // DECISIONS.md already requires it to move with any change to SHELL.
  const files = ['index.html', 'game.html', 'watch.html', 'library.html', 'puzzles.html',
    'src/lobby.js', 'src/main.js', 'src/watch-ui.js', 'src/library-ui.js', 'src/puzzle-ui.js',
    'src/rules-modal.js', 'src/analysis-ui.js'];
  for (const file of files) {
    const source = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /\?v=\d+/, `${file} still hand-maintains a cache-busting string`);
  }
});

test('every visible page header carries the same two-colour mark', async () => {
  const icon = await readFile(new URL('../icon.svg', import.meta.url), 'utf8');
  const board = icon.match(/class="board" fill="(#[0-9A-F]{6})"/)[1];
  const chip = icon.match(/class="chip" fill="(#[0-9A-F]{6})"/)[1];
  const styles = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  // The header and the favicon used to disagree: a #e96f4b dot next to a
  // #7d3f6d accent. They are one artwork and one pair of colours now.
  assert.match(styles, new RegExp(`--ink:${board};`, 'i'));
  assert.match(styles, new RegExp(`--accent:${chip};`, 'i'));
  for (const file of ['index.html', 'game.html', 'watch.html', 'library.html', 'puzzles.html']) {
    const page = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.match(page, /<svg class="brand-glyph" viewBox="-24 0 148 148"/, file);
    assert.match(page, /<path fill="var\(--ink\)" d="M8 52H48V100H96V140/, file);
    assert.match(page, /<rect fill="var\(--accent\)" x="52" y="0" width="48" height="48"/, file);
    assert.doesNotMatch(page, /brand-mark/, `${file} still has the letterform tile`);
    assert.match(page, /class="header-actions"/, file);
  }
});

test('Japanese tutorial actions stay horizontal in the mobile rule grid', async () => {
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  // The strip is gone; the rule actions live in the Rules dialog now, and the
  // thing that must hold is the same: a Japanese label stays a horizontal row.
  const ui = await readFile(new URL('../ui.css', import.meta.url), 'utf8');
  assert.match(ui, /\.rules-dialog \.rules-list \.rule-demo-trigger \{[^}]*justify-self:start/);
  assert.match(css, /:root\[lang="ja"\] button,[^{]*\{[^}]*line-break:strict/);
  assert.doesNotMatch(css, /lang="ja"[^}]*overflow-wrap:anywhere/);
});

test('Japanese mobile navigation stays horizontal and compact', async () => {
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.header-actions \.text-button\s*\{[^}]*white-space:\s*nowrap/);
  assert.match(css, /@media\(max-width:480px\)[\s\S]*?\.lobby-page header\s*\{[\s\S]*?margin-bottom:1\.25rem/);
  // The header is one row that never wraps, in either language. It used to
  // reach that by deleting the wordmark below 350px; see Stage 4.
  assert.match(css, /\.brand,\n\.header-actions,\n\.header-actions \.text-button \{\n  white-space: nowrap;/);
});

test('phone navigation uses compact text controls without decorative icons', async () => {
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  // The phone header used to make room by deleting the wordmark. Nothing may
  // hide it again: it is the only thing in that row that never shrinks, and
  // the nav takes a row of its own below 760px instead.
  assert.doesNotMatch(css, /\.brand[^{}]*\{[^}]*display:\s*none/);
  assert.doesNotMatch(css, /\.brand-word[^{}]*\{[^}]*display:\s*none/);
  assert.match(css, /\.brand\{display:flex;flex:0 0 auto/);
  assert.match(css, /@media\(max-width:760px\)[\s\S]*?\.site-nav \{ *order:3;flex-basis:100%/);
  // Still text, not glyphs: a decorative icon is a second vocabulary to learn.
  assert.doesNotMatch(css, /header \.rules-button::before\s*\{\s*content/);
  for (const file of ['index.html', 'game.html', 'watch.html', 'library.html', 'puzzles.html']) {
    const page = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.match(page, /href="\.\/styles\.css"/, file);
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
