# Decisions

How Schness is built, and the choices that are load-bearing. Read this before changing anything —
several of the rules below look like arbitrary style and are not. Each one names why it exists and
what guards it, so you can tell the difference between a convention you may break and an invariant
you may not.

**This file is part of the work, not a report about it.** Anything that changes an entry here
changes this file in the same commit. See `CLAUDE.md`.

---

## The shape of the app

Static site, no build step, no server. Browser-native ES modules loaded directly by two HTML pages.
`npm test` runs `node --test`; there is nothing to compile.

All five pages use pinned, locally bundled Basecoat 1.0.2 Nova for control primitives.
`ui.css` maps its semantic tokens to Schness's existing light/dark palette and owns
shared control/surface styling; `styles.css` retains responsive game layout and
board/piece states. Native selects and dialogs keep existing behavior; no Basecoat
JavaScript runtime. Never apply `.btn` to board squares or reserve glyph buttons.
The audit and rollback scope are in `docs/ui-migration-audit-2026-09-13.md`.
Surface cards own their internal padding; do not rely on a parent panel's inset
when responsive layout can turn that parent into `display:contents`.

Three documents, deliberately separate:

- **`index.html` + `src/lobby.js`** — the lobby. Chooses a mode and a setup, then navigates away.
- **`game.html` + `src/main.js`** — one match. Everything about playing lives here.
- **`watch.html` + `src/watch-ui.js`** — an AI-vs-AI spectator. It keeps at most ten worker-computed
  moves ahead of the displayed position; advancing consumes one and triggers one replacement.

`src/` splits into three layers, and the split is the main thing to preserve:

| layer | modules | property |
|---|---|---|
| **Pure core** | `rules` `bot` `history` `notation` `game-message` `interaction` `keyboard` `clock` `matchmaking` `navigation` `chat` `settings` `communication` `drag` `theme` `watch` `arena` `puzzle` `training` `puzzle-settings` `tournament` `library` `qr` | No DOM, no network. Directly unit-tested. |
| **Transport** | `net` (+ vendored `trystero`) | WebRTC over public Nostr relays. |
| **DOM glue** | `main` `lobby` `lobby-board` `tutorial` `board-ui` `sound` `bot-worker` `analysis-worker` `analysis-ui` `watch-ui` `library-ui` `puzzle-ui` `i18n` | Touches the document. Thin by intention. |

Board squares, piece images, and reserve trays have one owner: `board-ui.js`. Game,
arena, tutorial, puzzle, and library callers supply their positions and interaction
callbacks but must not duplicate the board markup or SVG mapping. Search strengths
have one source of truth in `settings.js` (`AI_DEPTHS`); the arena and tournament use
the same depths as live bot play. Keep move-search and analysis worker entry points
separate so long mate proofs never block moves; both reuse the same `bot.js` search.

Training hints and replay advantage are opt-in and never shown in P2P games. The worker computes
exact forced mate against every legal reply using `puzzle` and `training` separately from a depth-three White-positive
`bot` heuristic. A timeout is *inconclusive*, never a proof that no mate exists. Every new position
terminates the previous analysis worker so stale results cannot overwrite the current board.
The proof runs for *both* sides from the actual side to move: an opponent threat means **all**
defender replies fail. On a human turn, candidate moves allowing an opponent mate in one or two
are also identified and displayed early; they are not mislabeled as an unavoidable forced threat.
The homepage launches `watch.html` for all standard bot play, so the controls must appear there,
not solely in the older `game.html?mode=bot` route. The online clock selector appears only during
online invitation creation; choosing a timed online match cannot silently time a subsequent bot match.
The B/W advantage rail uses one clipped outer radius and a square-edged inner fill:
rounding both exposes background seams on narrow screens. Its labels overlay the
ends rather than consuming track height; numeric estimates remain in the panel.

`bot` and `puzzle` are trusted search modules: both consume positions produced by the rules engine
and may use its unchecked move-generation/apply entry points inside their trees. Network, saved,
edited, and UI positions still enter through validating APIs; neither search module is an input boundary.

`main.js` is the exception at ~1500 lines and is the one place worth being careful in. It renders by
rebuilding: `render()` reruns on every state change and calls `replaceChildren()` on all sixteen
squares. **Anything that must survive a render cannot live inside a square.** That is not a style
preference — see the motion invariant below.

The bot runs in a Web Worker (`bot-worker.js`). Keep it there; a chess bot on the UI thread is how a
game starts dropping frames on camera. Measured at the hardest setting **with the CPU throttled 4×**,
which is the honest number for a mid-range phone: two long tasks during boot (~52ms each, before
first paint, nothing interactive yet) and none at all during play. First paint 148ms, DOM ready
225ms, 174KB over 37 requests, all throttled. Unthrottled there are none anywhere — that alone is
the figure this file used to quote, and it flattered the app.

Research tournaments are intentionally an Actions-only batch process. A complete set is 80 games:
all 16 king placements for Sharp–Sharp and for Sharp against each lower level in both colors. The
default 13 sets produce 1,040 games. Workers parallelize inside one job so the run exposes exactly
one final artifact instead of a collection of implementation-detail shard archives.
Every artifact records the played rules and exact AI profiles in its manifest, per-game records,
and analysis guide. Sharp v2 changes only equal-score tie-breaking: it prefers the least-repeated
immediate result, preserving a draw whenever every non-repeating alternative has a worse score.

The spectator buffer is deliberately rolling and bounded. It starts only after the user requests a
move, stays ten plies ahead when possible, and stops at a terminal result or when the page closes.
This hides normal search latency without turning every casual visit into a full background match.

---

## The rule people get wrong

**A captured piece goes to the reserve of the player who owned it — not the capturer's.**

```js
if (captured) next.banks[captured.owner].push(captured.piece);
```

Capturing hands material back to your opponent. That is the whole game: the board keeps refilling,
nothing is ever removed. It is also counter-intuitive enough that the rules dialog stated it
backwards for a long time while the lobby stated it correctly, on the same site.

