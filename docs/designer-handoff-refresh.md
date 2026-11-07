# Designer handoff: whole-app refresh around the new features

Prepared 2026-11-07; corrected 2026-11-08 after the designer's re-run of the audit. Brief for the designer AI. It authorizes **design and prototype work only**:
no rules changes, no engine changes, no production implementation. It supersedes nothing in
`docs/designer-handoff-classic.md`; that brief's Classic-first constraints, accessibility floor
and token architecture still apply, and this one extends them to the features shipped since.

## Assignment

Refresh the UX and UI of the **whole app** — Play (home), Online game, Bot arena, Puzzles,
Library, Rules, settings and header — so that the features added since the Classic pass feel
like one product rather than controls bolted onto the arena:

1. **Variant selection** — 36 named presets plus Random, rules shown before play, full-setup and
   hidden-army phases.
2. **Capture banks and other capture policies** — captured pieces that change owner, capacity
   3–6, overflow, duplicate reserve badges, permanent loss.
3. **Bot strength and analysis** — per-side bot level, forced-mate hints, the estimated-advantage
   bar, replay/edit/branch, and the library's research archive.

Classic must stay the clear default and the fastest route to a game. Variants are opt-in
experiments. Lead with one coherent recommendation, not a gallery of options.

## Read before designing

- `CLAUDE.md`, then **all of** `DECISIONS.md`. Its Invariants section is load-bearing for design:
  *The arena asks one question per decision*, *Four button roles*, *The scale is three radii, two
  elevations and two weights*, *The board is bounded by the window*, *Contrast and tap targets are
  measured*, *The two languages are one product*, *Nothing opens the rules for you*, *The turn card
  does not move the board*, *The nav holds destinations*, *The home page is a board, not a picture
  of one*, *design/ is a reference, not a layer*.
- `docs/designer-handoff-classic.md` and `design/README.md` — the previous pass and its live
  reference screens (`design/index.html`, `design/system.html`).
- `src/variants.js` — the authoritative preset list, labels and descriptions.
- DEVLOG entries from 2026-10-24 onward that mention variants, capture banks, setup or levels.
  Most later entries are engine research. Do not design for unshipped research mechanics (charge
  banks, cooldown timers, three-check, centre hold, larger boards, queens, fairy pieces): none of
  them is playable in the app.

## What ships today (observed 2026-11-07, branch head 146f8ff plus the restore below)

| Surface | Files | What a user sees |
|---|---|---|
| Header | every `*.html`, `src/theme.js`, `src/i18n.js` | Wordmark; nav: Play online / Bot arena / Puzzles / Library; ghost buttons: Rules, theme toggle, 日本語, Install (when available). |
| Play (home) | `index.html`, `src/lobby-board.js` | A live Classic game against a bot, board above the fold; a "Random variant" card links into the arena. Always canonical. |
| Online game | `game.html`, `src/main.js` | Invite / join / clock / chat / voice. Always canonical. Without a game id it redirects home. |
| Bot arena | `watch.html`, `src/watch-ui.js` | Four selects: You play (White / Black / Neither), a level per bot side (Learning / Steady / Sharp / **You** — so seat is asked twice), Game variant (a flat list of 37 options). A description sentence, a turn card, the board and reserves, then a side column: New game, a replay transport, Coordinates, a move transcript, Edit / Branch / Pause, and a collapsed *Training tools* section (forced-mate hints, White/Black advantage). |
| Puzzles | `puzzles.html`, `src/puzzle-ui.js` | Mate-in-1 to 4 tabs, hide-depth and auto-next toggles, a board, a fixed Next / Solution bar on phones. |
| Library | `library.html`, `src/library-ui.js` | A stats block (unique games, original records, decisive %, average plies), filters (White AI, Black AI, result, Sharp version, sort), game cards, a replay with an optional advantage bar. |
| Rules | dialog on every page, `src/rules-modal.js`, `src/tutorial.js` | A four-step playable Classic tutorial. Covers Classic only. |

## UX audit — observed, with evidence

These come from running the app in Chromium at 800×600 and 375×812. Each is something seen,
not a preference. The priority is the designer's to revise, with reasons.

