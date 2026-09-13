import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('all five pages share the locally bundled Basecoat and integration sheet', async () => {
  for (const path of ['index.html', 'game.html', 'watch.html', 'library.html', 'puzzles.html']) {
    const html = await read(path);
    const vendor = html.indexOf('./vendor/basecoat/basecoat-nova.cdn.min.css');
    const layout = html.indexOf('./styles.css?v=74');
    const integration = html.indexOf('./ui.css?v=76');
    assert.ok(vendor >= 0 && layout > vendor && integration > layout, path);
    for (const button of html.match(/<button\b[^>]*>/g) ?? []) {
      assert.match(button, /class="[^"]*\bbtn\b/, `${path}: ${button}`);
    }
  }
  const sw = await read('sw.js');
  assert.match(sw, /'\.\/ui\.css'/);
  assert.match(sw, /'\.\/vendor\/basecoat\/basecoat-nova\.cdn\.min\.css'/);
  assert.match(await read('vendor/basecoat/LICENSE.md'), /MIT License/);
});

test('generated UI controls migrate but board and reserve buttons stay untouched', async () => {
  assert.match(await read('src/i18n.js'), /language-button btn/);
  assert.match(await read('src/library-ui.js'), /library-game btn/);
  assert.match(await read('src/watch-ui.js'), /btn current/);
  const board = await read('src/board-ui.js');
  assert.doesNotMatch(board, /className = '[^']*\bbtn\b/);
  const css = await read('ui.css');
  assert.match(css, /--background: var\(--paper\)/);
  assert.match(css, /min-height: 44px/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});