`test/rules-copy.test.js` now plays a real capture through `applyAction`, asserts the victim's bank
grew and the capturer's did not, and only then checks the pages agree. If the engine ever changes,
that test tells you the prose needs rewriting too.

The capture animation states the same rule: the taken piece flies to **its owner's** tray, so your
capture visibly travels away from you. Sending it to the capturer would teach the wrong game, and a
test pins the destination to `victim.owner`.

---

## Invariants

Each is guarded. If you are about to break one, the test will tell you, and the reason is here.

### The service worker must let a deploy through

`sw.js` caches the whole shell and serves it cache-first. The cache only refreshes when `CACHE`
changes, because that is what makes the file differ and triggers a worker update.

- **Bump `CACHE` in the same commit as any change to a file listed in `SHELL`.** Six deploys once
  shipped to production and reached nobody, because `CACHE` sat unchanged and no update ever
  installed. Players kept a build that was hours old and there was no signal anywhere.
- **`CACHE` is the only cache-busting number.** There used to be 31 more: `styles.css?v=74` against
  `ui.css?v=84` against `rules-modal.js?v=84`, every file on its own hand-maintained count. Bumping
  one and forgetting another shipped a returning visitor new CSS against an old module — a bug that
  reproduces for nobody. They also quietly defeated the precache they sat beside: `SHELL` lists
  `./src/main.js`, the page asked for `./src/main.js?v=71`, and `caches.match` does not ignore the
  search string, so every module was fetched and stored a second time under its query string.
  **Do not reintroduce a `?v=`.** Guarded by `test/i18n.test.js`, and `test/shell.test.js` now also
  checks that every script and stylesheet a page loads is a path `SHELL` actually precaches.
- The fetch handler **revalidates in the background**, so a forgotten bump is late by one visit
  rather than invisible forever. Do not return it to plain `cached || fetch(...)`.
- **Only the lobby reloads itself** when a new worker takes over. The match page must never: a
  reload there throws away a game in progress.

Guarded by `test/shell.test.js`. Offline must keep working after any change here — the whole shell
is cached and a full bot game plays with no network.

### The relay list is append-only

`RELAYS` in `src/net.js`. Two players meet only on a relay they both dial, and trystero dials every
url in the list rather than a sample. Removing one strands anyone still running a cached older
build — and the service worker keeps old builds alive for a visit or two after a deploy.

Add freely; the pool is volunteer infrastructure and matchmaking survives until the last one stops
answering. Never cut. Guarded by `test/net.test.js`.

Relay failure is reported to the player: `relayReach()` counts open sockets, and the waiting card
says so after six seconds of grace. Trystero never surfaces a transport failure on its own, so
without that a dead pool looks exactly like a friend who has not clicked the link yet.

**The waiting card is one status line that rewrites itself in place.** `searchMessage(waited,
stalled)` in `src/matchmaking.js` is the whole schedule, pure and unit-tested: 0:00 listening, 0:20
nobody has opened it, 1:30 the link check and what cannot be ruled out — and a dead relay pool
outranks all three, at any point, because saying "nothing here can tell" over a stalled card
contradicts it. The card reserves the height of the longest message (measured at 390px, where the
line box is narrowest), so escalating never moves anything. It used to be a status row plus two
paragraphs that appeared underneath on failure, each carrying its own "Play the bot instead" button:
three buttons for one job, on a card that grew taller the worse things got. **The bot escape is now
in one fixed place from the first second** — a player who has to wait should never have to fail
first to find something to do.

**There is a second failure, and the app cannot see it at all.** The bundled trystero carries STUN
servers and **no TURN**, so a pair behind symmetric NAT — mobile carriers, plenty of office networks
— will never connect, however long they wait. Peers exchange nothing until WebRTC is up, so neither
side learns the other is even there: it looks like a friend who has not clicked, on relays that are
answering fine. A TURN server is the only real fix and it costs money and credentials, so what is
here instead is honesty: after 45 seconds the waiting card stops implying that patience is the
answer and names the possibility, with the bot as a way out. It does not claim to have detected
anything, because it has not. Never show it over the stalled card, which contradicts it.

### Motion is opt-out, and animates outside the rebuilt subtree

Everything that **moves** sits behind `prefers-reduced-motion: no-preference`. That includes
transforms added later — three have slipped past now: two hover transforms, and the puzzle shake,
which translated on a wrong answer with nothing gating it at all. Nothing in the `reduce` block
translates, scales or rotates, and `test/shell.test.js` now checks that as a rule over the whole
block rather than by naming the two it knew about. It also reads that block by balancing braces:
slicing to the end of the file made it quietly assert against rules that are not in the block.

Every indicator that means "something is happening" animates, in that gated block: the waiting dots,
the reconnect bar, the turn dot while a move is in flight, and the dot beside whoever is on move.
The result overlay is in there too — the veil fades and the card rises, because the end of a match
is the one moment in a game worth a beat. It hangs off `:not([hidden])`, so it plays on the frame
the overlay appears and not again on every render after.
The waiting dots bounce — `translateY(-5px) scale(1.15)` on 6px dots. They were reported as static
three separate times while the rule was present and correct, because a 5px dot rising 1.4px reads as
nothing at a glance; the amplitude is the feature, not a detail to tune down.

Under `reduce` those dots keep animating, but **only their opacity** — a cross-fade carries no
vestibular risk and is the substitution Apple's own guidance names. Reduced motion means no
movement, not a dead indicator on the one card whose entire job is to say "still listening". They
are hidden outright once no relay answers, so nothing implies progress on a search that has stalled.

Verified in Chromium under both settings by sampling computed `opacity` and `transform` over ~1.1s:
nine distinct transforms under `no-preference`, exactly one under `reduce`. A rule in the sheet is
not proof the indicator moves.

The turn dot hangs off **`is-pending`, not `is-waiting`** — `is-waiting` is also true at checkmate,
at a draw and after a resignation, and a finished game must not sit there pulsing as though a move
is coming. For the same reason `matchOver()` decides `active-player`: checking only `getResult` left
the on-move marker lit after a resignation or a lost opponent, which was invisible while the marker
was a still dot and wrong the moment it started to pulse.