| # | Observation | Impact | Priority |
|---|---|---|---|
| 1 | **The variant picker is a native select with 37 options in one flat list**, labelled in research shorthand ("Counterchecking drops only", "Quiet first turn + king protection", "Both deploy two"). Nothing groups them into families, and nothing says which ones change the most. | Players can't tell what they're choosing or how far it is from Classic. Random is the only realistic entry point. | P1 |
| 2 | **Variant descriptions are developer sentences** shown verbatim under the select, e.g. hidden armies: "Uniform legal arrangement sampling, not a hidden-information AI." | Tells a player about the implementation, not the game. | P1 |
| 3 | **The capture-bank tray is the Classic tray**: three fixed slots (rook, bishop, knight) plus a ×N badge. Nothing shows the capacity (3–6), how full the bank is, or that a capture overflows back to the opponent when the bank is full. | The variant's core resource can't be read; overflow looks like a bug. | P1 |
| 4 | **Refused drops are explained only in Classic.** `refusedDrops()` returns nothing whenever a preset allows checking drops or names an experiment, so in "Knight checking drops only", "Distant checking drops", cooldown and the rest, an illegal drop just doesn't happen, with no reason given. | The variants whose whole point is a restriction are the ones that never explain it. | P1 |
| 5 | **On a phone the arena puts the board below the fold**: board top at y=678 of an 812px viewport, page 1,615px tall. The selects and the description fill the first screen. Re-run: the board's bottom clears no viewport tested (977 at 390×812 and 390×700, 951 at 800×600, 1073 at 1280×800), so this is not phone-only. | Contradicts *The board is bounded by the window*; you scroll to play every turn. | P1 |
| 6 | **On an 800×600 desktop the turn card is far from the board's lower half and your own reserve**; "White wins by checkmate" sits about 300px above the bottom rank you were looking at. | Result and turn state live outside where the eyes are. | P2 |
| 7 | ~~Replay transport is enabled before any move exists.~~ **Rejected on re-run:** all five transport buttons report `disabled` with no moves. | — | — |
| 8 | **Training tools are the last item in the side column**, collapsed, labelled with jargon ("Forced-mate hints (1–4 moves)"). On a phone they're below the board and the transcript. | Analysis, a headline feature, is effectively hidden. | P2 |
| 9 | **The bot level is a three-word select** (Learning / Steady / Sharp) with no hint of what changes. The engine supports numeric levels 0–100 (`DECISIONS.md`, 2026-10-25), but no surface exposes them. | Players can't choose a fair opponent deliberately. Whether to expose numbers is a decision for the user, not the designer (see the questions at the end). | P2 |
| 10 | **The library leads with research statistics** ("981 repeated records collapsed by exact move sequence", "original records", a "Sharp version" filter). On a phone the stats and filters fill the first screen before any game card. | A player-facing page that reads like a dataset manifest. | P2 |
| 11 | **Puzzles on a phone: the fixed Next / Solution bar covers the bottom rank of the board.** The e2e test *nothing hides behind the action bar* fails. | The rank you need for a mate-in-N is hidden. | P1 |
| 12 | **Puzzle chrome is ambiguous**: Mate 1–4 are drawn as primary buttons, the reserve caption reads "White · Defense", and empty reserve slots are dashed boxes with no label. | Unclear which control is a filter and which side is yours. | P3 |
| 13 | ~~The theme button is ambiguous.~~ **Rejected on re-run:** it names its target ("Dark" while light, `aria-label="Switch to dark mode"`), the same pattern `DECISIONS.md` documents for the language toggle. | — | — |
| 14 | **The rules tutorial teaches Classic only**, Variant rules exist only as the one-line description. (The repeated sentence was rejected on re-run: it appears once.) | No way to learn a variant before losing to it. | P2 |
| 15 | **Home's only door to variants is one "Random variant" card**, and it lands you in the arena with a different set of controls from the home game. | Variants feel like a different app. | P2 |

What already works and should be kept: the home page is a playable board at every width; the
shared board/reserve renderer gives play, puzzles, tutorial and replay one visual language; the
refused-square striping and its explanation in Classic; the checkmate badge on the mated king; the
numbered, paired transcript; the four button roles; en/ja parity; no horizontal overflow at 375px.

