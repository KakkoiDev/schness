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

Two documents, deliberately separate:

- **`index.html` + `src/lobby.js`** — the lobby. Chooses a mode and a setup, then navigates away.
- **`game.html` + `src/main.js`** — one match. Everything about playing lives here.

`src/` splits into three layers, and the split is the main thing to preserve:

| layer | modules | property |
|---|---|---|
| **Pure core** | `rules` `bot` `history` `notation` `game-message` `interaction` `keyboard` `clock` `matchmaking` `navigation` `chat` `settings` `communication` `board-ui` `drag` `theme` | No DOM, no network. Directly unit-tested. |
| **Transport** | `net` (+ vendored `trystero`) | WebRTC over public Nostr relays. |
| **DOM glue** | `main` `lobby` `sound` `bot-worker` | Touches the document. Thin by intention. |

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

### Motion is opt-out, and animates outside the rebuilt subtree

Everything that **moves** sits behind `prefers-reduced-motion: no-preference`. That includes
transforms added later — two slipped past once. Nothing in the `reduce` block translates, scales or
rotates.

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
because a fill colour bright enough to read as a dot rarely clears 4.5:1 as type. The accent is plum
(`#7d3f6d` light, `#c98ab8` dark). It was orange, which read as somebody else's brand rather than
this app's, and it is chosen to sit opposite the sage board while staying clear of `--danger`
(burnt red), `--warn` (amber) and `--focus` (blue), all of which have to remain tellable apart.

**Never hardcode the accent.** Tints go through `color-mix(in srgb, var(--accent) N%, transparent)`.
Six `rgb(228 91 53 / …)` literals were baked into rings and shadows, so dark mode drew the light
theme's colour and nobody noticed while both themes were orange — the moment the hue changed it
would have been glaring. Guarded by `test/contrast.test.js`.

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
unclickable. The lobby's three-rule strip and the turn card carry first-run guidance instead.

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

### The turn card says what is true now

It carries state, not standing instructions. It used to repeat the rules of the game every single
turn while a toast and the Moves line said the same thing beside it. It shows contextual detail —
king placement, being in check, what is selected — and nothing when there is nothing to add. When
the result overlay is up it is hidden entirely, or the ending is printed twice.

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
   `validatePosition`. **Only the bot may use either.** Anything holding a position that came from
   outside this engine goes through the guarded entry points.
2. **The repetition map was copied per candidate move.** It grows by one entry every ply, so cloning
   it thirty-odd times per node made the bot slower the longer the game ran — for a map the legality
   filter never reads. `clonePosition` now shares it when the copy is a throwaway.
3. **Legality cloned an entire position to ask a question about the board.** It is `boardAfter` plus
   `boardInCheck` now — one `slice` and shared occupant objects, because occupants are replaced and
   never mutated anywhere in this engine. `attacksSquare` answers on the first hit instead of
   building an array to call `.includes` on it.

**How this was made safe, and how to make the next one safe.** Every step was checked two ways: an
equivalence harness comparing the live engine against a frozen copy over 21,215 positions from 400
seeded games (zero mismatches), and a fingerprint of the 30 moves a self-play chooses, which did not
move once across all three changes. `test/rules.test.js` now carries the durable half of that: perft
counts to depth 4 (4 / 16 / 558 / 17,896) and a test that the unguarded shortcuts agree with the
guarded entry points to depth 3. **Nothing else in the suite would catch an engine that quietly
plays a different game.** If you change the rules on purpose, recompute the perft numbers and say so
here.

## Testing

Pure modules get real unit tests. DOM behaviour that cannot be unit-tested is guarded by asserting
against the source or the stylesheet — blunt, but it catches the specific regression it names, and
each such test says which failure it is protecting against.

There is no browser test runner in CI. Interactive verification is done by driving Chromium through
Playwright by hand during development. **A class appearing is not proof a thing works** — the piece
animation passed that bar while doing nothing at all. Measure the effect, not the trigger.

---

## Deploying

`master` → GitHub Actions → GitHub Pages → `schness.com` (see `CNAME`; DNS points at Pages' anycast
IPs). A Netlify site is also linked to the repo from Netlify's dashboard — it adds three neutral
checks to every PR and serves nothing anyone visits. There is no Netlify config in the repo.

---

## Known gaps

Honest list of what is not done and what cannot be checked from a sandbox:

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

---

## Log

Newest first. One line per decision that changed how the app behaves.

- The bot search is 4.3× faster and no longer degrades as a game lengthens; move generation is
  pinned by perft counts.
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