Both board animations fly **a copy** parked on `.board-frame`; the move also hides the real piece
with a class on its **square**. Animating the piece element itself does not work: renders come thick and
fast — the bot starting to think triggers one — and the next render throws the element away
mid-flight. It looks like it works (the class appears, `animate()` returns an object) and nothing
moves. Guarded by `test/shell.test.js`.

### Both pages carry a Content-Security-Policy

GitHub Pages cannot set headers, so it is a `<meta http-equiv>` on `index.html` and `game.html`, and
the two must agree. `default-src 'self'` with `connect-src 'self' wss:` for the relays (a scheme, not
hostnames — the relay list is append-only), `worker-src 'self'` for the bot, `media-src` for peer
streams, no `unsafe-inline` anywhere. The app never needed inline anything: there is no `innerHTML`,
no inline `<script>`, no inline handler, and `test/security.test.js` fails the moment one appears.

Verified in Chromium: a bot game plays under it with the service worker active and the module worker
answering, the lobby and the waiting card render, and the console reports no violation. **The online
path is verified by the spec, not by a match** — WebSockets are governed by `connect-src`, WebRTC by
nothing in CSP — because this sandbox cannot reach a relay. If online play ever fails with a CSP
message in the console, that is the first place to look.

### The board is bounded by the window, not just its width

`.board` is a square sized by width. On a short window that made it taller than the screen — a phone
in landscape showed a rank and a half and hid the player's own king. The frame caps by `100svh` too,
and landscape below 620px tall puts the board in its own column with the panels beside it.

**Do not add `orientation` to the manifest.** Landscape is a supported layout. Guarded by
`test/shell.test.js`.

### Contrast and tap targets are measured, not eyeballed

`test/contrast.test.js` reads the tokens out of the stylesheet and checks every ink against every
surface in both themes, with a floor at **4.6** rather than 4.5. The floor is deliberate: `--muted`
once sat at 4.4954:1, printed as "4.50" in any two-decimal report, and failed while looking like it
passed.

`--accent` is the fill for dots, rings and selection; **`--accent-text` is the one for text**,
because a fill colour bright enough to read as a dot rarely clears 4.5:1 as type. The accent is ember
(`#B23E18` light, `#F0794C` dark) and it clears 4.5:1 as type in both themes, so `--accent-text` is
currently the same value. **The split stays** — the next accent may not clear it, and the tests read
the two separately. The plum before it was chosen to sit opposite the sage board and did, but it
appeared on four pixels of the whole product: a logo dot and one "Try it" link.

**`--focus` is `var(--accent)`, not a colour of its own.** It was `#2563eb`, which related to nothing
else in the file and disappeared against a moss square — and keyboard play is a first-class path in a
board game. `--danger` moved to crimson (`#9E2233` / `#FF8D9B`) so it stays tellable apart from an
ember that is now also the focus ring; `--warn` stays amber.

**Never hardcode the accent.** Tints go through `color-mix(in srgb, var(--accent) N%, transparent)`.
Six `rgb(228 91 53 / …)` literals were baked into rings and shadows, so dark mode drew the light
theme's colour and nobody noticed while both themes were orange — the moment the hue changed it
would have been glaring. Guarded by `test/contrast.test.js`.

### A library card leads with a colour and a shape

1,099 cards that all said "Threefold draw" in the same size and weight are text, not information.
Each card now leads with a **result swatch** and the **final position**, drawn with the shared board
at about 13px a square — the size at which you read the *shape* of a position rather than identify
the pieces, which is the right thing to optimise. The check and checkmate chips are suppressed at
that size; the tinted square still carries it.

`sortGames` is stable, so "as recorded" keeps the order the archive gives it. Filters already
existed; sort did not, so the whole archive could only be read in the order it happened to be
recorded.

The final position is replayed once per game through `applyAction` and remembered, because filtering
and sorting redraw the same cards. Measured in Chromium: re-sorting and redrawing 60 cards takes
~53ms, and adding 60 more ~75ms.

Matchups wrap rather than truncating: "Sharp v2 vs Learni…" is not a matchup.

### The arena asks one question per decision

- **One seat control.** "You play: White / Black / Neither" — and a strength select for each side that
  actually has a bot on it. There used to be three controls answering the same question: a "Play as"
  select plus a White seat select plus a Black seat select.
- **The turn status sits above the board**, where the eyes already are, in a bordered card with an
  ember left edge — the one thing on that page asking for attention.
- **Replay is split from setup.** One primary (New game), a transport group (first / prev / next /
  last / Live), then a quiet list: edit, branch, pause. It was a flat row of seven equal-weight
  buttons, two of which wrapped to two lines, with only disabled-dimming to suggest hierarchy.
  Training tools fold into that quiet list.
- **The transcript is numbered, paired and tabular**, in `--font-mono` with the current ply marked.
  It was a flat run of ghost buttons, one per ply.
- "Live position" is **Live**; "Continue from here" is **Branch from here**. Both hold their Japanese
  labels on one line at 390px.

### The connection states say what is happening and offer a way out

These are the only screens in Schness where nothing is happening and the player cannot do anything
about it, which makes them the ones most worth getting right.

- **Waiting** — the link is the hero, and Copy is the only primary on the card. A **QR code** of the
  invite sits under it: peer-to-peer usually means the other player is in the same room on a phone,
  and copying a URL from a laptop to a phone is the worst step in this flow. `src/qr.js` is a
  dependency-free encoder (byte mode, level M, versions 1–10) whose output was checked
  module-for-module against an independent implementation; `test/qr.test.js` carries two golden
  matrices from that comparison. The code is **always dark on light**, in both themes — a themed
  code is one that does not scan. **No camera has read one**; nothing in this sandbox has one.
- **Reconnect** — the countdown is the hero at 38px mono, and **"Claim the win" is drawn disabled
  until 0:00** with a note saying when it unlocks. The rule is already that the opponent gets the
  countdown; a live button that silently refuses, and one that lets you claim early, both misstate
  it.
- **Expired** — gained a primary action. It was a dead end with nothing to do but go back.
- **Connected** — a state that did not exist. The card used to simply vanish, with nothing confirming
  *who* had arrived. One rung, held briefly, naming the opponent and whose move it is.

