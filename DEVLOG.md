# Schness development log

This is the chronological record of experiments and product direction. Each meaningful experiment
records the question, alternatives, decision, evidence, and next step. `DECISIONS.md` remains the
authority for current architecture and invariants; this file explains how and why those decisions
were reached.

Future contributors must add an entry in the same commit when they run an experiment, change product
direction, tune an AI, or accept/reject a meaningful alternative.

## 2026-10-03 — Online play moves onto p2p-core

**Question.** Schness, kakkoi-online and asakura each vendored trystero 0.21.5 and each grew its own
relay list, relay-health check and hello-retry. Can the shared part live in one library without
changing what goes on the wire?

**Alternatives.** (1) Keep `net.js` as it was and only swap the import — gains nothing but a shared
relay list. (2) Rewrite matchmaking against a new p2p-core protocol — cleaner, but strands every
cached build until it updates, and the service worker keeps those around. (3) Move the pairing
handshake into p2p-core *verbatim* as `matchmake`, keep the colours, waiting copy and channels
here. Chose 3.

**Evidence.** `npm test` green (229). Playwright desktop: 50 passed; `online-connect` fails as it
did before, on the sandbox proxy refusing every public relay. New `online-tabs` passes: two tabs
pair, get opposite colours and exchange a move with no relay. Served by `p2p-core serve`, two
isolated browsers pair through the server with no relay. With every relay socket redirected to one
local nostr relay, old↔old, new↔new, old↔new and new↔old all pair and exchange a move.

**Decision.** `net.js` keeps its interface; `main.js` is untouched. The relay list is p2p-core's
shared one: ours, minus `relay.nostromo.social`, which refuses our notes and so never carried a
rendezvous. The waiting card still counts relays only, so in a classroom on
`p2p-core serve` with no internet it says no relay is answering while the server pairs players
anyway — wrong in tone, not in function.

**Next measurement.** Two real devices on live relays, old build against new, before the cache
version that ships this has rolled out. Then the waiting copy for the local-server case.

## 2026-09-12 — Check needs both words and a board marker

**Problem.** The live match already identified check, but the turn headline still read “Your turn”
and the checked square used a subdued wash. It was easy to overlook, especially on a phone.

**Decision.** Name CHECK explicitly in the turn headline, tint the turn card, and outline and label
the checked king square. The message also explains that moving, capturing, or a legal reserve drop
can resolve check. The warning is rendered only for a live, unfinished checked turn; the board
marker remains visible when reviewing the checked position. Sound stays opt-in.

**Evidence.** Unit coverage locks the headline, card state, accessibility label, and Japanese copy;
desktop/mobile browser checks exercise the board marker. No chess-rule or legal-action logic changed.

**Palette follow-up.** The vivid red overlay and outline stood apart from the warm green-gray
board. The checked square now takes on one solid muted terracotta color per theme, with a quiet
brick edge and label. The CHECK headline remains the primary warning; the square no longer looks
like an unrelated neon alert or obscures a white or black king.

**Specificity correction.** The checkerboard rule for dark squares had a stronger selector than
the check-color rule, so the status could announce check while the king's dark square stayed green.
The live board now applies check color with board-specific precedence. Browser coverage asserts the
actual rendered background on both square colors in both themes.

**Shared-board correction.** Further testing exposed a second gap: only the live match supplied a
checked-square set to the shared renderer. Arena, puzzles, and library replay silently used the
default empty set, so their king square stayed ordinary even for a real checked position. Check
markers now derive from each displayed position by default, and the same palette applies on every
board. A browser test opens a genuine checked position in Arena and checks its DOM and rendered color.

**Terminal state.** A checkmated king previously retained the CHECK badge from the last move,
even while the match result said Checkmate. The shared renderer now uses the engine result to show
CHECKMATE on the king square, with accessible copy and a deeper terracotta shade. A legal defensive
drop keeps the badge at CHECK, verified against the exact rules; an archived mating position is
replayed to the end in desktop/mobile browser tests.

## 2026-09-11 — One bilingual interface and one product mark

**Language.** English and Japanese now share one browser-native interface rather than separate page
copies that would drift apart. Japanese is selected from the device language on a first visit; an
explicit EN/日本語 control persists the player’s choice. Static copy, live game status, accessibility
labels, chat, tutorials, puzzles, the arena, and the game library all pass through the same translator.

**Layout.** Japanese uses native system Gothic fonts, tighter heading tracking, strict Japanese line
breaking, and guarded button wrapping. The language control is deliberately compact so adding it does
not create a second mobile-header row.

**Mobile correction.** The playable-rule action originally fell into the 20-pixel number column of
the mobile rule grid. Japanese permits a break between characters, so 「試してみる」 became a vertical
stack. The action now explicitly occupies the content column and stays on one horizontal line; the
language control also has a quiet pill border so EN / 日本語 reads as a switch rather than body text.

**Identity.** The earlier landing page omitted the monogram while inner pages sometimes hid it on
phones, and the installed-app icon used unrelated knight artwork. Schness now uses one unrotated dark
rounded-square S with a small coral point everywhere: header, favicon, iOS icon, and PWA icons. The
maskable icon keeps the same mark inside Android’s safe area.

## 2026-09-11 — Research archives, first-run teaching, and focused puzzle practice

**Research durability.** Actions artifacts are useful while investigating a run but are retained for
a limited period; Schness's workflows currently request 30 days. Tournament and puzzle pipelines now
also package their result as versioned GitHub Release assets. Releases become the durable system of
record, while run artifacts remain the convenient short-lived copy. A small manual archive workflow
backfills still-available historical tournament runs without rerunning the experiment.

**Onboarding.** A first-time lobby visitor now enters the interactive king-placement lesson
automatically. Invite links already land directly on `game.html`, so an invited player is never
blocked by onboarding. Opening the lesson marks it seen locally, and Settings provides an explicit
way to replay it. The tutorial continues to use legal engine positions and a real worker reply rather
than a scripted animation that could disagree with the rules.

**Puzzle practice.** Mate depths are independent filters rather than one exclusive choice, so a
player can mix (for example) mate in one and two. An optional hidden-depth prompt trains position
reading instead of target-depth guessing. Auto-next advances only after a genuinely solved puzzle,
not after revealing the answer. On narrow screens, the controls and feedback remain anchored near
the viewport edge. Drag sources stay fully opaque: the previous opacity rule could be triggered by a
scroll gesture crossing the drag threshold, making pieces appear gray even when no move occurred.

## 2026-09-11 — Every board should teach the same interaction language

**Problem.** Live matches supported touch/mouse dragging and fixed three-slot reserves, but puzzles
only accepted taps and recorded games reduced reserves to letters in a sentence. The landing-page
rules were accurate but passive. A player had to relearn the interface in every context.

**Decision.** Use the same piece assets, fixed reserve slots, selection marks, legal targets, and
pointer-following drag ghost wherever a position is playable. Read-only archive positions show the
same two reserve trays and can branch into Bot Arena with **Play from here**. Puzzle feedback uses an
explicit neutral/green/red state rather than relying on a sentence changing in place.

**Tutorial.** The three landing-page rule cards now open legal engine positions. The player can tap
or drag a real action and a depth-two worker replies. This keeps the tutorial instant and truthful;
it is a small playable game, not a video that can drift away from the rules.

## 2026-09-11 — Exact puzzle extraction belongs in Actions

**Question.** Can Sharp identify mate-in-one through mate-in-four positions by walking all recorded
games backward without turning a phone into a compute worker?

**Decision.** Use a dedicated exact mate solver rather than the heuristic evaluation used to choose
ordinary Sharp moves. “Mate in N” counts N moves by the attacking side and must survive every legal
defense, so mate in four searches up to seven plies. Sixty-four Actions shards scan distinct
board/reserve/side-to-move states; the browser will consume only the verified compact result.

**Repetition.** Each puzzle starts with a fresh repetition history. This matches chess-composition
practice and avoids making the answer depend on invisible moves before the displayed position.

**Provenance.** Duplicate positions become one puzzle but retain every source game and ply. Multiple
winning first moves are preserved, each with a mechanically verified representative continuation.

**Result.** The first complete 64-shard run checked 52,371 unique playable positions reconstructed
from the 1,099-game library and found 1,526 unique forced mates: 537 in one, 510 in two, 323 in three,
and 156 in four. Independent integration validation resolved all 1,780 source references back to the
exact archived position and replayed all 1,735 stored solution lines to checkmate.

**Product decision.** Ship the verified corpus as static PWA data with difficulty filters and a mixed
random mode. Do not ask clients to rediscover mates or trust the heuristic Sharp evaluator as proof.

