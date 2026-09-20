# Schness — design pass implementation brief

Every claim about current behaviour below was verified against `KakkoiDev/schness@main`
on 21 Sep 2026. Line references are indicative; grep for the quoted selector.

The visual source of truth is the Design canvas (14 artboards). This document is
self-contained — you do not need the canvas to implement it — but where a layout
judgement is needed, the canvas is the arbiter.

---

## Ground rules — do not break these

1. **No build step.** Static files served as-is. No bundler, no preprocessor, no npm runtime deps.
2. **No web fonts.** `CSP: style-src 'self'` and `DECISIONS.md` both forbid it. System stack only.
3. **EN/JA parity.** No layout may depend on English string lengths. Every control must hold
   its Japanese label on one line at 390px. Test both.
4. **Single-column, quiet product.** No marketing sections, no hero illustrations, no
   gradient washes. Subtraction is the house style.
5. **Touch targets >= 44px.** Already enforced; keep it.
6. **Do not regress the service worker.** `sw.js` precaches by path; if you add or rename a
   page, update its list.

---

## Stage 0 — Tokens

The single change that makes every later stage cheap. Replace the `:root` blocks in
`styles.css`.

### Light

```
--paper:#F2EEE4   --surface:#FCFAF4   --sunk:#E9E3D5
--ink:#131A16     (15.3:1 on paper)
--muted:#5B655E   (5.2:1)
--accent:#B23E18  (5.0:1)   <- ember, replaces the plum #7d3f6d
--line:#D9D2C1    --hairline:#EDE7DA
--board-light:#E9DCBE   --board-dark:#52705B   (4.0:1 between squares)
--focus:#B23E18
```

### Dark (`:root[data-theme="dark"]`)

```
--paper:#0E1512   --surface:#18211C   --sunk:#121A16
--ink:#EEE9DB     (15.3:1)
--muted:#96A199   (6.9:1)
--accent:#F0794C  (6.8:1)
--line:#2B3730    --hairline:#232E27
--board-light:#D6C7A4   --board-dark:#44604E   (4.2:1)
--focus:#F0794C
```

### Type

One declaration, on `:root`, replacing `font-family:Inter,...`:

```css
--font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto,
             "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif;
--font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
```