**Disabled is drawn, not dimmed.** `opacity: .45` on a coloured button produces a different colour on
every background it happens to sit on.

### The rules dialog opens at the top, with the board it is teaching whole

The first thing a new visitor saw was the dialog handed over scrolled to the middle of itself: rule
2's heading clipped at the top edge and the demo board cut off at the bottom. The rules themselves
were good; the first impression was half a sentence.

- Opening a lesson scrolls the body to `0`, not to the demo's offset.
- The demo board is sized by the height the dialog actually has —
  `min(100%, 22rem, calc(100svh - 25rem))` — and **measured** in Chromium at 1440×900, 1280×720,
  1440×1200 and 390×844: the board's top and bottom both sit inside the scrolling body on open. A
  rule that looks like it fits is not proof that it does.
- Four rules, four "try it" affordances. Rule 1 states a fact, so its lesson is the fact: both kings
  on named squares, and a move that shows which way each side travels. Square names appear for that
  lesson and on the demo board only — the site-wide coordinate preference stays beside move lists,
  which is where following notation actually happens.
- The footer says where the dialog lives, so closing it is not a one-way door: "You can reopen this
  from **Rules** in the header at any time", then Skip and Start playing.
- **On a phone the rules come first and the board is a scroll away.** There is no width for both,
  and `order: 1` on `.rules-list` — a leftover from the layout where a static figure came last —
  meant a dialog called "Schness in four rules" opened showing none of them.

### The home page is a board, not a picture of one

Landing on schness.com means you are already playing: place your king on rank 1 and the game runs.
A 4×4 game has no setup worth a click, and the lobby's job is to start one, not to describe one.

`src/lobby-board.js` owns no rules and no search. Legality comes from `rules.js` through the same
`interaction.js` helpers every other surface uses, and Black is the same `bot-worker.js` the match
page runs — **do not write a second rules or bot implementation for the home page**; that is how two
surfaces quietly start playing different games.

The Bot arena card inherits whatever is on that board, through the same
`sessionStorage['schness-arena-position']` handoff the library replay uses. That is what makes "take
this position further" a true sentence. Without JavaScript the card is still a plain link to the
arena.

**At phone width the board is `display: none`, on purpose.** It is not a label being hidden from the
screen — the feature genuinely is not there, because at 390px it pushes the four actions below the
fold and the mobile home has to stay a menu.

The four destinations are one primary card and three quiet ones in a single bordered group. The
arrow affordance is back: `.mode::after` had existed for a long time and was switched off by
`.lobby-page .mode::after{display:none}` on the one page that needs it, so the cards did not look
pressable. Subtitles are weight 400 — they inherited 640 from `.btn`, so a title and its supporting
line carried identical emphasis and the eye had nowhere to land.

### Destinations are links, and the header is one row in one order

**Every page-to-page destination is an `<a href>`.** The only one on the whole site used to be
`./watch.html`; `library.html`, `puzzles.html` and `game.html` were reached through
`window.location.assign()` in `src/lobby.js`, so there was no cmd-click, no middle-click, no
copy-link-address, no hover preview, screen readers announced "button" where a link belonged, and
nothing crawled past the lobby. `#play-online` stays a `<button>`: it opens a dialog, and it is the
one control that has to go dead when the browser goes offline.

One `<nav>`, the same three destinations, on all five pages. Land on the library and there is a way
onward that is not the back button.

**Header order is brand · page controls · rule · language, everywhere.** It was language · theme ·
Rules on the lobby and Rules · language · theme on the arena and the library, so muscle memory broke
on every navigation. The language switch sits after a hairline rule because it is a different kind of
decision from the two page controls. `src/i18n.js` appends its button rather than inserting it before
the theme toggle, which is what produced the second order.

**The wordmark never shrinks.** `header` was a nowrap flex row where `.brand` was `flex: 0 1 auto`
and `.header-actions` was `flex: 0 0 auto`, so at 390px the nav won the row and the brand collapsed
to **zero width** — it did not truncate, it disappeared, and a phone rule then deleted it outright
below 480px. The brand is `flex: 0 0 auto` now; below 760px the nav takes a row of its own instead.
Measured in Chromium at 1440, 390, 360 and 320px in both languages, because the sheet said
`flex: 0 1 auto` and that reads as fine.

On the match page at phone width the nav is **clipped, not removed** — same mechanism as the reserve
labels and the toast beside it. A match is the one screen where leaving is not the job, and every row
above the board costs it the axis that is already scarce.

**The page title is the `h1`; the brand is a link.** Every page's `h1` was "Schness", with the real
title as an `h2`, so heading navigation announced the site name five times and never the page. The
match page's `h1` is read but not shown: the board is the page, and a visible title would cost it a
row on a phone.

### The board is one object, drawn one way

A 6px `--ink` frame, a `--radius-card` corner, and no shadow — on the game page, in the arena, in a
replay, in a puzzle and inside the rules dialog. It was drawn two ways: an 8px frame, `.65rem` and a
two-layer shadow on `.board`, against a 1px hairline, `.3rem` and none on `.game-page .board`. It is
the most identifying object on the site, so the board in the dialog that teaches the game and the
board you play on cannot look like they come from different products.

`--board-light` / `--board-dark` are the board, full stop. Five page classes used to override them to
a grey `#dde2de` / `#7f9286` pair 2.5:1 apart, so the token in `:root` described a board that never
shipped and the one that did read as a placeholder. They are 4.0:1 and 4.2:1 apart now.

Square states are drawn on top of the board, never by repainting it: selected is an inset ring,
a legal move is a centre dot, a capture is an ember ring, a drop target is a dashed ember outline.
Check tints the square and adds a chip. `test/shell.test.js` fails if any page restates the frame.

Pieces are `<img>` at **82%** of the square and cast no resting shadow — the artwork carries its own
outline. The Georgia/Unicode glyph path that preceded the SVGs was still in the sheet, with font
sizes, `--piece-color` and four-way `text-shadow` outlines that drew nothing at all. The set is
Chessnut, unmodified, and `THIRD_PARTY_NOTICES.md` says why that is a decision rather than an
oversight.

