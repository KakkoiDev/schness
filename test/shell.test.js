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

test('board rows are fixed and every vector piece uses the same box', async () => {
  const css = await readFile(resolve(root, 'styles.css'), 'utf8');
  assert.match(css, /grid-template-rows:\s*repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.piece-white\s*{/);
  assert.match(css, /\.piece-black\s*{/);
  assert.match(css, /\[hidden\]\s*{\s*display:\s*none\s*!important;/);
  assert.match(css, /\.piece,[\s\S]*?\.bank-piece \.piece-king\s*{[\s\S]*?width:\s*78%;[\s\S]*?height:\s*78%;[\s\S]*?object-fit:\s*contain;/);
  assert.match(css, /\.game-page \.bank-piece\s*{[\s\S]*?width:\s*var\(--piece-cell\)/);
  assert.match(css, /\.game-page \.bank-piece:disabled,[\s\S]*?opacity:\s*1/);
  assert.match(css, /--mobile-board-size:\s*min\([^;]+66svh/);
  assert.match(css, /grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.game-page \.player strong,[\s\S]*?white-space:\s*nowrap/);
  assert.match(css, /\.game-page \.bank-piece:first-child:nth-last-child\(1\)/);
  assert.doesNotMatch(css, /\.fallback\s*{[^}]*margin:\s*-/);
  assert.match(css, /\.square\.last-from, \.square\.last-to/);
  assert.match(css, /\.square\.in-check[^}]+radial-gradient/);
});

test('lobby and game are separate documents with rules and home navigation', async () => {
  const html = await readFile(resolve(root, 'index.html'), 'utf8');
  const game = await readFile(resolve(root, 'game.html'), 'utf8');
  const css = await readFile(resolve(root, 'styles.css'), 'utf8');
  assert.match(html, /<dialog[^>]+id="rules-dialog"/);
  assert.ok((html.match(/<h3>/g) ?? []).length >= 5);
  assert.ok((html.match(/<ul>/g) ?? []).length >= 5);
  assert.doesNotMatch(html, /id="board"/);
  assert.match(game, /id="board"/);
  assert.match(game, /id="back-to-menu"[^>]+href="\.\/"/);
  assert.match(game, /src="\.\/src\/main\.js"/);
  assert.doesNotMatch(game, /id="alternate-mode"/);
  assert.match(html, /src="\.\/src\/lobby\.js"/);
  assert.match(html, /<body class="lobby-page">/);
  assert.doesNotMatch(html, /mini-board|Small board|Deep trouble/);
  assert.doesNotMatch(html, /data-open-settings|text-chat-setting|voice-chat-setting/);
  assert.doesNotMatch(game, /data-open-settings|text-chat-setting|voice-chat-setting/);
  assert.match(game, /id="peer-audio"[^>]+autoplay/);
  assert.match(game, /id="peer-video"[^>]+autoplay[^>]+playsinline/);
  assert.match(game, /id="local-video"[^>]+autoplay[^>]+muted[^>]+playsinline/);
  assert.match(game, /data-quick-message="Good game!"/);
  assert.match(game, /id="voice-toggle"[^>]+aria-pressed="false"[^>]*>Audio off</);
  assert.match(game, /id="video-toggle"[^>]+aria-pressed="false"[^>]*>Video off</);
  const main = await readFile(resolve(root, 'src/main.js'), 'utf8');
  assert.match(main, /piece-\$\{piece\}/);
  assert.match(main, /createElement\('img'\)/);
  assert.match(main, /element\.draggable = false/);
  assert.match(main, /pieceRect:.*getBoundingClientRect/);
  assert.match(main, /ghost\.style\.width/);
  assert.match(main, /pointerdown/);
  assert.match(main, /elementFromPoint/);
  assert.match(main, /getUserMedia\(\{ audio: false, video: true \}\)/);
  assert.match(main, /function toggleChat/);
  assert.match(css, /\.drag-ghost\s*{/);
  assert.match(css, /transform:\s*translate\(-50%, -50%\)/);
  assert.match(css, /touch-action:\s*none/);
  assert.match(css, /\.game-page \.match-chat\s*{[\s\S]*?grid-column:\s*2;[\s\S]*?grid-row:\s*2;/);
  assert.doesNotMatch(html, />4 × 4 chess</);
});
