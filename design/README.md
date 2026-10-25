# Design reference

Four proposed screens and the component system behind them, for the "Classic first" pass.

Open `design/index.html` in a browser from the repo root (`npx serve .`, or any static server —
the pages use relative paths and the same CSP as the app, so `file://` will not work).

| File | What it is |
|---|---|
| `index.html` | Contact sheet. Live previews of the four screens, in iframes, at real widths. |
| `system.html` | Tokens and components. Swatches are `var(--token)` read from the real `styles.css`. |
| `screens/play.html` | Play — the home page, board above the fold at every width. |
| `screens/game.html` | A reserve piece selected, legal squares marked, refused squares explained. |
| `screens/result.html` | Checkmate, with the final position still on screen. |
| `screens/settings.html` | The settings sheet. |
| `design.css` | Chrome for these pages only. Every rule is `.ref-`-prefixed or scoped under one. |
| `preview.js` | A theme toggle. Deliberately separate from `src/theme.js` so opening a reference page at a theme does not touch app storage. |

## This is not part of the app

- No shipped page links here, and nothing in `src/` imports from here.
- `design/` is **not** in the service worker's `SHELL`, so none of it is cached or deployed as app shell.
- Adding files here needs no `CACHE` bump.

If any of those three stop being true, this folder has become part of the product and needs an
entry in `DECISIONS.md` rather than a line in this README.

## Why it links the app's stylesheets

`system.html` and the screens load `../styles.css` and `../ui.css` before `design.css`. That is the
point: the swatches and the components *are* the shipped ones. A reference that restates tokens is
a second source of truth, and the one that rots is always the one nobody runs.

## What is proposed here, and what already ships

Everything uses shipped classes except two additions, both marked `PROPOSED` in `design.css`:

- **`.square.refused`** — today a drop that would give check is rejected in silence and the
  selection is cleared. Measured: with a rook in hand against a black king on b4, six of fourteen
  empty squares refuse it, and they are exactly rank 4 plus the b-file. The rule is right; only the
  explanation is missing.
- **`.brand-mark-img`** — the mark as an image rather than the Arial letterform tile.

## What these screens are not

They are Chromium at a viewport. No real device has run them, which is the same limit
`DECISIONS.md` lists under Known gaps. Nothing here has been validated by a user, and a screen
looking cleaner is not evidence that it works better.