### The mark is the rule, drawn

One path and one rect: the board with a 2×2 corner missing, and that block sitting outside it.
Material leaves the board and comes straight back — the one rule Schness has that no other chess
variant does — and it is the only thing in the product that says so without words.

- **No letterform.** It was an Arial "S" in a rounded tile, so the installed PWA icon was whatever
  the OS decided Arial was. The tile only existed to give an edge to a letterform; the mark has its
  own, so **it never goes back inside a tile**.
- **The chip stays outside the board.** Tucking it into the notch to save space deletes the point.
- **No checkerboard inside the frame** — squares turn to mush below 32px.
- **The header and the favicon are the same two colours.** They used to disagree: a `#e96f4b` dot
  beside a `#7d3f6d` accent. The header mark is inline SVG using `var(--ink)` and `var(--accent)`;
  `icon.svg` carries the same two hexes as presentation attributes, with a `prefers-color-scheme`
  block that only swaps them so an ink board does not vanish on a dark browser tab.
  `test/i18n.test.js` reads the hexes out of `icon.svg` and checks they are the tokens.
- Rendered and read at 96, 48, 32 and 16px in Chromium: the 4-unit gap survives at 16px because the
  chip is offset diagonally from the notch corner, so the dedicated 16px asset the brief allowed for
  is not needed. **Not checked on a non-retina display** — nothing here can.

### The scale is three radii, two elevations and two weights

Seventeen radii and thirty-one shadows is not a scale, it is a history: every decision ever made was
still in the sheet, and later rules switched earlier ones off rather than replacing them.

- **Radii:** `--radius-control` 6px, `--radius-card` 10px, `--radius-dialog` 16px, plus
  `--radius-pill` for pills and `50%` for dots. Nothing else.
- **Elevation:** `--shadow-dialog` for a dialog or a floating panel, `--shadow-lift` (a
  `drop-shadow()` filter) for a piece in flight. **Everything at rest gets a hairline border and no
  shadow.** A ring is an `outline`, never a `0 0 0 Npx` box-shadow — those read as elevation in any
  count of the sheet and behave differently under a border radius.
- **Weights:** 400 for anything you read, 640 for the things that label it. A third weight is a
  decision nobody made on purpose.
- **Type:** one `--font-sans` stack with the Japanese faces *appended*, never swapped in. `Inter` was
  named first and never loaded — there is no `@font-face` and the CSP blocks a CDN — so it only ever
  flattered a mockup, while a `[lang="ja"]` rule replaced the whole stack and rendered "Sharp v2" and
  "3+2" in a different face from the English site. Notation, clocks and ply counts use `--font-mono`
  with `tabular-nums`.

Guarded by `test/design-tokens.test.js`, which reads every `border-radius`, `box-shadow` and
`font-weight` in both sheets rather than naming selectors.

Everything tappable is ≥44px tall on a phone. Before that rule the header buttons were 33px and the
Moves toggle was 43×14. A second round came from measuring in a browser rather than reading the
sheet: Copy on the invite card was 31px, its link field 14, Cancel 37, and a reserve tile 38 on a
320px phone. `test/shell.test.js` can only name selectors, so **it will not catch the next one** —
measure computed heights in Chromium when you add a control. Reserve tiles may shrink in width on a
short screen to buy the board height; the target height is not negotiable.

### The board is a grid all the way down

`#board` is `role="grid"`, so it holds four `role="row"` elements holding four `role="gridcell"`
buttons each. It was sixteen bare buttons under the grid role for a long time — a critical axe
violation, and a screen reader got no row or column position out of it. `aria-activedescendant`
needs the composite role, so dropping `role="grid"` was not the way out.

The rows are **real layout elements**, `display: grid` with four columns inside a four-row board.
`display: contents` would have been the smaller diff and browsers have dropped such elements from
the accessibility tree — the exact class of change that passes a source check and helps nobody.

The consequence to know: the checkerboard cannot use a flat `nth-child(8n+…)` run any more. It is
`.board-row:nth-child(odd) .square:nth-child(even)` and its mirror. Get that wrong and the board
paints plain, so a test pins both. Verified in Chromium: sixteen equal cells in four rows, the same
eight squares dark as before, and the accessibility tree reporting grid → row → gridcell.

### Hide from the screen, not from the accessibility tree

The phone layout clips redundant labels (`position:absolute` + `clip`) rather than `display:none`.
The reserve banks are named through `aria-labelledby` on those labels, and the toast is the
`role="status"` live region that announces the opponent's move. Guarded by `test/shell.test.js`.

### Nothing opens the rules for you

The rules dialog opens from the Rules button and nowhere else. It used to open modally over the
board the first time you played, which contradicted "starts instantly" and left the board
unclickable.

**It was doing it again.** The auto-open moved out of `lobby.js` and into `rules-modal.js` as
`initTutorial({ autoStart: document.body.classList.contains('lobby-page') })`, and the test that
guards this named two files by hand, so it went on passing while the lobby opened the dialog on
every first visit. Now that the lobby has a real board, that dialog covered a game that had already
started. `autoStart` defaults to `false` and the test reads `rules-modal.js` and `tutorial.js` too.
First-run guidance is the board itself, the turn line under it, and Rules in the header.

### The clock is one clock, kept by two players

`main.js` `chargeClock`, `src/clock.js` `adoptReport`. Whoever just moved is charged, on both screens,
for the time since the clock last changed hands; and the move itself carries the mover's own account
of both clocks (`clock` on the action message), which the receiver adopts for the mover's side only,
capped at its own view plus `SYNC_TOLERANCE` (3s). Each side is the authority on its own time — it
alone knows when it pressed the clock — and the cap is what a lying peer is limited to gaining per
move. A message without the field (an older cached build) or with a malformed one leaves the local
view alone, so mixed builds still play.

A flag is a message too. Your own clock reaching zero is yours to call, at once, and it is sent as
`control { kind: 'flag', side }`. The opponent's clock on your screen runs one network trip behind
theirs, so their screen calls it first; yours calls it only after the tolerance, as the fallback for a
peer that never does. A claim that *you* flagged is checked against your own clock before it is
believed. A move that arrives after the match has ended is ignored rather than applied over it.

