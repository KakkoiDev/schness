import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('every service-worker shell entry exists', async () => {
  const source = await readFile(resolve(root, 'sw.js'), 'utf8');
  const shell = source.match(/const SHELL = \[([\s\S]*?)\];/)?.[1] ?? '';
  const paths = [...shell.matchAll(/'\.\/(.*?)'/g)].map((match) => match[1]).filter(Boolean);
  assert.ok(paths.length >= 10);
  await Promise.all(paths.map((path) => access(resolve(root, path))));
});

test('manifest describes a standalone app with a local icon', async () => {
  const manifest = JSON.parse(await readFile(resolve(root, 'manifest.webmanifest'), 'utf8'));
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, './');
  assert.ok(manifest.icons.every((icon) => icon.src.startsWith('./')));
});

test('board rows are fixed and pieces have owner-specific styling', async () => {
  const css = await readFile(resolve(root, 'styles.css'), 'utf8');
  assert.match(css, /grid-template-rows:\s*repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.piece-white\s*{/);
  assert.match(css, /\.piece-black\s*{/);
  assert.match(css, /\[hidden\]\s*{\s*display:\s*none\s*!important;/);
  assert.match(css, /\.piece\s*{[\s\S]*?width:\s*\.82em;[\s\S]*?height:\s*\.82em;/);
  assert.doesNotMatch(css, /\.fallback\s*{[^}]*margin:\s*-/);
});

test('lobby and game are separate documents with rules and home navigation', async () => {
  const html = await readFile(resolve(root, 'index.html'), 'utf8');
  const game = await readFile(resolve(root, 'game.html'), 'utf8');
  assert.match(html, /<dialog[^>]+id="rules-dialog"/);
  assert.ok((html.match(/<h3>/g) ?? []).length >= 5);
  assert.ok((html.match(/<ul>/g) ?? []).length >= 5);
  assert.doesNotMatch(html, /id="board"/);
  assert.match(game, /id="board"/);
  assert.match(game, /id="back-to-menu"[^>]+href="\.\/"/);
  assert.match(game, /src="\.\/src\/main\.js"/);
  assert.match(game, /id="alternate-mode"/);
  assert.match(html, /src="\.\/src\/lobby\.js"/);
});