## 2026-09-11 — One bot arena instead of separate modes

**Question.** How can challenging a bot, watching two bots, taking over mid-game, and starting from
a chosen position feel like one feature rather than four unrelated screens?

**Decision.** Model White and Black as two independently configurable seats. Each seat can be You,
Learning, Steady, or Sharp. Changing the side-to-move seat cancels its pending worker request, so a
human can take over without restarting. Reviewing and branching operate on the same timeline.

**Position editing.** The editor owns exactly one king, rook, bishop, and knight per color. Pieces
absent from the board are automatically placed in their original owner's reserve. It rejects missing
or duplicate kings, duplicate pieces, and a position where the player who just moved is left in
check. A custom position begins a fresh repetition history.

**Why not three modes.** Separate human–bot, bot–bot, and position-play controllers would inevitably
diverge on rules, history, controls, and bugs. One seat-based controller makes taking over a simple
configuration change and keeps every move behind the same legal-action boundary.

## 2026-09-11 — Unique, replayable tournament library

**Question.** How can the two 1,040-game experiments become a study corpus without presenting the
same played game multiple times or losing which engine produced it?

**Decision.** Define game identity as the complete ordered action sequence, including both initial
king placements. Engine identity is deliberately excluded from the uniqueness key: the same played
line is one game even if Sharp v1 and Sharp v2 both produced it. Every original occurrence remains
attached as provenance with run number, game index, and both exact AI versions.

**Result.** The 2,080 records collapse to 1,099 unique games; 981 repeated records are removed. A
static 1.1 MB compact dataset ships with GitHub Pages and can be filtered by either AI, result, and
Sharp version. Every line can be replayed one ply at a time or automatically at one ply per second.

**Why static.** The corpus changes only when an experiment runs. Prebuilding it keeps filtering and
replay instant, works offline, and adds no database or server. The checked-in builder makes the
transformation reproducible from future tournament artifacts.

## 2026-09-11 — Tournament run 2: evaluate Sharp v2

**Question.** Does repetition-aware equal-score tie-breaking reduce dull draws without increasing
Sharp's losses?

**Result.** Across the same seeded 1,040-game schedule, threefold draws fell from 467 to 430 and
total draws from 48.8% to 46.2%. Sharp–Sharp draws fell from 89.9% to 87.5%. Against Learning and
Steady combined, Sharp's wins rose from 483 to 504, losses from 28 to 30, and score from 77.34% to
78.49%. The extra two losses mean the strict “without increasing losses” test was not met, although
the score improvement and small loss delta are consistent with a practical improvement.

**Decision.** Retain Sharp v2 as the current default because it produces more wins and fewer
repetitions while preserving the rule that a saving repetition remains preferable to a loss. Do not
change Schness's rules. Do not yet call v2 categorically stronger.

**Next measurement.** Run multiple independent seeds and direct Sharp v1–v2 matches with colors and
all king starts reversed. Treat non-repeating 200-ply draws as a separate engine-conversion problem.

See the [full run-2 report](docs/tournament-report-2026-09-11-sharp-v2.md).

## 2026-09-11 — Japanese live-state coverage audit

### Tutorial interaction parity

The king-placement tutorial applied the placement wash but omitted the shared target class that
draws the real game's destination dot. Tutorial setup and Bot Arena setup now treat legal king
squares as both placements and targets, matching normal play exactly. A regression test locks the
four initial White home-row markers. The English language control is shortened from `日本語` to
`日本` to keep the compact navigation rhythm requested for the bilingual interface.

### Phone navigation: fixed-footprint controls

**Follow-up.** Fixed footprints solved wrapping, but replacing familiar words with a mixed set of
moon, note, plus, and question-mark glyphs made the product feel less considered. The controls now
use short text again inside compact 44px targets. The S mark still reserves enough horizontal room,
so Japanese remains on one line without sacrificing clarity for decoration.

The first responsive pass still depended on translated label widths and left the stylesheet at its
old URL, so a phone could either squeeze Japanese controls or keep serving the pre-fix CSS. Mobile
navigation now uses the established S app mark and four fixed 44px control slots: language, theme,
sound when present, and rules. Text remains available through each button's accessible name. All
five documents reference the same versioned stylesheet, forcing existing PWA installations to fetch
the correction rather than reusing the bad cached asset.

### Mobile navigation and first-screen hierarchy

The first Japanese production screenshot exposed two design failures: header action labels were
allowed to wrap character-by-character, and the desktop-scale lobby gap pushed the useful choices
too far below the fold. The shared mobile header now guarantees one-line controls, reduces the
wordmark before sacrificing actions, and falls back to the established S mark only on extremely
narrow screens. The lobby removes the redundant format eyebrow and brings its purpose and first
actions into the initial viewport. These constraints apply across every page rather than patching
the Japanese landing page alone.

### Production startup regression

The initial language switch used one selector list for the action group, navigation, and header
fallback. DOM query order selected the ancestor header, then `insertBefore` rejected its nested theme
button as a reference child. That exception stopped lobby initialization, leaving every front-page
button inert and the language control absent. The lookup now performs explicit fallbacks and a
regression test protects the required action-group target. The PWA cache was advanced immediately.

**Problem.** The first bilingual release translated the static pages, but several messages that only
appear during a live match remained in English. Japanese also needs more horizontal room in the
smallest game header than English does.

**Decision.** Keep one shared interface and expand the translation boundary instead of creating
separate Japanese templates. Cover connection recovery, media permission failures, draw and
takeback requests, rematches, tutorial prompts, selection help, clocks, reserves, and move-history
sentences. Below 361 px, retain the S product mark but hide the repeated Schness wordmark on the
game page so language, theme, and rules controls remain usable without wrapping.

**Verification.** Added regression coverage for live network, media, tutorial, move-history,
selection, and clock text. The service-worker cache was advanced so installed copies receive the
corrected interface.

## 2026-09-10 — Sharp v2: repetition aversion

**Question.** Is the 89.9% draw rate in Sharp–Sharp evidence that Schness is intrinsically dull, or
that Sharp v1 voluntarily repeats positions it evaluates the same as alternatives?

**Evidence.** Tournament run 1 produced 1,040 games: 276 White wins, 256 Black wins, 467 threefold
draws, and 41 ply-limit draws. Sharp–Sharp drew 187 of 208 games. See the
[full run-1 report](docs/tournament-report-2026-09-10.md).

**Alternatives considered.**

- Change the game rules to suppress draws. Rejected before testing the bot: ordinary engine chess
  also has a high identical-engine draw rate, and changing a novel game's rules to compensate for
  one search policy would confound the experiment.
- Give every draw a negative score (“contempt”). Deferred: this can make Sharp reject a guaranteed
  draw for a genuinely worse position and would change objective playing strength.
- Prefer a less-repeated result only when candidate moves have the same minimax score. Chosen: it
  changes tie-breaking, not the primary evaluation, so a repetition that saves a loss remains valid.

**Decision.** Sharp v2 keeps depth-four alpha-beta, the existing evaluation and seeded random tie
breaking. Among moves with the same search score, it first minimizes the occurrence count of the
immediate resulting position. Learning v1 and Steady v1 remain unchanged as controls.

**Reproducibility.** Tournament schema 2 records the rules and both players' exact level, version,
depth, and behavior in the artifact manifest and every game. `ANALYZE.md` repeats these notes for
human and AI readers.

**Next measurement.** Rerun the same 1,040-game plan and seed. Compare Sharp–Sharp repetition draws,
decisive-game rate, game length, and Sharp's score against both lower levels with run 1. Do not call
Sharp v2 better if it merely converts draws into losses.

## 2026-09-10 — Tournament run 1: establish a baseline

**Question.** How strong is each AI level, is there a meaningful first-player advantage, is a corner
king generally best, and what produces checkmate?

**Decision.** Use an Actions-only experiment rather than the browser, covering all 16 king-start
pairs and both colors against lower levels. This keeps phones responsive and produces one complete,
reproducible dataset for external analysis.

**Result.** Sharp clearly outperformed Steady and Learning, overall color advantage was small, 77.4%
of mates were delivered by rooks, and a universal corner-king advantage was not supported. High
Sharp–Sharp repetition motivated Sharp v2. Full numbers and caveats are in the
[run-1 report](docs/tournament-report-2026-09-10.md).
## 2026-09-12 — One board contract and browser-level user stories

**Problem.** Match, tutorial, arena, editor, puzzle, and library screens independently built and
painted sixteen squares. Their CSS happened to be shared, but behavior and accessibility could
drift; the archive could again lose reserves without the live match noticing. Unit tests also
proved rules and source patterns without proving that a player could complete the real browser
flows.