Both king placements are timed, on both screens. The clock stops only when the match is over.

Before this the receiving side charged nobody: `receivePeerAction` never touched the clock, so each
player's own clock paid for both sides' thinking between their own moves, and the opponent's clock on
screen jumped back up on every move. The earlier note in this file that the two sides "drift by
one-way latency per move" understated it. Guarded by `test/clock.test.js`, which replays the protocol
over eighty plies at 250ms latency and asserts the two views never part by more than the tolerance,
and by `test/shell.test.js`. **Not verified with two real peers** — nothing in this sandbox can be.

### The end of a match is announced by focus, not by the toast

When the overlay arrives, focus moves to `.result-card` — `tabindex="-1"`, named by its headline and
described by its detail — so a screen reader reads the ending out. Only on the frame it arrives:
`renderResult` runs on every render, and a card that grabs focus each time is worse than one that
never does.

It is deliberately **not** `announce()`. The live region is a visible pill on a wide screen, so
routing the ending through it would print those two sentences a second time — see "the outcome is
stated once". Before this, an ending that no opponent move delivered (you resigning, or you being
the one who mates) was announced by nothing at all and left focus on a square the overlay had just
covered and disabled. `announceOpponentAction` only ever covered the other half.

### The turn card does not move the board

Its copy ranges from a wrapped king-placement instruction to the two words “Your turn”. The detail
line is hidden when there is nothing useful to add, but the card reserves the height of the longest
normal state so that change does not pull the board up and down. The mobile minimum is smaller than
the desktop one because its unframed treatment has less padding. Both keep explicit space below the
card. The review card is excluded: it is a different component that replaces the turn status.

Guarded by `test/shell.test.js`.

### The turn card says what is true now

It carries state, not standing instructions. It used to repeat the rules of the game every single
turn while a toast and the Moves line said the same thing beside it. It shows contextual detail —
king placement, being in check, what is selected — and nothing when there is nothing to add. When
the result overlay is up it is hidden entirely, or the ending is printed twice.

### The call never outranks the game

The rail is a place to talk during a match, not a video app with a board in it.

- **Text chat is on from the first move; mic and camera are off until pressed.** A match must never
  open with a live microphone. `test/shell.test.js` reads the markup for both toggles, and a
  Playwright check stubs `getUserMedia` and asserts it is not called on load, in either mode.
- **Permission is asked once, when the button is pressed, and the reason is on screen before the
  browser prompt appears** — `explainMedia()` paints `MEDIA_REASONS[kind]` and waits two frames,
  which is well inside the transient activation the gesture grants. A permission dialog with no
  reason in front of it is a dialog people decline.
- **An "On air" badge whenever you are sending**, in the rail and in the tab title. The tab you are
  not looking at is exactly where "am I still being heard?" comes up. `onAirTitle` is idempotent, so
  rewriting it on every change never stacks.
- **The interface says it is peer-to-peer**, and would say the opposite just as plainly.
  `connectionReport()` in `net.js` reads the selected candidate pair off the real peer connection —
  relayed or not, and the round-trip time. **The bundled configuration carries STUN and no TURN, so
  `relayed` cannot currently be true**; the branch exists because adding a TURN server later should
  not also require remembering to make the strip honest.
- **Degrade in order: video, then audio, never the clock.** `nextDegradation()` is pure and tested;
  a test also checks that nothing in that path touches the clock.
- **Focus mode** collapses the rail to one bar — presence, connection, unread count. On a phone it is
  the default, because the board keeps the screen.

**None of this has run between two real peers.** Chat, voice and the connection report all need a
network this sandbox cannot reach.

### Chat belongs to a match, not to a mode

`mode` is already `'online'` from the moment the invite card goes up, so anything keyed off it alone
is also true in the waiting room. `matchChat.hidden = mode !== 'online'` put a chat panel — a "Chat"
button, on a phone — on the waiting screen on any render that happened to run there, which is why it
appeared intermittently rather than always: nothing renders on that screen until something makes it.
Crossing the 899px chat breakpoint was enough.

There is one predicate now, `chatAvailable()`, and it requires `network?.matched`. Both the panel's
visibility and `canTextChat()` go through it. Guarded by `test/shell.test.js`.

---

## The search, and why the engine has two of some functions

A 30-ply self-play at the hardest depth took **43.6 seconds** and one single move took **11.2** — on
a server CPU, so several times that on a phone, behind nothing but a pulsing dot. It also got worse
the longer a game ran. It is 10.1 seconds now, and the worst move 3.6, with the late game 8.9×
faster than it was. None of it changed how the bot plays.

Three things were wrong, all of them in the hottest loop in the app:

1. **The search re-validated its own moves.** `applyAction` re-derives the whole legal move list and
   string-matches the action against it. That is exactly right for a move arriving from a peer — the
   list is the security boundary there — and pure waste one line after the search generated the move
   itself. Hence `applyLegalAction`, and `legalActionsUnchecked` for the same reason on
   `validatePosition`. **Only the bot may use either** — `test/decisions.test.js` fails if any other
   module so much as names them, because a comment is not a guard and the next agent reaching for
   something faster on the network path would find exactly these.
2. **The repetition map was copied per candidate move.** It grows by one entry every ply, so cloning
   it thirty-odd times per node made the bot slower the longer the game ran — for a map the legality
   filter never reads. This step was then made redundant by step 3, which removed those clones
   altogether, and the "share it when the copy is a throwaway" path it introduced was dead code
   until it was deleted. **What remains: `applyLegalAction` still copies the map once per node**, so
   the search still slows as a game lengthens — measured at 1.9× the time with a 150-entry map
   against an empty one, at depth 4. The Log line that said it no longer degrades was wrong.
