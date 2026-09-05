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

test('the black knight carries no stray corner-bracket stroke', async () => {
  const knight = await readFile(resolve(root, 'assets/pieces/bN.svg'), 'utf8');
  // A third path used to stroke a white rounded bracket that floated clear of the silhouette.
  assert.doesNotMatch(knight, /M600 706\.9/);
  assert.doesNotMatch(knight, /stroke="#f2f2f2"/);
  assert.doesNotMatch(knight, /275\.5 673\.8/);
  // Only the body and its light interior detail remain.
  assert.equal([...knight.matchAll(/<path\b/g)].length, 2);
  assert.match(knight, /<path fill="#f2f2f2" d="M177\.4 578\.1/);
});

test('board rows are fixed and every vector piece uses the same box', async () => {
  const css = await readFile(resolve(root, 'styles.css'), 'utf8');
  assert.match(css, /grid-template-rows:\s*repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.piece-white\s*{/);
  assert.match(css, /\.piece-black\s*{/);
  assert.match(css, /\[hidden\]\s*{\s*display:\s*none\s*!important;/);
  assert.match(css, /\.piece,[\s\S]*?\.bank-piece \.piece-king\s*{[\s\S]*?width:\s*78%;[\s\S]*?height:\s*78%;[\s\S]*?object-fit:\s*contain;/);
  assert.match(css, /\.bank-piece,\s*\n\.bank-slot\s*{[\s\S]*?width:\s*50px/);
  assert.match(css, /\.bank-slot\s*{[\s\S]*?border:\s*1px dashed var\(--line\)/);
  assert.match(css, /\.bank-piece\.selected\s*{[\s\S]*?border-color:\s*var\(--ink\)/);
  assert.match(css, /\.game-page \.bank-piece:disabled,[\s\S]*?opacity:\s*1/);
  assert.match(css, /--mobile-board-size:\s*min\([^;]+66svh/);
  assert.match(css, /\.player\s*{[\s\S]*?justify-content:\s*space-between/);
  assert.match(css, /\.game-page \.player strong,[\s\S]*?white-space:\s*nowrap/);
  assert.doesNotMatch(css, /--piece-cell/);
  assert.doesNotMatch(css, /\.bank-empty/);
  assert.doesNotMatch(css, /\.fallback\s*{[^}]*margin:\s*-/);
  assert.match(css, /\.square\.last-from, \.square\.last-to/);
  assert.match(css, /\.square\.in-check[^}]+radial-gradient/);
});

test('state tokens are defined in both themes and no decorative gradient remains', async () => {
  const css = await readFile(resolve(root, 'styles.css'), 'utf8');
  const block = (selector) => css.match(new RegExp(`${selector}\\s*{([^}]*)}`))?.[1] ?? '';
  const light = block(':root');
  const dark = block(':root\\[data-theme="dark"\\]');
  for (const token of ['--ok', '--warn', '--danger', '--sunk', '--hairline']) {
    assert.match(light, new RegExp(`${token}:#`), `${token} missing from the light theme`);
    assert.match(dark, new RegExp(`${token}:#`), `${token} missing from the dark theme`);
  }
  // body::before held the two radial-gradient blobs; the check wash is the only gradient left.
  assert.doesNotMatch(css, /body::before/);
  assert.doesNotMatch(css, /\.lobby-page::before/);
  assert.equal([...css.matchAll(/radial-gradient/g)].length, 1);
});

test('the rules dialog only ever opens from a button', async () => {
  for (const file of ['src/main.js', 'src/lobby.js']) {
    const source = await readFile(resolve(root, file), 'utf8');
    // A match that opens behind a modal is not the instant start we promise.
    assert.doesNotMatch(source, /^\s*rulesDialog\.showModal\(\)/m, `${file} auto-opens the rules`);
    assert.match(source, /data-open-rules/, `${file} lost the Rules button binding`);
  }
});

test('lobby and game are separate documents with rules and home navigation', async () => {
  const html = await readFile(resolve(root, 'index.html'), 'utf8');
  const game = await readFile(resolve(root, 'game.html'), 'utf8');
  const css = await readFile(resolve(root, 'styles.css'), 'utf8');
  assert.match(html, /<dialog[^>]+id="rules-dialog"/);
  // The rules dialog is four numbered rules, a worked board and the gotchas.
  assert.match(html, /Schness in four rules/);
  assert.equal([...html.matchAll(/<li><strong>/g)].length, 4);
  assert.match(html, /Two things that trip people up/);
  assert.match(html, /class="rules-confirm"[^>]*>Got it</);
  // Nothing opens the rules for you, so there is no "don't show this" to offer.
  assert.doesNotMatch(html, /id="rules-optout"/);
  assert.match(html, /class="dialog-grab"/);
  // The three rules are the lobby's pitch, and the bot is the primary action.
  assert.equal([...html.matchAll(/class="strip-number"/g)].length, 3);
  assert.match(html, /class="rules-full"[^>]*>Read the full rules</);
  assert.match(html, /id="play-bot" class="mode dark"/);
  assert.match(html, /id="play-online" class="mode"/);
  assert.match(css, /\.rules-dialog\[open\]\s*{\s*display:\s*flex/);
  assert.match(css, /\.dialog-body\s*{[\s\S]*?grid-template-columns:\s*180px minmax\(0, 1fr\)/);
  assert.match(css, /\.dialog-foot\s*{[\s\S]*?background:\s*var\(--sunk\)/);
  assert.match(css, /\.rules-strip\s*{[\s\S]*?gap:\s*1px;[\s\S]*?background:\s*var\(--line\)/);
  // Strength and clock are chosen before the match, on the lobby — folded away
  // behind a disclosure whose summary still names the pair you would play.
  assert.match(html, /<details class="setup">/);
  assert.match(html, /id="setup-summary"/);
  assert.doesNotMatch(html, /<details class="setup" open>/);
  assert.equal([...html.matchAll(/name="difficulty"/g)].length, 3);
  assert.match(html, /value="steady" checked/);
  assert.equal([...html.matchAll(/name="clock"/g)].length, 4);
  assert.match(html, /value="untimed" checked/);
  assert.match(css, /\.segmented\s*{[\s\S]*?grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/);
  assert.doesNotMatch(css, /\.rules-card/);
  assert.doesNotMatch(html, /id="board"/);
  assert.match(game, /id="board"/);
  assert.match(game, /id="turn-card"[^>]+aria-live="polite"/);
  assert.match(game, /id="turn-title"/);
  assert.match(game, /id="deselect"/);
  assert.match(game, /id="opponent-bank-label"[^>]*>Black reserve/);
  assert.match(game, /id="human-bank-label"[^>]*>Your reserve · tap to deploy</);
  assert.match(game, /class="player-dot"/);
  // The turn card replaced the bare status line.
  assert.doesNotMatch(game, /id="status"/);
  assert.match(css, /\.turn-card\s*{[\s\S]*?border-radius:\s*9px/);
  assert.match(css, /grid-template-columns:\s*minmax\(0,1fr\) 312px/);
  assert.match(css, /\.game-page \.play-area\s*{\s*display:\s*contents/);
  // Move list, last-move line and the Undo / Resign pair.
  assert.match(game, /id="moves-body"/);
  assert.match(game, /id="move-first"[^>]+aria-label="Back to the first move"/);
  assert.match(game, /id="last-move-text"/);
  assert.match(game, /id="undo"/);
  assert.match(game, /id="resign"/);
  assert.match(game, /id="review-card"[^>]+hidden/);
  // Keyboard play and the live region.
  assert.match(game, /id="board"[^>]*tabindex="0"/);
  assert.match(game, /id="announcement"[^>]+aria-live="polite"/);
  assert.match(game, /id="shortcuts-dialog"/);
  // Connection states: three cards plus the in-match strip.
  assert.match(game, /id="card-waiting"/);
  assert.match(game, /id="card-reconnect"/);
  assert.match(game, /id="card-expired"/);
  assert.match(game, /id="claim-win"[^>]*>Claim the win</);
  assert.match(game, /id="connection-strip"/);
  // The result card sits over the board, never over the screen.
  assert.match(game, /class="board-frame"/);
  assert.match(game, /id="result-overlay"[^>]+hidden/);
  assert.match(game, /id="result-headline"/);
  // Clocks in the player rows, and sound behind its own switch.
  assert.match(game, /id="human-clock"[^>]+hidden/);
  assert.match(game, /id="opponent-clock"[^>]+hidden/);
  assert.match(game, /id="sound-dialog"/);
  assert.equal([...game.matchAll(/data-cue="/g)].length, 5);
  assert.match(game, /data-open-sound/);
  assert.match(css, /\.clock\s*{[\s\S]*?font-variant-numeric:\s*tabular-nums/);
  assert.match(css, /\.clock\.is-low\s*{\s*font-weight:\s*600/);
  assert.match(css, /\.result-overlay\s*{[\s\S]*?background:\s*rgb\(24 32 28 \/ \.32\)/);
  assert.match(css, /\.result-card h2\s*{[\s\S]*?letter-spacing:\s*-\.045em/);
  // The one motion exception, inside the existing reduced-motion block.
  assert.match(css, /@media\(prefers-reduced-motion:no-preference\)\{[^@]*result-in 160ms/);
  assert.doesNotMatch(game, /id="network-note"/);
  assert.match(css, /\.network-card\s*{[\s\S]*?width:\s*min\(420px, 100%\)/);
  assert.match(css, /\.link-row\s*{[\s\S]*?padding:\s*6px 6px 6px 14px/);
  assert.match(css, /\.pulse i:nth-child\(2\)\s*{\s*opacity:\s*\.45/);
  assert.match(css, /\.progress i\s*{[\s\S]*?background:\s*var\(--warn\)/);
  assert.match(css, /\.connection-strip\.is-danger \.conn-dot/);
  assert.doesNotMatch(css, /\.network-note/);
  assert.match(css, /\.board\.keyboard-active \.square::before\s*{[\s\S]*?attr\(data-name\)/);
  assert.match(css, /\.game-page \.square\.is-cursor\s*{[\s\S]*?var\(--focus\)/);
  assert.match(css, /\.announcement:empty\s*{\s*display:\s*none/);
  assert.match(game, /@ marks a deployment from reserve/);
  assert.match(css, /\.moves-row\s*{[\s\S]*?grid-template-columns:\s*30px 1fr 1fr/);
  assert.match(css, /\.moves-head\s*{[\s\S]*?background:\s*var\(--sunk\)/);
  assert.match(css, /\.last-move\s*{[\s\S]*?background:\s*var\(--sunk\)/);
  assert.match(css, /\.play-area\.is-reviewing \.reserve\s*{[\s\S]*?opacity/);
  const history = await readFile(resolve(root, 'src/history.js'), 'utf8');
  assert.match(history, /resultingKey/);
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
  assert.match(game, /data-quick-message="Good move"/);
  assert.match(game, /id="offer-draw"[^>]+data-quick-action="draw"/);
  assert.match(css, /\.chat-own \.chat-bubble\s*{[\s\S]*?border-radius:\s*12px 12px 4px 12px/);
  assert.match(css, /\.chat-event\s*{[\s\S]*?border-radius:\s*999px/);
  assert.match(game, /id="voice-toggle"[^>]+aria-pressed="false"[^>]*>Audio off</);
  assert.match(game, /id="video-toggle"[^>]+aria-pressed="false"[^>]*>Video off</);
  const main = await readFile(resolve(root, 'src/main.js'), 'utf8');
  assert.match(main, /piece-\$\{piece\}/);
  assert.match(main, /function commit\(action\)/);
  assert.match(main, /takeback-request/);
  assert.match(main, /function offerDraw/);
  assert.match(main, /difficultyDepth\(botDifficulty\(\)\)/);
  assert.match(main, /soundBoard\.play/);
  const soundModule = await readFile(resolve(root, 'src/sound.js'), 'utf8');
  // The context is built in one place, and only once something plays.
  assert.equal([...soundModule.matchAll(/new AudioContextClass\(\)/g)].length, 1);
  assert.ok(soundModule.indexOf('new AudioContextClass()') > soundModule.indexOf('function ensureContext'));
  assert.match(main, /offered a draw · declined/);
  assert.match(main, /function onBoardKey/);
  assert.match(main, /announceOpponentAction/);
  assert.match(main, /createElement\('img'\)/);
  assert.match(main, /element\.draggable = false/);
  assert.match(main, /pieceRect:.*getBoundingClientRect/);
  assert.match(main, /ghost\.style\.width/);
  assert.match(main, /pointerdown/);
  assert.match(main, /elementFromPoint/);
  assert.match(main, /getUserMedia\(\{ audio: false, video: true \}\)/);
  assert.match(main, /function toggleChat/);
  assert.match(main, /network\.onRoomFull\(showRoomFull\)/);
  // A used or stale link is now the expired-link card, not a line of muted text.
  assert.match(main, /function showCard/);
  assert.match(main, /function renderConnection/);
  assert.match(main, /function flushOutbox/);
  assert.doesNotMatch(main, /networkNote/);
  assert.match(main, /mobileChatQuery/);
  assert.match(main, /unreadMessages/);
  assert.match(css, /\.drag-ghost\s*{/);
  assert.match(css, /transform:\s*translate\(-50%, -50%\)/);
  assert.match(css, /touch-action:\s*none/);
  assert.match(css, /\.game-page \.match-chat\s*{[\s\S]*?grid-column:\s*2;[\s\S]*?grid-row:\s*5;/);
  assert.match(css, /@media\(max-width:899px\)[\s\S]*?\.game-page \.match-chat\s*{[\s\S]*?position:\s*fixed/);
  assert.match(css, /\.game-page \.match-chat\.chat-collapsed/);
  assert.match(css, /max-height:\s*calc\(min\(82dvh, 42rem\) - 3\.2rem\)/);
  assert.doesNotMatch(html, />4 × 4 chess</);
});