**Decision.** `board-ui.js` now owns board construction, orientation, accessible rows/cells, pieces,
and visual state. `piece-ui.js` owns the stable three-slot reserve everywhere. All six dynamic board
surfaces call those primitives, and each exposes the same `data-schness-board` contract. Add a
Playwright happy-path suite in desktop and mobile Chromium, kept as a separate CI job so browser
failures retain screenshots and traces without obscuring fast unit failures.

**Interaction follow-ups.** Bot matches can switch the human seat between White and Black. Bot
Arena keeps its transcript internally scrolled instead of using `scrollIntoView`, which moved the
entire page away from the board. During a deliberate drag, the real source is hidden while the
pointer ghost is visible; an invalid release restores it, while a legal release commits the move.

**Why not screenshots alone.** A screenshot can show matching boards while clicks, orientation,
reserves, or routing are broken. The E2E stories exercise those transitions and assert the shared
component marker and three reserve slots wherever a complete position is displayed.
# 2026-09-12 — Opt-in training analysis

Added independent forced-mate hints for bot training and a White-positive advantage bar in bot
training and recorded-game replay. Reused the exact puzzle solver for mate rather than treating a
Sharp preferred line as proof; the bar uses a depth-three bot heuristic because exhaustive mate
proof is inappropriate as a continuous advantage estimate. Both features default off, exclude
online human matches, and compute in a disposable worker. An unfinished five-second mate search
reports inconclusive, not "no mate". This keeps the UI responsive and avoids misleading players.
# 2026-09-12 — Training entry point and clock setup

Follow-up to the initial training implementation: the homepage's primary bot action opens Bot Arena,
but training controls existed only on a legacy bot match page, so users could not find them. Exposed
both opt-in controls next to the Arena board, with the same cancellable worker; preserve the game
library replay toggle. Moved the online time-control selector from a homepage disclosure to a
pre-invitation dialog and made bot games untimed regardless of a previously selected online clock.
Removed the duplicate "Replay interactive tutorial" setting because the homepage's three playable
rule demonstrations are already reachable there. Added arena and invitation browser-path tests.
# 2026-09-12 — Correct defensive mate prediction; simplify evaluation rail

The first mate-warning implementation only asked whether the side-to-move could mate. A player
whose opponent had a forced mate therefore saw "no mate", even when every available defense lost.
The proof now tests both sides from the unchanged position, distinguishing an unavoidable opposing
mate from a mere risky candidate move. On human turns it also lists legal moves that allow an
opponent mate in one (then two if time permits). A five-second budget still reports inconclusive
past its proven depth. Reworked the advantage bar into a compact B/W board-height rail; the numeric
heuristic and its "estimate" label live in the panel, where they cannot overlap either reserve.
Browser CI also caught a duplicate import that prevented Bot Arena from starting; added syntax
checks for every training entry module so this kind of failure is caught before browser tests.

# 2026-09-12 — Consolidate board and bot-profile ownership

Audited the UI and engine import paths. Five dynamic board callers already share
`board-ui.js`, but piece SVG creation and reserve trays lived in `piece-ui.js`.
Moved those primitives into `board-ui.js` and removed the extra module; adjusted
the offline cache and source-contract tests. Live bot play used Learning depth 1,
whereas the arena and tournament used depth 2. Established `settings.js` as the
single profile map (2/3/4), retaining the arena/tournament Learning depth and
making live bot play consistent. Two worker entry points remain deliberate:
move searches and longer exact-mate analyses must not block one another.

# 2026-09-12 — Advantage rail geometry

The B/W rail had two nested sets of rounded corners: the dark container and the
white fill. The fill's curved bottom edge exposed a light-looking sliver of the
underlying dark track, especially on narrow phones. Keep just one clipped outer
silhouette; extend the rectangular fill edge to both sides. Make the track fill
the entire rail and overlay the W/B labels instead of reserving separate blocks
that create seams. The numeric estimate stays outside the rail in the tools panel.
Browser tests now assert the clipped geometry and unchanged board width.

# 2026-09-13 — App-wide Basecoat trial

Question: can a shared component vocabulary make the repeatedly patched interface
more consistent? Audited all five pages and migrated controls together in one
reversible PR. Use pinned Basecoat 1.0.2 Nova locally, with Schness theme tokens and
one integration stylesheet. Rejected a CDN dependency (offline/CSP) and custom
select/dialog runtimes (unnecessary behavior changes). Preserved boards/reserves,
AI, P2P, clocks, drag handling and mode-specific layouts. Added language/theme
overflow and tap-target browser checks. The bundle adds about 223KB before HTTP
compression; next measurement is real-phone usability and compressed transfer,
not another UI dependency. Revert the single squash commit if the trial feels worse.

# 2026-09-13 — Give surface cards their own padding

Mobile feedback exposed controls flush with the puzzle mix card's edge. Its parent
becomes `display:contents`, so parent padding cannot protect it. Give settings,
statistics, filters, analysis, network/result and spectator/tutorial panels a
shared internal inset (16px desktop, 14px small phones); increase the puzzle action
dock inset too. Leave board cells and piece trays unchanged. Test the visible
settings controls against the actual card bounds rather than just its CSS class.

# 2026-09-13 — Stronger, more generous panel insets

Follow-up feedback requested more breathing room. Increase shared surface insets
from 16/14px to 20/16px, cover replay and dialog surfaces, and give selectors enough
specificity to beat legacy nested-panel overrides. Increase the puzzle dock to 12px
and make checkbox text wrap without shrinking its checkbox. Keep board geometry
unchanged. Browser tests measure a minimum 16px settings inset in all themes/languages.

# 2026-09-13 — Remove broad tutorial separator bands

Basecoat integration increased the rule-strip gap from 1px to 1rem while retaining
its brown border-color background. The exposed grid gaps therefore became thick
bands. Restore the intentional 1px gaps rather than altering card padding. Add
computed-gap browser checks in both themes, with tutorial activation preserved.

# 2026-09-13 — Fix stale evaluation and remaining audit notes

A new position previously retained the old advantage fill and ARIA score while
searching. Clear the number, show an unknown neutral track, restore only a finite
current-request result, and invalidate replies on cancellation. Errors/timeouts
remain unknown rather than even. Add a behavioral worker lifecycle regression
test. Define tutorial link color through the tested accent-text token and correct
CLAUDE.md to require unit and desktop/mobile browser CI, not just unit tests.


# 2026-09-13 — One divider after the tutorial list

The tutorial list bottom border and adjacent demo top border both drew separators.
Remove only the adjacent demo's top border, leaving the list divider and all demo
spacing intact. Browser coverage opens a lesson and checks both border widths.

## 2026-09-13 — Select, reserve, and desktop modal spacing

Inset native-select chevrons by 1rem with locally cached, theme-specific SVGs and reserve text clearance. Added 10px between reserves and boards on arena, replay, puzzles, and tutorial. Restore viewport centering for every desktop native dialog after the Basecoat reset; retain mobile layouts and native focus behavior. Added browser regression checks for these geometry constraints.

## 2026-09-14 — Explicit human color choice

Bot Arena now exposes a Play as White/Black selector (plus watching both bots), instead of requiring users to swap two controller dropdowns. Changing color starts a fresh game, preserving the bot strength. Black waits for White's bot king placement before placing their own king. Added pure seat-selection unit tests and browser coverage for both colors.

## 2026-09-14 — Rules and practice in one place

Removed the homepage tutorial strip. A single shared Rules modal now contains the rules and playable king-placement, deployment and capture lessons, using the existing board and bot worker. Rules is present in every page header. Closing the modal cancels pending tutorial replies without affecting the actual match. First homepage visits can still start learning; invite pages never auto-open it. Browser coverage exercises the tutorial from all five pages.

Move-history surfaces also offer a persistent Coordinates toggle. The shared board renderer draws small top-right algebraic labels; labels follow logical squares, remain pointer-transparent and do not interfere with dragging.

## 2026-09-14 — Immediate tutorial board and contextual rule actions

Opening Rules now immediately initializes the current playable lesson, without a second activation step. Each Try it button sits directly after its explanation in the numbered list. Removed the separate lesson button cluster and hid the redundant close-demo control; closing Rules still cancels tutorial work. Added all-page browser checks for immediate board visibility and button-to-rule associations.

Removed the separate gotchas section; the no-check-on-deployment restriction remains directly in Move or deploy so the simplified modal does not omit a core rule.