3. **Legality cloned an entire position to ask a question about the board.** It is `boardAfter` plus
   `boardInCheck` now — one `slice` of the board. That is safe because **occupants are frozen shared
   values**: exactly eight exist (`occupantOf`), every board points at them, and a write throws.
   It was a comment ("occupants are replaced, never mutated, everywhere in this engine") first; the
   comment was true and unenforced, and enforcing it also let `clonePosition` stop spreading sixteen
   objects per node, which is another 1.2× on the search. `test/rules.test.js` pins the identity
   sharing and the throw. `attacksSquare` answers on the first hit instead of building an array to
   call `.includes` on it.

**How this was made safe, and how to make the next one safe.** Every step was checked two ways: an
equivalence harness comparing the live engine against a frozen copy over 21,215 positions from 400
seeded games (zero mismatches), and a fingerprint of the 30 moves a self-play chooses, which did not
move once across all three changes. `test/rules.test.js` now carries the durable half of that: perft
counts to depth 4 (4 / 16 / 558 / 17,896) and a test that the unguarded shortcuts agree with the
guarded entry points to depth 3. **Nothing else in the suite would catch an engine that quietly
plays a different game.** If you change the rules on purpose, recompute the perft numbers and say so
here.

The perft numbers were later recounted by an implementation written from the rules dialog alone,
without reference to `rules.js`, and agree through depth 5 (457,568). So they pin what the dialog
says, not merely what the engine did.

**The transposition table stores bounds correctly.** A node cut off by alpha-beta has produced an
upper or lower bound, not necessarily an exact value. Cache entries therefore carry `exact`,
`lower`, or `upper`; a lookup tightens the current search window and returns immediately only
when the entry is exact or closes that window. The old table treated every cutoff as exact, which
changed the chosen depth-4 move in sampled positions. `chooseAction(..., { useCache: false })`
provides a slow reference path, and `test/bot.test.js` checks cached and uncached search agree.

## Testing

Pure modules get real unit tests. DOM behaviour that cannot be unit-tested is guarded by asserting
against the source or the stylesheet — blunt, but it catches the specific regression it names, and
each such test says which failure it is protecting against.

Desktop and mobile Playwright stories run in CI, including the UI migration's
language/theme overflow and tap-target checks. **A class appearing is not proof a thing works** — the piece
animation passed that bar while doing nothing at all. Measure the effect, not the trigger.

---

## Deploying

`master` → GitHub Actions → GitHub Pages → `schness.com` (see `CNAME`; DNS points at Pages' anycast
IPs). A Netlify site is also linked to the repo from Netlify's dashboard — it adds three neutral
checks to every PR and serves nothing anyone visits. There is no Netlify config in the repo.

---

## Known gaps

Honest list of what is not done and what cannot be checked from a sandbox:

- **There is no TURN server, so some pairs can never connect.** Not a bug to fix in this repo — it
  needs infrastructure. It is the largest single limit on "invite a friend" actually working, and
  nobody has measured how often it bites, because that needs real peers on real networks.
- **Relay liveness is unverified.** The ten relays are taken on trystero's authority. Prune dead
  ones from the *end* of the list only, and only after checking with real network access.
- **The reconnect, expired and room-full cards have never been reached.** They have now been forced
  visible in Chromium and read at a phone size, so the layout and copy are known good; the paths
  that raise them still need two real peers on live relays.
- **Chat and voice are untested** for the same reason.
- **No real device has run this.** Every layout judgement is Chromium at a phone viewport.
- **Install behaviour is structural only** — whether iOS launches standalone and whether Android
  shows the rich install dialog both need hardware.
- **Sound design.** There are cues and they are off until asked for, but nothing here is composed;
  it is the largest remaining gap in game feel and it cannot be judged from a sandbox.
- **The online clock has never run between two real peers.** The protocol is in "The clock is one
  clock" and is exercised by a replay in the suite; a real match on a real network is what would
  confirm it.
- **A takeback does not refund clock time**, on purpose. It restarts the mover's clock at the moment
  of the takeback.
- **Sharp v2 repetition behavior needs measurement.** Sharp v1 drew 187 of 208 full-tournament
  self-play games, so v2 now breaks equal-score ties toward the least-repeated immediate result.
  Tournament run 2 must establish whether this reduces repetition without converting draws into
  losses. A general contempt score remains deliberately unimplemented.

---

## Log

Newest first. One line per decision that changed how the app behaves.

- The lobby's rule strip, setup disclosure, strength radios, settings dialog, the `.mini-board`, the
  hidden rules figure and `initSettings` are gone from the sheet and the markup, not just switched
  off; the reduced-motion block is now checked as a rule rather than as a list of two.

- One cache-busting number, `CACHE`: the 31 hand-maintained `?v=` strings are gone, and removing
  them made the module precache work for the first time.

- Library cards lead with a result swatch and the final position, and the archive can be sorted.

- The arena asks one seat question, puts the turn status above the board, splits replay from setup,
  and keeps a transcript you can read.

- The match rail: chat from the first move, mic and camera off until pressed with the reason stated
  before the prompt, an "On air" badge in the rail and the tab title, the link described honestly,
  degradation in the order video → audio → never the clock, and a focus mode.

- The three connection cards rebuilt, with a QR of the invite, one escalating status line that
  cannot change the card's height, a success rung that did not exist, and a forfeit claim that is
  disabled until it is actually claimable.

- The rules dialog opens at the top with its demo board whole, measured rather than eyeballed, and
  rule 1 gained the affordance the other three had.

- The lobby is a playable board above four cards, with a footer; the rules stopped opening
  themselves, which they had quietly resumed doing through `rules-modal.js`.

- Real links everywhere, one `<nav>`, one header order, a wordmark that cannot vanish, and an `h1`
  that names the page rather than the site.

- One board: a 6px ink frame and the real two-tone palette everywhere, square states drawn on top
  rather than by repainting, pieces at 82%, and the dead Unicode glyph path removed.

- The mark is the board with its corner missing and that block outside it — no letterform, no tile,
  and the favicon and the header finally agree on two colours.

- One token system: ember accent doubling as the focus ring, three radii, two elevations, two
  weights, one font stack with the Japanese faces appended. `docs/DESIGN-PASS.md` is the brief.