Assumptions that need user testing rather than more design: whether players want variants
outside the arena at all; whether numeric strength helps or confuses; whether the advantage bar
should be on by default.

## Design questions to resolve

- **Information architecture.** Where do variants live: still inside the Bot arena, a "Variants"
  destination in the nav, or a rules choice on the home game? Online and the home game are
  canonical by decision (*Opt-in playable variants*); propose a change only with its cost and the
  invariant it would replace, and label it as a proposal.
- **Choosing a variant.** Group the 36 presets into families a player understands. From
  `variants.js`: capture policy (permanent loss, capture banks 3–6); checking-drop restrictions
  (piece-only, distance, support, home half, countercheck, limited, cooldown, no drop mate);
  opening protection (lone-king, opening, quiet first turn, mutual unlocks, grace, quiet return);
  setup (full setup with White or Black first, hidden random armies); plus Classic and plain
  checking drops. Show the difference from Classic in a sentence, and how it changes play (more
  or less tactical, longer setup). Random must stay one tap and must show what it rolled.
- **Teaching a variant.** One short "what's different" card before the first move, available
  again from the game. Never auto-open the full rules dialog (*Nothing opens the rules for you*).
  Decide whether variant explanations extend the rules dialog or live beside the board.
- **Banks and capture policies.** Specify a tray that shows capacity, current count, duplicates,
  the piece's colour and owner after a transfer, and the moment of overflow. The capture
  animation's meaning ("the taken piece flies to its owner's tray") must stay true for each policy:
  owner's tray in Classic, capturer's bank when there's room, gone for permanent loss.
- **Explaining refusals in every variant.** Design the refused-square state and message for each
  restriction family ("Only knights may give check on a drop", "Too close to the king", "Needs a
  supporting piece", "Checking drops unlock after both players deploy one piece"). Engineering will
  need a per-policy refusal reason; note this in the implementation handoff, don't assume it exists.
- **Setup phases.** Make full setup (alternating quiet drops, who moves first after it) and hidden
  armies (private arrangement, simultaneous reveal) clearly separate phases from normal play, with
  the right reserve interaction for each.
- **Arena density.** Keep *one question per decision*, but give the board the first screen on a
  phone. Consider a compact game header (seat · bot level · variant chip that opens the picker)
  instead of three stacked selects.
- **Strength and analysis.** Where the bot level is chosen and how it's described; where mate hints
  and the advantage bar live during a live game versus replay; how a hint is shown on the board
  without hiding pieces.
- **Library for players.** Lead with games and what's interesting about them (variant, result,
  length) and move archive statistics to a secondary place. Filters should include variant.

## Required states

Desktop (1280–1440), tablet (768), and phones (390, 360, and a short 390×700), all in light and
dark, English and Japanese:

- Home: first visit, returning, and the route into variants.
- Variant picker: browsing families, a variant selected with its explanation, Random rolled.
- Arena: seat/level/variant chosen, king placement, normal play, bot thinking, watch-two-bots.
- Capture bank: empty, partly full, full, a capture that transfers, a capture that overflows,
  duplicates ×2/×3, a drop from a bank holding opponent-origin pieces.
- Permanent loss: tray after pieces have left the game.
- Refused drop: Classic, plus at least three restriction families.
- Full setup and hidden armies: placing, waiting, reveal, first normal move.
- Check, checkmate, draw (repetition, setup-blocked), postgame actions.
- Replay: no moves yet (transport disabled), mid-replay, return to Live, Edit, Branch.
- Training: mate hint shown, advantage bar on/off, live versus replay.
- Puzzles on a short phone with the action bar, nothing hidden behind it.
- Library: list, filtered by variant, a game opened in replay.
- Rules/variant explanation, header, settings, Online states (no visual regression only).

## Constraints that are not up for redesign

- Rules and engine behaviour are fixed. A theme or layout never changes rules.
- Static HTML/CSS/ES modules, Basecoat 1.0.2 Nova primitives through `ui.css`, the existing tokens
  in `styles.css`. Three radii, two elevations, two weights, four button roles. No framework, CDN
  font or external asset (CSP). New tokens are allowed when named and justified.