Coordinates now use a checkbox beside move histories and start unchecked on every page. Tutorial drag ghosts are appended inside the native dialog's top layer, preventing them disappearing behind the modal when their source is hidden.

## 2026-09-15 — Tutorial coordinate control removed

The shared Rules tutorial no longer shows a Coordinates checkbox. Coordinate labels remain opt-in beside real move histories in matches, Bot Arena, and library replays; the instructional modal stays focused on learning the rules.

## 2026-09-16 — Online two-browser discovery recovery

A real Chromium two-context test opened the same invite and exchanged a move, so yesterday's specific failure did not reproduce today. Audited the waiting protocol and found initial `hello` packets had no retry; if lost before the other browser registered an action handler, both pages could keep waiting indefinitely. While unmatched, send a waiting announcement every four seconds and stop on leave. Added a deterministic unit test dropping both initial hellos plus a real two-browser CI test. Relay outages and network paths that cannot establish WebRTC still depend on external infrastructure; this change addresses missed discovery packets.

After twenty seconds without a peer, the waiting screen now explains the exact-link requirement and that an open relay socket cannot prove successful discovery; matchmaking continues retrying.

## 2026-09-20 — Design pass: what was decided, and what is still unproven

**Question.** A fifteen-stage design brief asked for one colour/type/spacing system, a new mark, one
board treatment, real navigation, a playable home page, rebuilt connection states, an online rail that
never outranks the game, a simplified arena, a legible library, four button roles, Japanese parity, and
an accessibility pass. Most of it is straightforward execution. Seven choices were not, and those are
recorded here rather than left to be rediscovered.

**Pieces stay stock.** The brief said to "decide the palette and make `THIRD_PARTY_NOTICES.md` agree."
Two ways to agree: recolour the Chessnut pieces to the ember/ink palette and amend the notice, or keep
them unmodified and say so deliberately. Rejected recolouring: the artwork is the one thing on screen
not authored here, its licence turns on whether it was modified, and a recolour buys a closer palette
match at the cost of a claim in a licence file that someone has to keep true forever. `THIRD_PARTY_NOTICES.md`
now records the stock artwork as a decision, not an oversight. Next measurement: if the ember accent ever
lands next to a piece and reads as a clash, revisit — nothing on any of the five pages does today.