- Sharp v2 avoids repetition only as an equal-score tie-break, and tournament schema 2 records the
  rules plus exact AI profiles; experiments and rejected alternatives live in `DEVLOG.md`.

- The turn card reserves a responsive height and bottom margin, so changing copy cannot move the board.

- Alpha-beta transposition entries distinguish exact values from upper and lower bounds; the cached
  search is checked against an uncached reference path.

- A move carries the mover's clocks and the receiver adopts them within a tolerance; a flag is a
  message; both king placements are timed. The receiving side used to charge nobody.
- A time loss is reported as a time loss, not a resignation; the clock stops when the opponent
  drops; a takeback restarts the mover's clock and the bot worker; both pages carry a CSP.
- Occupants are frozen shared values, which enforces what step 3 of the search work assumed and
  takes another fifth off the search.
- A wait that has gone on too long says what it cannot rule out, instead of implying patience.
- The bot search is 4.3× faster; move generation is pinned by perft counts. (It still slows as a
  game lengthens — see "The search".)
- The end of a match arrives — the veil fades, the card rises — instead of being there on the next
  frame.
- The board exposes real rows and cells, and the rules dialog scrolls from a keyboard.
- Every control on the invite card, and reserve tiles on a small phone, reach the 44px target.
- The chat panel waits for a second player instead of for online mode, so it stops appearing in the
  waiting room.
- The waiting dots bounce far enough to be seen, and cross-fade instead of freezing under reduced
  motion.
- The accent moved from orange to plum, and accent tints stopped being hardcoded.
- Every activity indicator animates, including a loader for "Bot is thinking", which had none.
- The waiting dots and reconnect bar animate; the invite card no longer touches the action row.
- A captured piece flies to its owner's reserve, teaching the rule the dialog used to get backwards.
- Manifest gains screenshots, shortcuts and `id`; iOS standalone metas added; the lobby offers
  installation in place, only while there is a prompt to accept.
- Service worker revalidates and `CACHE` is bumped per shell change; the lobby self-reloads once on
  worker change.
- The capture rule in both rules dialogs corrected to match the engine.
- Pieces animate between squares, via a copy outside the rebuilt subtree.
- Home-screen icons: apple-touch PNG, and a maskable icon with its own safe zone.
- `--accent-text` split from `--accent`; `--muted` darkened; contrast measured in the suite.
- Open Graph cards on both pages, worded per page; theme-color matched to the real background.
- Relay pool widened to ten and made append-only; a dead pool is now reported to the player.
- Board capped by viewport height; landscape gets a two-column layout.
- Phone chrome trimmed to give the board the screen; tap targets raised to 44px.
- Lobby setup folded behind a disclosure; the rules dialog stopped opening itself.

Shared card padding is 20px on desktop and 16px on small phones; selectors must
beat nested legacy panel rules. Chessboard and reserve geometry are excluded.

Homepage rule-strip gaps are 1px: its background supplies hairline dividers, not
spacing. Increasing its gap exposes broad brown bands between the tutorial cards.

An advantage rail is unknown while a new estimate is pending or unavailable: hide
its fill, clear numeric ARIA state, and discard cancelled worker replies. Tutorial
links use `--link`, mapped to the contrast-tested `--accent-text` theme token.


The homepage tutorial list owns the divider before its adjacent playable demo;
the demo must not add a second top border.

## 2026-09-13 — Shared spacing and modal placement

All desktop dialogs use native fixed viewport centering rather than per-page offsets. Selects retain native interaction but draw a self-hosted inset chevron because browser-native arrows cannot be consistently repositioned. Reserve spacing is applied around shared stage seats, not inside piece icons or board squares.

## 2026-09-14 — Explicit human color choice

Bot Arena exposes one seat selector — White, Black, or watch two bots — and a strength control for each side that actually has a bot on it. It used to ask the same question three times: a Play as select plus a White seat select plus a Black seat select. Changing seat mid-game starts a fresh game and preserves the bot strength; **before the first move it does not**, because there is nothing to throw away and a position imported from the library is exactly that case. Black waits for White's bot king placement before placing their own king. Added pure seat-selection unit tests and browser coverage for both colors.

## 2026-09-14 — Rules and practice in one place

Removed the homepage tutorial strip. A single shared Rules modal now contains the rules and playable king-placement, deployment and capture lessons, using the existing board and bot worker. Rules is present in every page header. Closing the modal cancels pending tutorial replies without affecting the actual match. First homepage visits can still start learning; invite pages never auto-open it. Browser coverage exercises the tutorial from all five pages.

Move-history surfaces also offer a persistent Coordinates toggle. The shared board renderer draws small top-right algebraic labels; labels follow logical squares, remain pointer-transparent and do not interfere with dragging.

`rules-modal` owns Rules opening, tutorial initialization and synchronized coordinate toggles on all pages. Modal HTML is rendered statically so navigation remains discoverable without JS and no HTML-string injection is needed.

## 2026-09-14 — Immediate tutorial board and contextual rule actions

Opening Rules now immediately initializes the current playable lesson, without a second activation step. Each Try it button sits directly after its explanation in the numbered list. Removed the separate lesson button cluster and hid the redundant close-demo control; closing Rules still cancels tutorial work. Added all-page browser checks for immediate board visibility and button-to-rule associations.

Removed the separate gotchas section; the no-check-on-deployment restriction remains directly in Move or deploy so the simplified modal does not omit a core rule.

Coordinates now use a checkbox beside move histories and start unchecked on every page. Tutorial drag ghosts are appended inside the native dialog's top layer, preventing them disappearing behind the modal when their source is hidden.

## 2026-09-15 — Coordinates belong to move-history surfaces

Do not expose the coordinate preference in the Rules tutorial. The control is useful when following notation and therefore belongs beside actual move lists, while the tutorial should minimize unrelated controls.

## 2026-09-16 — Repeat peer discovery while waiting

`net.js` periodically broadcasts versioned waiting announcements until matched or closed. A single initial hello cannot be trusted when browser initialization and WebRTC peer callbacks race. Keep discovery retransmission separate from game packets; it must stop when leaving and must never alter an active match. The browser smoke test needs two isolated contexts and the exact same invite URL.