- Text contrast ≥4.5:1 in both themes (`test/contrast.test.js`), with a 4.6 guard only on `--muted` and `--accent-text` against `--paper`; touch targets ≥44px on phones,
  reserve tiles included; colour is never the only signal.
- Keyboard board navigation, visible focus, dialog focus/escape, screen-reader labels and live
  status stay intact. Motion is opt-out and respects reduced motion.
- English and Japanese are equal; design with the longer Japanese strings.
- Mockups go in `design/` (not shipped, no cache bump, per `design/README.md`). Reference screens
  load the real `styles.css` and `ui.css`; mark anything new `PROPOSED` in `design.css`.

## Deliverables

1. The audit above, revised: confirm, re-prioritise or reject each row with reasons, and add what
   you find. Keep observations separate from hypotheses.
2. One recommended information architecture and play flow covering Classic, variants, arena,
   analysis and library, with the rejected alternatives and why.
3. High-fidelity reference screens in `design/screens/` for: home, the variant picker, the arena
   mid-game in a capture-bank variant, a refused drop in a restricted variant, hidden-army reveal,
   training tools in use, the library, and a phone puzzle. Light and dark; desktop and 390px.
4. A state/component map: the bank tray, variant chip and picker, the variant explanation card,
   per-policy refusal messages, the game header, the transport, training controls.
5. Token and component additions, each with the problem it solves.
6. An implementation handoff: files to change, new copy (en and ja), the engineering
   prerequisites (per-policy refusal reasons, bank capacity in the reserve renderer), acceptance
   checks and a staged rollout.
7. The few decisions the user must make before implementation, as a short list.

Don't claim a usability improvement because a mockup looks cleaner. Nothing here has run on a
real device (Known gaps).

## Acceptance criteria

- A new player reaches a Classic game in one step from home, on any width.
- A player can find a variant, understand how it differs from Classic and what Random picked,
  and get back to Classic, without reading developer text.
- In every capture policy, the tray shows what you hold, its limit, and where a captured piece
  went.
- Every refused drop, in every variant, says why.
- The board and your reserve are on the first screen of the arena and puzzles at 390×700.
- Analysis tools are findable during a game and in replay without crowding the board.
- One board/reserve language across home, arena, puzzles, tutorial, replay and library.
- Both themes and both languages, keyboard and reduced motion.

## Engineering context for this pass

- Repository: https://github.com/KakkoiDev/schness. The latest code is on
  `codex/competitive-engine-2026-10-26` (draft PR 123, 119 commits ahead of `master`). Design work
  is on `design/ui-refresh-handoff`, branched from its head `146f8ff`. That branch is local only; it has not been pushed.
- **The published head is missing three files.** Commit `954ceff` published `src/watch-ui.js`,
  which imports `refusedDrops` and `DROP_REFUSAL` from `src/interaction.js`, but not the matching
  `interaction.js`, `lobby-board.js` or `main.js`. The Bot arena fails to load
  ("does not provide an export named 'DROP_REFUSAL'") and its board is blank. This branch restores
  the three files from the local workspace (the 2026-10-24 refused-drop work). With them, 394 of
  396 unit tests pass; the two failures are engine-benchmark tests that need `npm install`.
- **`.square.refused` has shipped** (`styles.css:2392`) and `board-ui.js` accepts a `refused` set;
  `design/design.css` still marks it `PROPOSED` and should be corrected.
- **`bankCapacity` appears nowhere in `board-ui.js` or `watch-ui.js`.** The reserve renderer has no
  concept of a bank limit, so the capacity-aware tray (row 3) is an engineering prerequisite.
- The 2026-11-07 desktop/mobile Playwright run had 18 failures
  (`research/workspace-publication-2026-11-07/browser.log`). Several are arena tests that the
  missing files explain; others match the audit (puzzle action bar). Rerun the e2e suite on this branch before treating any of them as a design problem.
- The engine research is separate and paused for the UI. Don't touch `src/search.js`, `src/bot.js`
  or the research folders.

## Decisions for the user before implementation

- Do variants stay arena-only, or do they get their own destination or a rules choice on Play?
- Should numeric strength (0–100) be exposed, or should named levels stay?
- Is the library for players or for research? Should the archive statistics move to a research page?
- Should the advantage bar default on or off in bot games?