- **Inter never loads** (no `@font-face`, CSP blocks a CDN) so today the site renders in
  whatever the visitor happens to have. Delete the name entirely — do not keep it as a
  first choice that only designers see. *(fixes #01)*
- The Japanese faces are **appended to the same stack**, never swapped in. Delete
  `:root[lang="ja"] body{font-family:...}`. Right now "Sharp v2" and "3+2" render in a
  different face on the JA site. *(fixes #17)*
- Weights: **400** body, **640** headings and labels. Nothing else.
- Notation, clocks and ply counts: `--font-mono` + `font-variant-numeric: tabular-nums`,
  so a ticking clock stops jittering and move columns line up.

### Scale

- **Radii — three, replacing seventeen.** `6px` controls, `10px` cards and the board,
  `16px` dialogs. Pills stay `999px`. *(fixes #03)*
- **Shadows — two, replacing thirty-one.** Resting surfaces get a 1px hairline border and
  no shadow. Only genuinely floating things — dialogs, a dragged piece — get the one
  elevation shadow. *(fixes #03)*
- **Spacing:** 4, 8, 12, 16, 24, 32, 48, 64.
- **Focus:** `2px solid var(--accent)`, `outline-offset: 2px`. The stock `#2563eb` relates
  to nothing else in the file and is invisible on a moss square. Keyboard play is a
  first-class path in a board game. *(fixes #20)*

---

## Stage 1 — Delete the losers

`styles.css` is append-only: every decision ever made is still in it, and later rules
switch earlier ones off rather than replacing them. *(fixes #05)*

Confirmed dead or self-cancelling — remove the **whole chain**, not just the override:

| What | Evidence |
|---|---|
| `.brand-mark` | declared **5 times**; the cascade lands on `font-family:Arial,sans-serif` + `transform:none`, having earlier set Georgia + `rotate(-4deg)`. Stage 2 deletes the class outright. |
| `.mini-board` | fully styled, appears in **no** HTML file and no JS. Dead. |
| `.mode::after{content:"->"}` | immediately cancelled by `.lobby-page .mode::after{display:none}`. See Stage 5. |
| `--board-light:#e8d7b5` | a warm tan board defined in `:root` and then overridden to `#dde2de` by the five page classes. What ships is 2.5:1 between squares. Stage 3 settles this. *(fixes #04)* |
| duplicate `--accent` uses | the plum appears on the logo dot and "Try it ->" and nowhere else. *(fixes #06)* |

---

## Stage 2 — The mark

Today's logo is the letter **S set in Arial** inside a rounded tile, with a dot in
`#e96f4b` sitting next to a header accent of `#7d3f6d` — the favicon and the header
disagree on colour. *(fixes #02, #06)*

The new mark is the board with a 2x2 corner missing, and that block outside it: material
leaves the board and comes straight back, which is the one rule Schness has that no other
chess variant does.

### Geometry — use verbatim

4x4 grid of 24-unit cells. Board 96x96 at `x 0-96, y 52-148`. Notch `48x48` at
`x 48-96, y 52-100`. Chip `48x48` at `x 52-100, y 0-48`, left edge flush with the board,
4-unit gap below the corner.

```svg
<svg viewBox="-24 0 148 148" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Schness">
  <path d="M8 52H48V100H96V140a8 8 0 0 1-8 8H8a8 8 0 0 1-8-8V60a8 8 0 0 1 8-8Z" fill="#131A16"/>
  <rect x="52" y="0" width="48" height="48" rx="6" fill="#B23E18"/>
</svg>
```

On dark: board `#EEE9DB`, chip `#F0794C`.

Clear space is one cell (24 units) all round. ~200 bytes, one path and one rect, no font
dependency, legible at 16px.

### Apply everywhere

- **`icon.svg`** — replace entirely.
- **`assets/icon-180.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`** —
  re-render from the SVG. For the maskable, pull the chip inside the safe area so
  Android's circle mask never crops it.
- **`assets/social-card.png`** — re-render.
- **Header in all five pages** — delete `.brand-mark` (the tile *and* the letter) and
  inline the SVG. The mark already has a frame; it does not go inside a second rounded
  tile.
- **Favicon** — same file. The header mark and the favicon must use the same two colours.

### Never

- Don't put the mark inside a rounded tile.
- Don't tuck the chip into the frame to save space — outside the board is the whole point.
- Don't reintroduce the checkerboard; squares inside the board turn to mush below 32px.

---

## Stage 3 — The board and the pieces

### Board colour

Use the Stage 0 `--board-light` / `--board-dark` and **delete the per-page overrides**.
Today's squares sit 2.5:1 apart. 4:1 is where real boards live. *(fixes #04)*

### One frame everywhere

`6px` solid `--ink` border, `10px` radius, **no drop shadow**. Today `.board` has an 8px
frame, `.65rem` radius and a two-layer shadow, while `.game-page .board` has a 1px
hairline, `.3rem` and none. *(fixes #11)*

### Square states

| State | Treatment |
|---|---|
| Selected | inset ring, **no fill change** |
| Legal move | centre dot |
| Capture | ember ring |
| Drop target | dashed outline |
| Check | tinted square + translated chip *(see Stage 12)* |

### Pieces — mostly already right

`assets/pieces/` already holds the **Chessnut** set (Apache 2.0, credited in
`THIRD_PARTY_NOTICES.md`). Nothing needs replacing.

1. Pieces render at **82%** of the square.
2. **Decide the palette.** If you recolour, amend `THIRD_PARTY_NOTICES.md`; if you keep
   stock `#fff`/`#000`, leave the notice true. Either is fine; they must agree.

Delete the Georgia/Unicode glyph path (`.piece`, `text-shadow` outlines, `font-family:
Georgia`) — the SVGs supersede it.

---

## Stage 4 — Header and navigation

### Nothing on this site is a link

The only page-to-page `<a href>` anywhere is `./watch.html`. `library.html`,
`puzzles.html` and `game.html` are reachable **only** through `window.location.assign()`
in `src/lobby.js`, and there is no `<nav>` element on any of the five pages.

**Fix:**

- Turn the four lobby destinations into real `<a href>` elements styled as cards. Keep JS
  **only** for `#online-setup`, which opens a dialog and genuinely needs it.
- Add one shared `<nav>` to all five pages.
- Style the `<a>` itself as the button — a `<button>` inside an `<a>` swallows the click.

### The nav has no destinations in it

The header holds brand, theme, Install and Rules — **not one destination**. So "play against
a person" is reachable from exactly one page.

Ship a real `<nav>`: **Play, Online, Bot arena, Puzzles, Library**, as links, on all five
pages, with the current page marked `aria-current="page"`. Online belongs in it — starting a
game against a person is a primary destination, not a lobby-only side door.

At <=760px the two app controls (Rules, theme) collapse to icons first; the nav wraps to a
second row before the wordmark gives up a single pixel. Verify with Japanese labels.

### One order, everywhere

Ship: **brand, page controls (Rules, theme), rule, language**. *(fixes #08)*

### The wordmark must stop vanishing

At 390px the nav wins the row and the brand collapses to **zero width**. Shrink the nav,
not the name. *(fixes #07)*

### Headings

**The page title is the `h1`; the brand is a link.** *(fixes #19)*

---

## Stage 5 — Home / lobby

- **Add a real board to the lobby** — not a picture of one. Reuse `src/rules.js` and
  `src/bot.js`; do **not** write a second rules implementation.
- Reword Bot arena's subtitle to **"Take this position further — stronger bots, replay,
  position editor"**.
- **One primary action, three quiet ones.**
- **Restore the arrow affordance.** *(fixes #09)*
- **Subtitles stop being bold.** *(fixes #10)*
- **Add a footer.** How to play, Source, Tournament data, Dev log, and "Install as an app".

### Mobile (390px)

Deliberately **no board** — the mobile home stays a menu.

---

## Stage 6 — Dialogs

### 6a. One dialog component, two sizes — and a real bug

**Measured at 390x844 on the shipped site: `#online-setup` opens in the top-left corner.**
Not merely off-centre — `x:0, y:0`, with 31px spare to its right and 582px below it.

The declaration that centres **every** dialog is scoped to `@media (min-width: 761px)`. Below
that nothing centres it and the computed margin falls back to `0`. `.rules-dialog`,
`.position-dialog` and `.replay-dialog` escape because each was separately given a
full-height sheet rule. `.online-setup` was given none, so it is the only dialog that falls
through the gap — and the gap is invisible in a desktop browser, which is why it shipped.

**This is why the invite and rules modals look like different objects: they were never one
component.** Fix the class, not the instance: centre every dialog at every viewport, and make
size a class on the element — `is-sheet` (bottom sheet at <=760px) or `is-full` — never a
per-dialog media query.

- `#online-setup` -> `is-sheet`. A bottom sheet also puts the primary action in the thumb zone.
- `#rules-dialog`, `#position-dialog`, `#replay-dialog` -> `is-full`, replacing their bespoke
  media queries.

### 6b. Delete the fake drag handle

`<div class="dialog-grab" aria-hidden="true">` renders a 38x4 rounded bar below 760px, in all
five HTML files. **No `pointerdown` or `touchstart` handler anywhere in `src/` is bound to
it** — it is purely decorative, so it promises drag-to-dismiss and delivers nothing. The
sheets are full-height and already have a close button, so there is nothing to wire up:
remove the element from all five pages and both CSS blocks.

### 6c. The rules dialog

**Desktop** — open **at the top**; four numbered rules beside the demo; size the demo so the
board it is teaching is fully visible; the board uses the Stage 3 frame. Footer: "You can
reopen this from **Rules** in the header at any time", Skip, Start playing. *(fixes #14)*

**Mobile is a different layout, not the desktop one reflowed.** Today the grid collapses to
one column, the demo board eats ~55% of the viewport, the instruction sits *below* it, and the
only way to change rule is to scroll — there is no next/prev control at all.

Ship a **stepper**:

- One rule per screen.
- A four-segment progress bar plus "Rule 3 of 4".
- **Instruction above the board**, so you read what to do before you see the board.
- Board capped so the whole step fits without scrolling at 390x844.
- **`Back` / `Next rule` pinned to a fixed footer.** On rule four, `Next rule` becomes
  `Start playing`.
- Keep "Restart this rule" as a quiet action under the board.
- Announce each step change once via `aria-live="polite"`; move focus to the step heading.

---

## Stage 7 — Game page: the connection states

### 7a. `#card-waiting`

- Eyebrow with a live ember dot. `<h2>` "Send this link".
- **The link is the hero**: readonly `input` (mono, 46px) + a single **primary** Copy button.
- **Add a QR code** of the invite URL, labelled "Or scan it".
- **One status line that rewrites itself in place**, so the card never changes height:
  0:00 "Listening for a second player"; 0:20 "Still listening — no relay is answering yet";
  1:30 "Nothing yet. Check that both browsers opened this exact link."
  Delete `#search-stalled` and `#search-quiet` entirely.
- **Offer the bot from the first second**, in one fixed spot.
- Cancel stays quiet, to the right of the status line.

### 7b. `#card-reconnect`

- Eyebrow with amber dot. `<h2>` "Opponent lost connection".
- **The countdown is the hero**: `0:47` at 38px mono, `until forfeit` label, progress bar.
- **"Keep waiting"** (outline) + **"Claim the win" drawn disabled** until 0:00, with the
  note "Claiming unlocks at 0:00."

### 7c. `#card-expired`

- **Gains a primary action**: "New invite", "Play the bot", and a quiet "Back to the lobby".

### 7d. The missing state

Add a success rung: a green dot and **"Connected. Black has joined — your move."**

---

## Stage 8 — Online match rail

The governing rule: **the call never outranks the game.**

- **Text chat on from the first move.** Mic and camera **off until pressed**.
- **Permission asked once**, at the moment the button is pressed, reason stated first.
- **A persistent "On air" badge** whenever you are sending audio or video — in the tab title too.
- **Say it is peer-to-peer, in the interface.** When relayed, say "Relayed, not direct".
- **Degrade in order: video -> audio -> clock.**
- Chat is labelled "not recorded, not stored".
- **Focus mode**: the rail collapses to one bar. On a phone this is the **default**.
- Quick-chat phrases stay.

---

## Stage 9 — Bot arena (`watch.html`)

- **One seat control, not three.** *(fixes #12)*
- **Turn status above the board** — a bordered card with an ember left edge.
- **Split replay from setup.** One primary (New game), a replay transport group, and a
  quiet list.
- **Add a move list** — numbered, mono, tabular, current ply highlighted.
- Rename: "Live position" -> **Live**, "Continue from here" -> **Branch from here**.

---

## Stage 10 — Library

- **The result becomes a colour and a final position**, not a sentence. *(fixes #13)*
- **Add a sort** — shortest game first, longest, most repeated.
- Stop truncating matchups mid-word.
- Keep the summary stats row.
- Mini-boards use the Stage 3 frame at small scale.

---

## Stage 11 — Components and states

Four button roles, not seven near-identical rectangles.

| Role | Rest | Hover | Focus | Disabled |
|---|---|---|---|---|
| Primary | ink bg, paper text | `#2A332D` | 2px ember, 2px offset | **drawn**, not dimmed |
| Secondary | surface + line | line -> ink | same | surface `#EFEADF`, text `#A9A396` |
| Ghost | transparent | sunk bg | same | text `#A9A396` |
| Icon | 44x44 secondary | | same | same |

**Disabled is drawn, not dimmed.**

Also specify: segmented control, seat select, toggle pill, the status cards, and the
reserve slot in its three states — held, selected, **empty stays a dashed outline**.

Every label must be a verb phrase short enough to stay on one line in **both** languages.

---

## Stage 12 — Japanese

1. **`content:"CHECK"` and `content:"CHECKMATE"` are hardcoded in `styles.css`.** Move
   them to data attributes the CSS reads and add the strings to `i18n.js`. *(fixes #15)*
2. **The language switch says 日本** — change to **日本語**. *(fixes #16)*
3. Delete `:root[lang="ja"] body{font-family:...}`. *(fixes #17)*
4. Re-check every button at 390px in JA.

---

## Stage 13 — Accessibility

1. **Theme toggle is unlabelled on `library.html` and `puzzles.html`.** *(fixes #18)*
2. `h1` per page — Stage 4. *(fixes #19)*
3. Focus ring — Stage 0. *(fixes #20)*
4. Real links — Stage 4.
5. Board squares stay real `<button>`s with per-square `aria-label`s.
6. Dialogs: focus moves in on open, returns on close, Escape cancels.

---

## Stage 14 — Housekeeping

### 31 hand-maintained cache-busting strings

Every file at its own `?v=` number, bumped by hand. Fix: one `BUILD` constant, or let the
service worker own cache identity and drop the query strings entirely.

### CSS weight

Re-measure after Stage 1 and decide whether splitting is still worth it — it probably
isn't, and one file beats two.

### `puzzles.html`

Apply Stages 0-4 and 11 to it, then treat its layout as an open question.

---

## Audit cross-reference

| # | Finding | Stage |
|---|---|---|
| 01 | UI font never loads | 0 |
| 02 | Four typefaces, one Arial | 0, 2 |
| 03 | 17 radii, 31 shadows | 0 |
| 04 | Board token != board on screen | 0, 3 |
| 05 | Later rules undo earlier ones | 1 |
| 06 | Accent used on four pixels | 0, 2 |
| 07 | Wordmark vanishes on phone | 4 |
| 08 | Header order differs per page | 4 |
| 09 | Home cards don't look pressable | 5 |
| 10 | Every subtitle is bold | 5 |
| 11 | Board drawn two ways | 3 |
| 12 | Arena: one question, three controls | 9 |
| 13 | Library cards unscannable | 10 |
| 14 | Rules dialog opens mis-scrolled | 6 |
| 15 | CHECK/CHECKMATE hardcoded in CSS | 12 |
| 16 | 日本 -> 日本語 | 12 |
| 17 | JA swaps the whole font stack | 0, 12 |
| 18 | Theme toggle unlabelled on 2 pages | 13 |
| 19 | Every `h1` is "Schness" | 4 |
| 20 | Focus ring is stock blue | 0 |
| — | Nothing on the site is a link | 4 |
| — | 31 hand-maintained `?v=` strings | 14 |
| — | 90KB CSS on every page | 1, 14 |
| — | `puzzles.html` undesigned | 14 |
| — | Invite dialog opens top-left on mobile | 6 |
| — | Two dialog patterns, never one component | 6 |
| — | `.dialog-grab` promises drag-to-dismiss, does nothing | 6 |
| — | No way to change rule on mobile | 6 |
| — | Header nav holds no destinations | 4 |

---

## Acceptance

Run through this in **both themes** and **both languages**, at **1440px** and **390px**:

- [ ] No `Inter`, `Georgia` or `Arial` anywhere in CSS or SVG.
- [ ] Exactly 3 radius values and 2 shadow values in the stylesheet.
- [ ] Board squares measure >= 4:1 against each other; run a contrast check.
- [ ] The board in the rules dialog and the board in a game are pixel-identical in frame,
      radius and shadow.
- [ ] The new mark renders correctly at 96 / 48 / 32 / 16px, and the favicon and header
      mark use the same two colours.
- [ ] At 390px the wordmark is still visible on all five pages.
- [ ] Header order is identical on all five pages.
- [ ] `library.html` and `puzzles.html` are reachable by a real link you can cmd-click.
- [ ] Every page's `h1` names the page, not the site.
- [ ] Tab through every page: the focus ring is ember and visible on paper, on surface and
      on a moss square.
- [ ] Every button holds its Japanese label on one line at 390px.
- [ ] Check and checkmate display in Japanese on the JA site.
- [ ] Waiting card: the status line escalates without the card changing height, and the
      bot escape is present from the first second.
- [ ] "Claim the win" is disabled until the countdown reaches 0:00.
- [ ] An online match never opens with a live microphone.
- [ ] `THIRD_PARTY_NOTICES.md` agrees with whether the pieces were recoloured.
- [ ] Lighthouse a11y >= 95 on all five pages.
- [ ] `npx playwright test` passes; update selectors the restyle broke rather than
      loosening assertions.