**A QR encoder, written rather than dropped.** The brief offered the QR code as optional ("drop it if you
disagree"). Dropping it was real: it is ~300 lines of pure code for one affordance on one card. Kept it
because the alternative for a phone opening a desktop invite is retyping a URL with a random room id, and
because a CDN or npm dependency is forbidden by the no-runtime-deps rule, so "use a library" was never on
the table. `src/qr.js` is byte-mode, EC level M, versions 1–10. **Evidence:** verified module-for-module
against python `qrcode` for every in-range string at the reference's own mask; three bugs surfaced that no
amount of eyeballing would have caught — a Reed–Solomon generator polynomial built ascending and indexed
descending, format information written LSB-first, and the second format copy split 8+7 instead of 7+8 so it
collided with the dark module. Alignment-pattern centres on the timing row were being skipped, which from
version 7 onward shifted every subsequent data module. **Unproven:** no camera has ever read one of these.
The matrices match a reference implementation; that is not the same as a phone decoding a screen. Next
measurement: point a real phone at the waiting card.

**`aria-pressed` dropped from the theme toggle.** The brief asked for it. Implemented, then removed: the
button's label is an action ("Switch to dark theme"), and a pressed state on an action label says the
opposite of what the label says — a screen reader reads "switch to dark theme, pressed" on a light page.
`aria-pressed` also drew it engaged through `body .btn[aria-pressed="true"]`. Kept the action label and the
dynamic `aria-label`; this is a deliberate deviation from the brief's wording, not an omission.

**CSS weight: measured, and the sheets stay unsplit.** The brief expected the deletions to take roughly a
third off. They did not. `styles.css` + `ui.css` went 89,785 → 90,258 bytes: about 4,300 bytes of dead and
superseded rules came out, and the pass (board states, button roles, the connection cards, the library mini
board) put slightly more back. Coverage over the five pages matches 454 of 539 selectors, so there is no
large unused tail to split off. Rejected splitting per-page sheets: it would add five request paths and five
more entries to the service worker's precache list to save a few kilobytes that are already cached after the
first visit. Recorded in `DECISIONS.md` with the numbers so the next person does not re-measure to find the
same answer.

**The arena asks one question, then a second only when it matters.** The brief said one seat control instead
of three. Strictly one loses the ability to set each bot's strength when watching bot-vs-bot. Landed on one
seat control, with the per-side strength selects shown only for the sides a bot is playing — one question
when playing, two when watching, never three.

**Rules before board on a phone.** In the rules dialog at 390px the board and the four rules cannot both be
above the fold. Rejected board-first: the dialog's job is the rules, the board is the demonstration, and a
dialog that opens on a board asks people to scroll up to find out what they are looking at. The dialog opens
at the top and the demo is sized `min(100%, 22rem, calc(100svh - 25rem))` so it is fully visible without
cropping once reached. **Evidence:** board fully within the viewport at four sizes down to 390×700.

**No dedicated 16px favicon.** The mark's defining feature is a 4-unit gap where the corner block left the
board. Rejected shipping a simplified 16px variant: the gap survives rasterisation at 16px in Chromium, and
a second mark is a second thing to keep in sync. **Unproven on a non-retina display** — checked in one
browser on one machine. Next measurement: look at the tab on a 1x screen.

**What none of this verified.** This is a sandbox: no camera, no second peer, no live relay. The online path
— chat, voice, the connection report, the three connection states reached by actually waiting — has never run
between two real browsers on two real networks. `connectionReport()`'s `relayed` branch cannot fire at all,
because trystero ships STUN and no TURN. `e2e/online-connect.spec.js` fails here, and failed identically at
baseline, for that reason.

## 2026-09-21 — The puzzle board was capped by a number that bought nothing

**Problem.** Reported from use: the puzzles board is very small on a phone. It was. Measured in
Chromium: 332px at 390×844, 288px at 390×800, 188px at 390×700, 128px at 360×640 — against 366px of
available width. The board is the whole content of that page and it was rendering at a third of the
screen on a small phone.

**Cause.** My own fix from the design pass. The board sits above a fixed action bar, and it had been
overlapping it, so I sized the stage `min(100%, calc(100svh - 32rem))` — tying the board's *width*
to the viewport's *height* minus a 512px constant. It cleared the bar, I measured the clearance
once, and I shipped it. What I never checked was whether the constraint was buying anything.

**It was not.** The page scrolls at every mobile height — 1,009px of content at 844 tall — so
capping the board never made the page fit. It only made the board smaller. The whole premise of the
rule was wrong, not merely its constant.

**Decision.** The board takes the width it has; the fixed bar is cleared by reserving space below
the content, which is what a fixed bar actually needs. Rejected tuning the constant: a smaller
subtrahend would still tie width to height for no gain, and would still be wrong at some height I
had not tested. Rejected making the bar non-fixed: on a phone the action bar in the thumb zone is
worth more than the few pixels it costs.

**Evidence.** Board now 366px at 390 wide and 336px at 360 wide, constant across all four heights.
Scrolled to the end, nothing in the flow sits under the bar or the feedback strip at any of them —
worst case 10px of clearance at 360×640, checked in both feedback states.

**What I should have done the first time.** The design pass verified this by hand and left no test,
which is exactly why it could regress to a third of its size without anything going red. There is
now an e2e guard, and I confirmed it fails against the old rule (332px where 366px is required)
before trusting it.

**Found while fixing it.** Every page's rules dialog carries a `.puzzle-feedback` of its own, and
the design pass's `position: fixed` rule was written against the class, not the id — so on any
phone-width page, getting a tutorial answer wrong pulled the lesson's feedback out of its panel and
parked it at the foot of the screen. Scoped to `#puzzle-feedback`.

**Also.** `e2e/online-connect.spec.js` still probed `#search-stalled` and `#search-quiet` in its
failure handler; Stage 7 deleted both, so the diagnostic reported `false` for them however the page
had actually failed. It now reports the status line and which connection card is showing. Exercised
against the sandbox's blocked relays: it correctly reports "no relay is answering yet" on
`card-waiting`.

**Next measurement.** Whether the `:has()` rule that widens the bottom padding for the feedback
strip holds up in browsers without `:has()` support — there, the strip overlaps by ~38px. Every
target browser has shipped it since 2023; worth a look if analytics ever says otherwise.

## 2026-09-21 — The rules dialog on a phone is a stepper, not a reflow

**Question.** The revised brief asks for one rule per screen on a phone. The existing mobile layout
was the desktop dialog stacked: four rules in a column, the demo board taking about half the
viewport, the instruction *below* the board it described, and no next/prev control at all —
scrolling was the only way to reach rule 2.

**Rejected: keep reflowing, just tighten it.** A single column can hold the rules or the board, not
both, and no amount of tightening produces a control that does not exist. The reason to read rules
on a phone is to do the thing they describe; a layout where the instruction arrives after the board
has that backwards.

**Decision.** A stepper: one rule per screen, a four-segment bar and "Rule 3 of 4", the instruction
above the board, Back / Next pinned to the foot, and Next becoming "Start playing" on rule four. It
drives the existing per-rule "Try it" triggers rather than reaching into the tutorial, so there is
still exactly one thing that knows how to open a lesson.

**The constraint that sized everything.** The brief requires the whole step to fit at 390×844
without scrolling. Measured, the first attempt overflowed by up to 57px, so: the board is capped at
`clamp(11rem, calc(100svh - 39rem), 20rem)` (220px there), the panel loses its chrome, and the
resting feedback strip is hidden — in its "ready" state it says "Your turn — tap or drag a piece",
which the instruction directly above the board has just said, and it was costing 54px to repeat it.
The `clamp()` floor is not decoration: an expression with no lower bound is precisely how the
puzzles board reached 128px, fixed earlier today. Below the floor the step scrolls, which is the
right trade — a board too small to read is worth nothing.

**Evidence.** All four steps at 390×844: one rule visible, the instruction above the board, and
`scrollHeight === clientHeight`. Back disabled on rule one, "Start playing" on rule four, and
pressing it closes the dialog.

**Two bugs found while building it.**

1. The stepper opens a lesson to match the rule you are standing on, and opening a lesson calls
   `showModal()`. Laying itself out at load therefore *opened the rules for you* — the exact
   invariant `DECISIONS.md` states, and one I had already tripped over once during the design pass.
   It is gated on the dialog being open, and the e2e test asserts the dialog is closed on load.
2. Moving the instruction into the demo's right-hand column collapsed the board to **12px on
   desktop**. The stage's width was `min(100%, 22rem, …)` and it sits in a `1fr` column: a
   percentage against a track sized from its own content resolves to zero. The percentage is gone.
   This one is worth remembering — it did not look like a layout bug, it looked like the board had
   stopped rendering.

**Test changes.** Four existing tests drove the tutorial by clicking per-rule "Try it" buttons,
which the stepper hides and presses for you. Rather than loosen them, `e2e/rules-dialog.js` now
offers `openLesson` and `closeRules`, which drive whichever layout is on screen, so each test still
asserts what it always did.

**Next measurement.** The stepper's board is 220px at 390×844. Whether that is big enough to learn
a capture on is a question for someone holding a phone, not for a measurement.

## 2026-09-21 — Online joins the nav, and two lines of the brief I did not follow

**Nav.** The design pass gave the header a `<nav>` with Bot arena, Library and Puzzles. The revised
brief adds Play and Online, and it is right about why: starting a game against a person was
reachable from the lobby and nowhere else, which makes a primary thing a side door. The wrinkle is
that Online's target is a dialog, not a page. Rejected giving it its own page for the sake of being
a link — the dialog is three radio buttons and a submit. Rejected a `<button>` in the nav, which
would be the only non-link in a row of links. It is `./index.html#online`: a real link that
cmd-clicks and copies, navigating from elsewhere and opening in place on the lobby. Closing it
strips the hash, or a refresh reopens a dialog nobody asked for.

**Measured** at 390, 360 and 320px in both languages: wordmark holds at 102px, no sideways scroll,
all five items on one row at 390px. At 320px the nav scrolls horizontally, which is what its
`overflow-x` was already there for.

**Two deviations from the brief, both deliberate, both repeated from last time.**

1. **`aria-pressed` on the theme toggle** (Stage 13). Asked for twice now; still wrong, and I want
   the reasoning on the record rather than just the decision. The button's visible word is the
   *action*: it says "Dark" while the page is light. For `aria-pressed` to mean anything it has to
   describe the control's own state, and WCAG 2.5.3 wants the accessible name to contain the
   visible label — so the name has to keep flipping with the action word. Work it through and the
   pressed state is `false` in both directions, because the button always offers the theme that is
   *not* active. A constant attribute is not information. The alternative is to relabel the control
   with its current state rather than its action, which is a different button than the one the
   design asks for. It keeps a dynamic `aria-label` and no `aria-pressed`.
2. **The 0:20 waiting line** (Stage 7a). The brief's table puts "Still listening — no relay is
   answering yet" at twenty seconds. That sentence is a claim about the relay pool, and at twenty
   seconds the app has not detected anything of the kind — the overwhelmingly likely truth is that
   the friend has not clicked yet. Saying it on a timer would be the interface guessing out loud.
   The shipped schedule keeps that sentence for when a dead relay pool is actually detected, where
   it outranks the clock at any elapsed time, and the timed 0:20 line says what is actually known:
   "no one has opened the link yet".

**Next measurement.** Whether anyone uses Online from a page other than the lobby. If nobody does,
the nav item is costing a row of space at 320px for nothing.

## 2026-09-21 — Two corrections from use

**"Play" in the nav was useless.** Reported, and right. It shipped in the morning's nav as
Play · Online · Bot arena · Puzzles · Library. From the lobby, "Play" pointed at the page you were
already standing on; from anywhere else it went to a board you then had to scroll to find. The
wordmark is already the way home, so the entry was a second home link wearing a verb.

**Decision.** One entry, **Play online**, doing what the nav entry people actually want: opening the
invite dialog. Rejected keeping both and renaming "Play" to "Home" — the wordmark is the home link
on every site, and a nav that spends its first slot restating it has one slot fewer for
destinations. Four items now, and at 390px they fit one row in both languages with the wordmark
still at 102px.

**The invite dialog was not centred, and I had measured that it was.** Both are true, which is the
interesting part. On a desktop it centres exactly — 504px either side at 1440×900. At ≤760px it was
`.is-sheet`: a full-width bottom sheet flush to the bottom edge, which the brief asked for and
which my test asserted *as a sheet*, so nothing was red. The test was checking that it matched the
shape I had decided on, not that the shape was right.

**Decision.** Centred at every width. The reasoning for the sheet — the primary action lands in the
thumb zone — is sound for a tall sheet full of content. This dialog is three radio buttons and a
submit, about 290px tall, and a small box pinned to the bottom edge reads as displaced rather than
placed. Measured after: 16px either side and 277px top and bottom at 390×844. The `.is-sheet` class
went with it rather than sitting in the stylesheet unused; if a sheet earns its place later it
returns as a class, not as a rule on one dialog's id.

**What to take from it.** A geometry test proves a dialog is where you told it to go. It cannot
tell you that you told it to go somewhere wrong. The measurement that would have caught this is
someone opening the thing on a phone, which is exactly the check I have repeatedly noted I cannot
run here.

## 2026-09-22 — Looking for what the tests could not see

**Method.** With the reported bugs fixed and the suite green, the useful question is what a green
suite cannot tell you. Two sweeps rather than two guesses: every page rendered at 390 and 1440 in
both themes, and every page loaded in Japanese with every visible text node inspected.

**Found: the Japanese site was still partly English.** The rules stepper I shipped yesterday
carries its own chrome — "Rule 1 of 4", "Back", "Next rule" — and none of it went through
`i18n.js`. "Start playing" *was* translated, which is what made it look fine in passing: that string
already existed for the desktop footer button, so the one label I happened to glance at was the one
label that worked.

**And an older one.** The library's count line reads `1,099 unique games`. There has been a
translation pattern for it all along — `/^(\d+) unique games?$/` — which cannot match, because the
number is written with `toLocaleString()` and carries a comma. It has been silently failing for
every library with more than 999 games, which is every library this project has ever shipped. The
summary line under the heading had no translation at all.

**Decision.** Fix all three, then stop testing this one string at a time. The guard is now a sweep:
load every page with `lang="ja"` and assert that no visible text node is pure Latin script, with
carve-outs for numbers, separators, the AI names (proper nouns), and the language toggle, which by
design names the language it switches *to*. Confirmed to fail against the two library strings before
being trusted.

**Rejected:** adding the three missing strings and moving on. Three bugs of one shape in one
codebase is a pattern, and the shape is "a test that names the strings it knows about cannot report
the ones nobody thought of".

**Also.** `test.yml` now bounds both jobs — 10 minutes for unit, 20 for e2e, against a typical two.
Without a bound a wedged job holds a runner for the six-hour default and reads as "still running"
rather than as a failure. That is not hypothetical here: I have twice sat watching a run that had
either already finished or was never going to.

**Not found, and worth saying.** The visual sweep turned up nothing I would call a defect. The one
thing I would still change is the invite card's link field, which truncates to
`http://…/ga…` — on a real host the game id, the only part that distinguishes one invite from
another, is never visible. The Copy button makes it work; it does not make the link the hero the
design says it is. Left alone for now because it needs a layout decision, not a patch.

**Next measurement.** Someone opening the site on a phone. Still the gap behind every entry above.

## 2026-10-23 — Checking-drops viability experiment

**Question.** Does Schness become more decisive or tactically interesting when a reserve deployment
may immediately check the opposing king?

**Implementation.** Added an explicit `allowCheckingDrops` ruleset flag. It defaults off, so the
published game remains unchanged. With it on, the legal-action generator lifts only the
no-check-on-drop restriction; self-check, occupied-square, ownership, checkmate, stalemate, and
threefold rules are unchanged. Position keys include the ruleset to prevent repetition or peer-sync
collisions. Old positions without rules metadata use canonical quiet drops.

**Research contract.** Tournament schema 3 records the flag in every game and manifest, generates the
matching human-readable rule list, and refuses to aggregate shards from different rulesets. The
GitHub workflow has a manual Checking drops input and an experiment-branch trigger. Unit coverage
proves canonical checking drops remain illegal, variant checking drops are legal and preserved, the
two rulesets have distinct position keys, and tournament transcripts are reproducible with explicit
provenance.

**Smoke result.** An 80-game, eight-ply local pipeline run completed and aggregated successfully
(78 ply-limit draws and 2 White wins). That run validates the data path, not viability: eight plies
is deliberately too short for a strategic conclusion. The full 1,040-game GitHub Action is the
measurement.

**Full result.** [Run 39895779482](https://github.com/KakkoiDev/schness/actions/runs/39895779482)
completed all 1,040 games with verified checking-drop provenance. White won 979 (94.1%), Black 47,
and only 14 games drew. Sharp–Sharp was 197 White wins, 10 Black wins, and one draw. Median length
collapsed from the canonical 54 plies to 9. All games contained a checking drop: White checked by
drop on ply 3 and again on ply 5 in every game. Despite fewer formal repetitions, the corpus had
only 359 distinct action sequences versus 897 canonically. Steady as White beat Sharp as Black
204–0 with four draws, proving that initiative overwhelmed engine strength.

**Decision.** Reject checking drops for standard Schness. They make play decisive but severely
first-player-biased and less varied. Retain the ruleset switch only for reproducible research; do
not expose it in matchmaking or mix its records into canonical datasets. A future compensation
idea must first pass an 80-game pilot with White below 60% of decisive games before spending a full
tournament run. See the [full variant report](docs/tournament-report-2026-10-23-checking-drops.md).

## 2026-10-23 — Screen deployment and setup alternatives

**Question.** Can restricting the opening checking-drop chain rescue the variant? The user
requested all proposed experiments, including an explicit comparison of lone-king protection
that returns after captures versus protection ending permanently after first deployment.

**Alternatives and implementation.** Ten research presets cover two controls, both protection
rules, three-turn grace, quiet return drops after that grace, and full quiet setup with later
checking drops on/off and White/Black taking the first normal turn. Research rights live in
positions and relevant rights enter position hashes; transcripts record actual movers because
Black-first setup breaks ordinary ply parity. Blocked setups are measured as a separate draw.
The standard public rules remain canonical. See docs/deployment-variant-experiments.md.

**Evidence and decision.** The unrestricted result motivates a screening stage, not an assumption
that any compensation works. Tests exercise the two lone-king interpretations, grace, returned
pieces, all setup transitions and full transcript replay. Actions runs a balanced 80-game pilot
per preset and automatically expands qualifying candidates to 1,040 games under the documented
gate. No variant is selected before results exist. Avoid launching ten full tournaments before
screening because gross imbalance and blocked setup can be detected more cheaply.

**Next measurement.** Compare outcomes by color, engine matchup, king starts, blocked setups,
normal-play length, checking drops and transcript diversity; inspect full results for promoted
candidates. Pilot failure is a screening outcome, not a mathematical rejection of the rules.

### Deployment suite outcome

Actions run 39946077456 completed all ten pilots and three full expansions. The release digest
matched and all 3,920 stored records replayed exactly (3,680 distinct scheduled variant/game pairs;
full runs include pilot prefixes). Full quiet setup with White starting produced 283/278/479
White/Black/draw outcomes and 1,017 distinct transcripts: the best candidate for human playtesting,
though draws remain 46.1%. Recurring lone-king protection produced 363/464/213 and fewer draws,
but Sharp–Sharp favors Black 91 to 52. Quiet returns produced 288/339/413 and add memory burden.
Opening-only protection failed the pilot balance gate; grace and White-first checking setup were
borderline and deserve new-seed confirmation rather than categorical rejection. No observed
setup was blocked. Keep canonical default; see docs/deployment-variant-results.md for evidence,
limitations and next measurements. The prior preference for setup with checking drops did not
win this screen.

## 2026-10-24 — Symmetrical checking-drop restrictions and private setup

**Question.** Does the recurring-protection Black advantage come from Black receiving the first
checking deployment after White quietly deploys? The user requested all six proposed alternatives,
two borderline repeats, and quiet first post-king turns for both sides. This causal mechanism
remains a hypothesis, not an inference established solely by aggregate wins.

**Alternatives.** Added quiet first turns alone and with recurring protection; permanent mutual
one/two-distinct-piece gates; one checking-drop budget; checking-drop cooldown; no immediate drop
mate; private home-rank setup with later checking drops on/off. Private setups are independently
seeded uniform legal arrangements rather than pretending the perfect-information search is a
hidden-information strategist. Precommit both armies before serialized replay. Repeat grace and
White-first checking setup; include canonical/unrestricted/recurring controls.

**Decision and evidence.** Screen all fourteen presets across three fresh seeds, combining pilot
results before automatic promotion to three full tournaments. Avoid selecting only favorable
seeds. Tests cover rights, both first turns, actual checking-drop mates, private setup for every
king start, and full transcript replay. See docs/variant-wave2-experiments.md. Results pending.

**Next measurement.** Compare color and equal-engine balance, development timing, checking-drop
usage, mates, draws, length and diversity. Keep the default unchanged pending results. The user
also requested selectable/random game variants and cyberpunk/classic visual concepts; mockups
are to be reviewed before implementing the styling.

## 2026-10-24 — Playable variant selector, design concepts and Lab proposal

**Question.** Let players try the tested rules and a random complete preset; explore a cyberpunk
neo-purple appearance while retaining a clean Classic alternative; propose dynamic boards and
point-budget armies, including queens, duplicate queens and fairy pieces.

**Implementation and alternatives.** Share preset definitions between research and the arena.
Random selects one complete ruleset rather than composing incompatible toggles. Store resolved
identity/seed in the URL and show the rules before play. Human reserve interaction works during
full setup; hidden setups reveal precommitted random armies. Replays use actual movers; editing
resets to canonical because historical rights cannot be inferred from a board. The first release
is arena-only; online invitation negotiation is not silently changed.

**Design decision.** The user chose mockups first, so no cyberpunk CSS or lightning is shipped.
Generated cyberpunk and Classic concept sheets are saved locally under output/design, with prompts and
implementation notes. The Lab proposal in docs/army-builder-proposal.md keeps Classic 4×4 fixed,
proposes 4–10 geometry, shared budgets, copy caps, queens and selected fairy pieces. Captures still
return to the original owner and points apply only before play. Avoid treating ordinary chess
piece prices or fixed-depth search as established balance/performance across these boards.

**Validation.** All 243 unit tests pass. The complete desktop/mobile browser run has 108 passed,
5 skipped and one online-connection timeout with STUN DNS resolution failures. All six new
variant checks pass, including actual setup drops, random/reload identity and hidden reveal.

**Next measurement.**
Review the visual concepts before implementation. Test board size alone before adding queens,
duplicate armies or fairy moves. Wave 2 runs independently on its frozen experiment commit.

## 2026-10-24 — Wave 3 and a wider variant frontier

**Question.** The user wants many possibilities implemented and tested, while reserving major
redesigns for proposal review. Can restricting the location, support or piece type of a checking
drop preserve tactics with less color bias than unrestricted deployment?

**Evidence and decision.** Wave 2's completed quiet-first-turn pilot still favors White (148–52,
40 draws), and forbidding immediate drop mate also leaves strong bias. Add seven independent
spatial/support/piece policies rather than more timers: home half, distant, supported, defensive
countercheck and each of the three piece types separately. Keep quiet drops unrestricted. Use
fresh seeds 20261027–29, matched controls and the existing combined gate. No candidate is selected
by a favorable individual seed. Details: docs/variant-wave3-experiments.md.

**Alternatives and next measurement.** Army markets, recovery timers, deployment networks,
additional victories and simultaneous/fog formats are proposed in docs/variant-frontier-proposals.md;
they require distinct state, UI or search changes, so do not silently bundle them into drop-rule
experiments. Check legality in both colors, exact transcript replay and board-state hashes; verify
unit and browser suites before games start. Inspect equal-strength balance, draw mechanisms,
opening traces and checking-piece usage when results arrive. Classic remains unchanged.

## 2026-10-24 — Capture to your own bank, with variable capacity and overflow return

**Question.** The user proposed shogi-style capture ownership, then corrected capacity to team size N
through 2N (3–6 today), with overflow returned to the opponent. Does material transfer create richer decisive play or runaway advantage?

**Decision and alternatives.** Implement capacities 3, 4, 5 and 6, crossed independently with quiet/checking
drops. Six-slot capacity equals unlimited for today's six non-kings. Capacity counts currently held pieces; return overflow to the side captured
from, not the piece's initial allegiance. Avoid a discard-choice phase or destroying overflow.
Duplicate reserves need count badges and action deduplication so they remain visible and do not
bias search tie-breaking. Classic capture behavior remains unchanged.

**Validation and next measurement.** Tests cover actual transfers, capacity boundaries, unchanged
input positions, repeated capture ownership, duplicate drop consumption and exact tournament
replay. Wave 4 schedules 2,400 balanced pilot games across three fresh seeds with two matched
controls, existing combined screening and conditional full expansions. Inspect snowball/comeback
patterns and overflow frequency before recommending a default; existing finite-depth bots are
not a proof of balance. Details: docs/capture-bank-experiments.md.

**Search adaptation.** Existing evaluation counted deployed material only, appropriate to the
old fixed ownership but misleading after transfers. Capture presets now value every reserve
piece at its base material value while preserving the existing deployed activity bonus. Record
capture-material-v1 in games/manifests; leave control evaluation untouched.

## 2026-10-24 — One-use reserves and permanent capture losses

**Question.** The user suggested that deployed pieces never return after capture. Does finite
material create meaningful exchanges and less repetition, or produce passive reserve hoarding
and king-only draws?

**Decision and alternatives.** Implement two permanent-loss presets, quiet/checking drops, while
leaving unused reserves available. Neither bank receives a captured piece. Avoid mixing in pawn
rules, new victories or insufficient-material adjudication: those would obscure the capture
policy's effect. Reuse full reserve valuation with a separately recorded finite-material-v1
policy, preserving control evaluation. Position/replay already represent missing material.

**Validation and next measurement.** Verify removal and unchanged banks for both colors, normal
reserve deployment, no resurrection, drop-check policy, material-aware search, rules identity and
exact tournament replay with monotonically decreasing material. Wave 5 schedules 960 pilots
across three fresh seeds and four presets with the existing gate and conditional full expansions.
Inspect low-material endings, reserve hoarding, capture timing and first-loss snowball before
judging it superior to renewable or capturer-owned reserves. Classic stays unchanged.

## 2026-10-24 — Explore all implemented variants locally

**Question.** The user now has a stronger machine and requested local exploration alongside CI.
How do we run all variants without tying results to a moving checkout or losing long searches?

**Decision and alternatives.** Run all 36 implemented presets across fresh seeds 20261201–03,
80 games per seed/preset, 8,640 pilots total at the existing 200-ply ceiling. Use eight workers on
the detected 12-core Apple M6 / 32 GiB machine, retaining the existing fixed-depth AI profiles.
Freeze the exact source and record dirty Git provenance rather than falsely labeling results as
local HEAD. Checkpoint each completed game and validate exact replay. Resume missing tasks;
reject changed runtimes and concurrent writers. Avoid a new AI algorithm, browser dashboard or
automatic full expansion in this first local exploration: those require separate evaluation.

**Validation and next measurement.** Tests verify schedule coverage, actual frozen execution,
checkpoint export, idempotent resume, active-lock exclusion and source-tamper detection. A separate
short smoke batch checks multi-worker execution; its clipped games are not balance evidence.
Inspect real throughput and full color/matchup coverage before reporting results or finish times.
Larger-board/fairy proposals are not implemented presets and remain outside this batch. Details:
docs/local-experiments.md. The designer report arrived during this work; its patch was subsequently supplied and
applied as a separate design-reference change. Its 4.5 contrast-floor correction
is verified against test/contrast.test.js and reflected in the designer brief.

## 2026-10-24 — A design reference that cannot rot

**Question.** The Classic-first pass produced an audit and an IA recommendation. Where do the
screens live so they can be reviewed without being mistaken for shipped product?

**Implementation.** `design/` gains a contact sheet, a system page and four screens: Play, a
reserve selected, a result, and settings. They load `../styles.css` and `../ui.css` *before* their
own `design.css`, so every swatch is `var(--token)` and every component is the shipped class. A
reference that restates the tokens is a second source of truth, and the copy is what rots.

**Designer-reported measurements (not independently reproduced here).** Driving the shipped site: the first action a
new player must take is below the fold on every viewport — 7px at 390×844, 205px at 360×640, and
125px even at 1440×900. `.lobby-play{display:none}` below 761px, so a phone has no route to a game
at all; its only play entry is the card reading "Bot arena — take this position further", and
`DECISIONS.md` says that sentence is true *because the card inherits the lobby board*. On a phone
there is no board to inherit, so it is false exactly where it is the only door. And with a rook in
hand against a black king on b4, six of fourteen empty squares refuse the drop — precisely rank 4
and the b-file. The rule is correct; the interface never says why, and the tap clears the selection.

**Rejected:** implementing the IA into `index.html` and `watch.html` in the same pass. That
reverses "The home page is a board, not a picture of one", which needs its own commit with the fold
numbers as evidence, a `CACHE` bump and the e2e specs updated. A proposal that quietly ships is not
a proposal.

**Also rejected:** a `design/tokens.css` for the app to import. It reads as adoptable and would
become a second place tokens live. The reference consumes `styles.css`; it does not feed it.

**Not a defect, worth recording.** `.bank-piece` measures 41×44 in the arena but 46×46 in the
reference's layout. The reserve button is not inherently under the 44px floor — that page's column
is squeezing it, which makes it a layout fix rather than a component one.

**Next measurement.** Someone opening `design/index.html` and disagreeing with the Play screen
before any of it is built. Still, behind that: a real phone.

### Reference publication and new setup proposals

The supplied patch is preserved in design/designer-original.patch alongside the designer's
report, original canvas, Classic/cyberpunk raster concepts and prompt history. The Classic v2
raster is the corrected selected concept; the first draft remains identified as a draft.
A small reference-only fix synchronizes the theme toggle label when opening a dark-theme URL.
Browser verification covered all six reference pages at 390 and 1440 pixels, light and dark:
no page errors, failing resource requests or horizontal overflow. Play screenshots were inspected;
these static screens do not establish product usability or real-device behavior. All 259 unit
checks passed after applying the supplied patch.

The user's next ideas are captured in docs/custom-game-builder-proposal.md and
countdown-variant-proposal.md. Keep Classic as quick start; advanced games use a validated recipe,
with public asymmetries and private simultaneous army purchases followed by joint reveal.
Countdown gates drops on owner turns, comparing reset-on-capture against initial-unlock-only.
A forced wait only outside check avoids manufacturing stalemate while reserves cool down.
These are proposals, not implemented presets; the active 36-preset batch stays frozen. Next:
review setup flow, settle timer timing and wait semantics, then implement and test separately.

## 2026-10-24 — Sharp-only balance experiments

Question: can we retain quiet capture banks' decisiveness while bringing color balance inside
45–55% of decisive games, with at least 80% decisive overall? The user requested running many
recipes with Sharp against Sharp only, preserving all experimental data on GitHub, explicitly
including capacity 5 and bishop/knight 3-turn versus rook 4-turn capture cooldowns.

Decision: isolate the research engine rather than expose unfinished cooldown/Wait mechanics in
the app. Main screen: 43 recipes, six fresh seeds and 16 king starts, 4,128 games, eight workers.
The later own-home-row placement request is a separate two-recipe, 192-game supplement, preserving
the already frozen main runtime. Both sides alternate quiet home-row deployments; then White
starts normal play, comparing quiet versus checking drops and normal capture returns.

Rejected: mixed-strength matches for this color-balance question; excluding capacity 5; silently
changing rules after launch; treating a 48-game near-even result as proven balance; archiving
only summaries or relying on expiring Actions artifacts. The completed prior 8,640-game batch
is preserved as compressed full replay bundles plus source/manifest, not pooled into this screen.
The 32-game max-four-ply smoke is separately labelled and retained only as execution evidence.

Validation includes exact replay/material conservation for every recipe, baseline control
transcript equivalence, all mirrored king starts, timer ownership and capture boundaries,
duplicate ready/cooling copies, hash identity, capacity overflow, and forced-wait/checkmate rules.
Next measurement: complete both schedules, report raw win/draw counts, decisiveness and White's
share of decisive games, then confirm target hits with fresh seeds and a deeper engine budget.

### Home-row setup supplement completed

All 192 Sharp-vs-Sharp games completed and replay-validated. Quiet drops: 0 White wins, 0 Black wins, 96 draws. Post-setup checking drops: 6 White wins, 2 Black wins, 88 draws. Both recipes had 84 setup-blocked draws; the other draws were threefold repetition (12 quiet, 4 checking). The free alternating placement procedure can reach blocked arrangements, and the AI often chooses a draw rather than proceeding into a worse position. These results fail the decisiveness target and do not establish that every legal complete home-row arrangement is drawish. A later experiment could prevalidate full arrangements or use simultaneous complete placement, clearly labelled as a different setup policy. Full replays, frozen source, report and checksums are committed. The main 4,128-game screen remains running separately.

## 2026-10-24 — Symmetric Classic armies and adaptable AI

Question: how much do starting armies influence Classic balance, and can the search accept future
movement/objective changes without embedding each variant into its algorithm?

Launch a separate 31-army screen covering every 2/3/4-piece multiset of current rook/bishop/knight
material, identical for both players. Keep Classic drops/capture returns and freeze Sharp v2:
three seeds and 16 king starts = 1,488 games. Reject adding queens/fairy pieces or asymmetric armies
in the same test, and reject using the newly refactored AI for only this army comparison. The
baseline army remains RBN. Data is preserved with runtime, manifest, reports and replay bundles.

Production search now accepts a variant adapter for actions, immutable transitions, full state
identity, terminal scores, evaluation and ordering. Strength 0–100 maps to depth/node budgets;
iterative deepening returns a completed iteration or explicit legal fallback, with diagnostics.
Repetition-aware cache keys address board-identical positions with different draw rights; this
changes search semantics, so metadata identifies Sharp v3 / lower profiles v2. It may cost cache
hits and speed. No measured playing-strength improvement is claimed yet. Browser workers verified
legacy depth and bounded strength at 390/1440 widths. Next: tactical suites and same-budget matches
before claiming stronger AI, plus completed symmetric-army screening results. Live difficulty
controls retain their existing depths; no new settings slider was added in this pass.

## 2026-10-25 — Completed Classic symmetric-army screen

Question: can army composition alone produce balanced, decisive Classic play? All 1,488 already authorized games across 31 symmetric rook/bishop/knight armies completed. After confirming original runners exited, frozen runtime --resume verified source hashes and all checkpoints/replays. All use unchanged Sharp v2 depth 4, quiet drops and owner-return captures; never pool with production Sharp v3 or rule-changing balance tests.

No army meets both >=80% decisive and 45–55% White share of wins. The most decisive is RRN: 19 White wins, 4 Black wins, 25 draws out of 48 (47.9% decisive; White 82.6% of wins); draws are 24 repetitions and 1 ply ceiling. RRBN is closer in color split: 7 White wins, 6 Black wins, 35 draws (27.1% decisive; White 53.8% of wins); draws are 33 repetitions and 2 ply ceilings. Baseline RBN is 4/0/44. Do not select an official army from these data. Three seeds repeat 16 king starts; small samples, unchanged heuristic and depth/ply bounds limit generalization. Next measurement would need separately authorized stronger-search confirmation or different mechanics; none launched here.

Commit full compressed replay bundles, manifest, frozen runtime, checksums and readable report/rates/progress; preserve the new production search engine and all prior branch contents. Home-row results are independently archived on PR #116 and remain unsuccessful rather than being reinterpreted as a setup success.


## 2026-10-25 — Stabilized generalist search and explicit lookahead levels

Question: make the engine general across deterministic two-player perfect-information zero-sum games, with regression evidence and direct numeric lookahead. Decision: integer level 0–100 requests the matching number of future actions; zero returns an unevaluated legal fallback. Numeric levels use a fixed 262144-node safety budget and expose requested versus completed depth. Add ranked legal continuations and opt-in bounded adapter-defined tactical extensions, preserving old worker responses and named preset fixed depths. Do not enable tactical search by default based on a small sample.

Evidence: 314 workspace unit tests pass; an independent oracle validates all 5478 reachable tic-tac-toe states. Real browser worker checks pass on desktop/mobile. Controlled happy paths: candidate 51 pass/5 fail/2 skip; previous engine on same local interface 50/6/2. Three candidate-only failures all pass on serial rerun. Broad UI release checks remain open. A 32-game paired Classic smoke benchmark at max1024 nodes/move gives default candidate 7W/5L/4D and tactical-depth2 candidate 8W/3L/5D. These small samples do not establish a strength gain; all replays/results and source/checksum identities are verified. Full report: docs/generalist-engine-report-2026-10-25.md; evidence: research/engine-generalist-v1. Reject automatic promotion/merge. Next measurement: larger fresh-opening matched-budget comparisons and independent resolution of remaining UI checks. No historical or active research runtime changed.

## 2026-10-25 — Optimize playing search, pruning and work per node

Question: can exact search reach farther at the same budget, independently of UI automation?
Decision: share alpha at the root for single-line play; preserve full-window ranked analysis;
reuse cached best actions across iterations and bound table memory; share legal actions across
terminal adjudication, expansion and evaluation; reuse immutable root successors. Preserve
complete repetition identities and exact-depth score reuse. Resolve ambiguous bound ties before
random/repetition selection. Reject speculative pruning and mutable undo machinery without
additional general-game safety evidence. Advance named versions to Sharp v4, Learning/Steady v3.

Evidence: 320 workspace unit tests pass, including independent tic-tac-toe oracle, 1,800 seeded
transposition-graph comparisons, bound-tie trap, bounded tables and trusted adjudication parity.
Direct desktop/mobile worker tests pass. On 32 correlated saved positions, all 96 depth-4 score
pairs agree; nodes fall from 165145 to 72755 (55.9%), median time from 2598.8 to 892.0 ms (2.91x).
At 4096 nodes, mean completed depth rises 3.44 to 4.19: 23 positions deeper, 9 equal, none shallower.
CPU profiles identify legal/attack generation as the dominant baseline cost. Cross-depth action
hints are used 5992 times in capped search; score-table hits are zero on this history-sensitive
corpus, so that gain is not attributed to score-cache hits.

A separate deterministic 32-game color-swapped Classic match at 2048 nodes/move gives optimized
13 wins, baseline 1 win, 18 draws (4 repetitions,14 ply ceilings). Small samples are not an Elo
rating or optimal-play proof. Sources, observations, profiles and every replay are fingerprinted,
archived and verified under research/search-performance-v2. Report: docs/search-performance-report-2026-10-25.md.
No prior frozen runtime/dataset modified. No UI behavior changes. No automatic merge. Next
measurement: larger fresh-opening schedules at multiple budgets before a general strength claim.


## 2026-10-25 — Browser engine comparison

Compared the current Schness JavaScript playing engine with pinned Fairy-Stockfish WASM 1.1.12 (one thread, NNUE disabled) in real Chromium on the same machine. Used common six-slot capture-bank rules with quiet drops and no cooldown; this is not a Classic rules comparison. All 32 depth-4 legal trees matched (702,598 leaves), and all 192 timed-search moves were legal. Across 96 searches per engine at a requested 100 ms, aggregate throughput was 87,122 versus 1,602,117 reported nodes/s (18.39x); identical legal-tree enumeration took 890.41 versus 170.60 ms (5.22x). Selective depths and search node counts are not equivalent measures of thinking quality. No head-to-head games or Elo claim. Full UCI output, timing samples, source hashes, configuration, reproducible scripts and limitations are in research/browser-engine-v1. No production changes or variant tournaments were introduced.
