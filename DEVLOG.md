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


## 2026-10-25 — Faster native JavaScript playing engine

Implemented exact 4×4 attack masks, reversible search-only transitions with exception/budget-safe undo, incremental material and masks, cached current keys, bounded collision-free history path IDs, history-independent move hints, killer/history ordering, PVS and retrying aspiration windows. Public rules and immutable replay transitions are unchanged. Sharp is now v5; Learning/Steady v4. No Stockfish integration or frozen research changes.

Against d1db2c5, all 96 depth-4 score pairs match: median workload time 893.25→201.13 ms (4.44x faster), nodes 72,755→50,824 (30.1% fewer). Same-node completed mean depth 4.1875→4.28125. Real Chromium at 100 ms/search completes 4.875→5.792 plies on average. A separate 32-game color-swapped Classic match at 25 ms/move scores candidate 12 wins / baseline 1 / 19 draws (13 mates, 17 ceiling draws, 2 repetitions). These correlated, short samples are not Elo or universal variant-strength evidence.

All 327 workspace unit tests and four desktop/mobile-emulated browser worker tests pass. Verification replays all continuations/matches and checks sources, node caps and compressed hashes. Full report: docs/search-performance-v3-report-2026-10-25.md; complete measurements, prior source snapshots, logs, hashes and all match replays: research/search-performance-v3. Evaluator weights are unchanged; speculative pruning remains disabled.

## 2026-10-25 — Exact two-player speedups and screened tactical search

Finished and archived performance rounds four and five without changing older tournament runtimes.
Round four adds direct generation, exact count-only mobility, pooled private actions, scratch
legality masks, linked continuations and allocation-light ordering. Its same-session 32-position
comparison measured 1.32× speed against the previous optimized engine, or 16.56× against the
earliest preserved generalist baseline; these figures are workload-specific. Its 32-game
equal-time screen was 3 wins / 0 losses / 29 draws (24 move-ceiling draws).

Round five adds proved non-king legality and per-search stack mask reuse. Seven saved-workload
passes measured 160.60→147.96 ms (7.9% less time), with identical depth-four scores and nodes.
All 336 unit tests and four desktop/mobile-emulated browser-worker tests pass. New tests include
15 independently exhaustive sparse mate fixtures across five rule recipes, 5,000 additional
board comparisons, a checking-extension oracle and an explicit reduced-search tactical blind spot.

Four separate 32-game Classic screens at 25 ms/action:
- Final exact engine vs frozen round four: 2 wins / 0 losses / 30 draws.
- Checking extension depth 2 vs frozen round four: 4 / 1 / 27.
- Experimental late-move reductions vs frozen round four: 5 / 3 / 24.
- King-escape evaluation bonus vs final exact engine: 3 / 2 / 27.

These screens are not pooled and establish no Elo gain. Many draws hit the 100-play-ply ceiling.
Exact speedups are retained; checking extensions and reductions are opt-in, and the evaluation
bonus remains a frozen research runtime. Sharp v7 / Learning and Steady v6 retain previous default
depths/evaluation and zero quiescence. Multiplayer is deferred. Null-move/SEE/futility pruning,
trained evaluation and parallel search require separate evidence rather than automatic enabling.

Full measurements, source snapshots, CPU profiles, all 160 round-four/five match replays, logs
and checksum manifests are under research/search-performance-v4 and research/search-performance-v5.
Both verification scripts pass. See docs/search-performance-v4-report-2026-10-25.md,
docs/search-performance-v5-report-2026-10-25.md and docs/how-the-game-engine-works.md.
## 2026-10-25 — Completed frozen Sharp v2 balance screen

Question: which of the 43 already authorized recipes meets both screening targets? All 4,128 games finished; the frozen runtime --resume verified source hashes and every checkpoint/replay after confirming both original runners had exited. No changed rules or new games were launched. Preserve this engine version separately from production Sharp v3 and the older 8,640-game screen.

Three recipes met >=80% decisiveness and 45–55% White share among decisive games: bank-4-delay-1, bank-5-delay-1 and bank-6-delay-1. Each has 44 White wins, 36 Black wins and 16 draws in 96 games (83.3% decisive; White 55.0% of wins). Each draw breakdown is 13 threefold repetitions and 3 stalemates. These use quiet capture-to-bank drops with one owner-turn capture cooldown and overflow returned to the captured owner. Identical counts do not establish that capacities are generally equivalent.

Reject declaring official balance from this screen: six seeds repeat the same 16 king starts, search is depth 4, 200 total plies, and 43 recipes create selection effects. Hits are provisional; fresh positions/seeds and deeper search would be the next measurement, requiring a separate run authorization. No new run started. Home-row supplement findings remain unchanged: quiet 0/0/96, checking 6/2/88 W/B/draws, with 84 setup-blocked draws each. Archive all manifests, exact runtime, replay bundles and final report/rates/progress with verified SHA-256 parts. Preserve the prior archive and supplement.

## 2026-10-25 — Four-slot one-turn cooldown across all named AI levels

Question: does the screening candidate remain decisive and color-balanced at different named
AI levels, and do mixed levels show the expected strength separation? User authorized a full
all-level test. Freeze the completed balance screen's rules and bot byte for byte; expand only
the tournament schedule to all nine ordered Learning v1 / Steady v1 / Sharp v2 pairings.
Use six fresh seeds 20261501–20261506 and all 16 king placements: 864 games, 96 per pairing,
200 total plies, eight local workers. Do not mix production Sharp v3 or numeric strength 100
into this follow-up: that would change the engine as well as the pairing. Initial reserves
are ready, captured copies wait one owner turn, overflow returns to the captured side, quiet
drops only. No new rule tuning or automatic adoption.

Schedule tests verify all nine pairings and 16 starts per seed; byte equality checks preserve
the screened rules/search/profiles; report tests keep equal and mixed levels separate and
retain draw reasons. Run source/manifest is committed before completion. On completion, verify
all frozen sources and replays, archive full replay bundles and readable reports/checksums,
and publish to the same follow-up branch. Only equal-level games assess color balance; repeated
starts and finite depth remain limitations. Next measurement is this completed batch, not an
automatic expansion.

## 2026-10-25 — Completed all-level four-slot cooldown test

All 864 authorized games completed. After confirming the original runner exited, frozen
runtime --resume verified the SHA-256 source fingerprint and all checkpoint/replay legality,
position keys and final outcomes. The full compressed manifest/runtime/replay bundles and
readable reports/rates/progress are archived with verified part and whole hashes.

Equal-level results (White/Black/draws, 96 each): Sharp v2 45/39/12, 87.5% decisive,
White 53.6% of wins; Steady v1 59/37/0, 100% decisive, White 61.5% of wins;
Learning v1 42/30/24, 75% decisive, White 58.3% of wins. Only Sharp meets the
screening target. Sharp draws: nine repetitions, three stalemates; Learning draws:
24 repetitions. Steady has no draws. This is fresh-seed replication of the candidate
at the same Sharp depth, not proof of stronger-search balance or all-skill balance.

Mixed pairings (White AI first, W/B/D): Sharp-Steady 75/16/5;
Steady-Sharp 10/83/3; Sharp-Learning 79/3/14; Learning-Sharp 2/85/9;
Steady-Learning 84/12/0; Learning-Steady 3/93/0. All mixed draws are repetitions.
Across reversed-color pairings, Sharp wins 158/192 against Steady (82.3%, eight draws)
and 164/192 against Learning (85.4%, 23 draws); Steady wins 177/192 against Learning
(92.2%, no draws). These are strength comparisons, not color-balance estimates.

Keep this 200-ply fixed-depth frozen Sharp v2 dataset separate from the earlier screen,
numeric strength profiles and production Sharp v3. Six seeds repeat 16 king starts;
sample size, correlated starts, evaluator assumptions and search horizon limit inference.
Do not adopt an official variant or launch a new experiment automatically. Next useful
measurement would be a separately authorized deeper-search or multi-engine confirmation.

## 2026-10-25 — Nine proposed variant options launched

Question: can small reserve timing changes or new movement/objective constraints improve the
four-slot one-turn cooldown candidate? User authorized testing every proposed direction.
Run nine recipes: control 1/1 capture/return delay, 1/0 (also the stolen-only cooldown proposal),
1/2, two-square rook/bishop move-and-attack range, three-check, five-check, center hold,
mandatory king-safe captures, and own-half drops. Avoid duplicating the equivalent 1/0 ideas
and avoid combining several unmeasured changes at once. All inherit the candidate's quiet
drops and capture-bank semantics. Center hold means the same central square through one
opponent reply, safe at the end; a checking reply cancels the claim. One checking action
counts once even if double check. Objectives and timer/overflow rights are replay/hash state.

Research Sharp uses a new explicit variant-objective-search-v1 identity for every recipe,
including control: full repetition-history transposition keys, check progress 120 per count,
center distance 60 and active claim 250. Reject blindly using an objective-unaware evaluator
or presenting uncalibrated weights as optimal play. Keep this dataset separate from Sharp v2,
production v3 and numeric strength. No mid-run tuning or automatic adoption.

Six fresh seeds 20261601–20261606 × 16 starts × nine recipes = 864 Sharp-only depth-4 games,
200 total plies, eight local workers. All 290 unit tests passed, including delay boundaries,
range on moves/attacks/drop legality, check counters/double check/terminal search, center
claim cancellation/search defense, pinned mandatory captures, schedule coverage, baseline
rule identity and full replay/material conservation for each recipe. No app changes; no
production browser acceptance claim. Preserve runtime/manifest before completion and append
full replay archive/report/checksums on completion. Next measurement is the complete batch,
with W/B/draws, draw reasons and checkmate versus objective victories; screening hits need
independent stronger-search/human confirmation.

## 2026-10-25 — Completed nine-option research screen

All 864 authorized games completed; after confirming PID 89823 had exited, frozen runtime
--resume verified source fingerprint 81aead8505cb836f29765f39cc86dac44c61cde5d7f04033145357810dbc595b
and every checkpoint's legal replay, resulting keys, final state and result. Full replay
bundles, manifest, exact runtime, readable report/rates/progress and verified SHA-256 archive
parts are committed. No new experiments, changed frozen source or merge.

Per recipe, 96 games (White/Black/draws; decisive%; White share of decisive games):
- Control 1/1: 40/41/15; 84.4%; 49.4%.
- Capture/return delay 1/0: 40/41/15; 84.4%; 49.4%.
- Capture/return delay 1/2: 40/41/15; 84.4%; 49.4%.
- Two-square sliders: 49/28/19; 80.2%; 63.6%.
- Three-check: 59/35/2; 97.9%; 62.8%.
- Five-check: 57/39/0; 100%; 59.4%.
- Center hold: 96/0/0; 100%; 100%.
- Mandatory captures: 12/3/81; 15.6%; 80.0%.
- Own-half drops: 37/46/13; 86.5%; 44.6% (strictly below 45%, not a hit).

Only the delay/control group meets both prespecified screening thresholds. All three
have 11 repetition and four stalemate draws; all 81 wins are checkmate. No played overflow
capture occurs in these 288 games, so return cooldown effects are not established. Delay
1/2 matches all 96 control action sequences; 1/0 matches 94/96. Identical totals are not
independent confirmations of three distinct effective mechanisms.

Slider draws: 17 repetitions, two stalemates; 77 checkmates. Three-check: 88 check-count
wins, six checkmates and two stalemate draws. Five-check: 76 check-count wins, 20 checkmates,
no draws. Center hold: all 96 White objective wins on ply four (king placements, White
central king entry, Black's first reply); reject this opening objective as balanced in
its current form. Mandatory captures: 15 checkmates; 52 repetition, 28 stalemate and one
ply-limit draw. Own-half: 83 checkmates and 13 repetition draws.

These are the newly versioned objective-search-v1 depth-4 engine, not prior Sharp v2/v3
or numeric strength. Six seeds repeat 16 starts; uncalibrated objective weights and the
search/ply limits constrain inference. Keep separate data and matched control, do not
claim proven balance or automatic official variants. Next measurement would require a
separately specified confirmation; no automatic new experiments launched.

## 2026-10-25 — Checking/drop-mate policy crossed with cooldown

Question: does the four-slot candidate improve with checking drops, and does forbidding
immediate drop mate change that result with or without capture cooldown? User authorized
both checking policies and asked about zero delay. The older 8,640-game archive already
contains zero-delay checking (48 equal Sharp games: 72.9% White, 8.3% Black, 18.8% draws);
the 4,128-game screen contains quiet zero-delay 64/22/10. Do not compare these as a matched
factorial experiment or pool engine versions.

Launch six matched recipes: capture/return delay 0 or 1 crossed with quiet drops, unrestricted
checking drops including mate, and checking without immediate drop mate. No new movement
or victory objectives. Six fresh seeds 20261701–20261706 × 16 starts × six recipes = 576
Research Sharp-only depth-4 games, 200 total plies, eight workers. Research objective-search-v2
records the new noDropMate adapter identity; bot/evaluation code is byte-identical to v1 and
objective progress bonuses are inactive. Include quiet controls under that same runtime.

No-drop-mate checks legal replies under the same policy, including king escapes, captures,
ready reserve blocks and legal counterchecks. Recursive checking-drop replies terminate as
reserves are consumed without captures. Cooling reserves cannot delay checkmate and normal
mating board moves remain legal. Source hashes include noDropMate/cooldown; validate no
forbidden mating-drop replay on persistence/resume. Record checking and mating-drop usage.

All 297 unit tests passed; focused tests verify allowed/forbidden drop mates, legal nonmating
checks and captures, reserve blocks/readiness, normal mating moves, timing, full matrix
coverage and replay/material conservation for every recipe. No app/UI changes. Freeze
runtime/manifest before run; on completion replay-validate and commit full compressed
archives/checksums and readable reports. Next measurement is this complete matrix; no
automatic expansion, tuning, adoption or merge.

## 2026-10-25 — Rechargeable checking-drop charge banks

User authorized charge capacities 1/2/3, starting at zero, replenishing after one non-checking-
drop own turn. Cross with capture/return delays 0/1: six recipes, six fresh seeds 20261801–06,
16 starts per recipe, 576 Research Sharp-only depth-4 games, 200 total plies. Drop-mate remains
allowed when charged. King placement does not charge; a checking drop spends one with no
same-turn recharge. Other own play actions, including board checks and forced waits, restore
one to the cap. Capture readiness and checking-drop charges are independent resources.

Charge state is part of rules, immutable transitions, hashes/repetition/cache identity and
replay validation. Use distinct adapter objective-search-v3 with unchanged search/evaluation
code. No extra heuristic value for saved charges; mobility sees legal options, so tactical
correctness does not establish optimal saving strategy. Keep data separate from earlier
engines and the still-finishing drop-policy matrix. No mid-run tuning or automatic adoption.

All 303 unit tests passed, including zero first-turn charges, no king-placement recharge,
spending/no immediate recharge, normal checks regenerating, caps/identity/immutability,
charged drop-mates, matched schedule and full replay/material conservation for all recipes.
Freeze exact source and manifest; run locally and archive all replays/checksums/reports on
completion. Next measurement is this complete batch. No production UI or Tutor change is
implied; Tutor principal lines and explanations remain a separate proposed feature.


## 2026-10-25 — Completed checking-drop charge-bank screen

All 576 Research objective-search-v3 depth-4 games completed. Frozen source fingerprint 7f08da9419c99ab6235406e95a2ba73dad5a46d853dfd8350faf45499df56fc6; runner was confirmed inactive before frozen --resume verified every source hash and replay/checkpoint. Full runtime, manifest and replays are archived under research/data/check-charge-v1-2026-10-25 with verified part/whole SHA-256 df5281b8da2246cfc8dcc53dae8d5c0530a331b062f0b734659dce70898ea177.

Each recipe has 96 games. Capacity/capture-cooldown: 1/0 = 20 White, 63 Black, 13 draws (86.5% decisive; White 24.1% of wins); 2/0 = 63/19/14 (85.4%; 76.8%); 3/0 = 60/24/12 (87.5%; 71.4%); 1/1 = 29/57/10 (89.6%; 33.7%); 2/1 = 47/44/5 (94.8%; 51.6%); 3/1 = 46/46/4 (95.8%; 50.0%). Only capacities 2 and 3 with one-turn capture cooldown meet the >=80% decisive, White 45–55% screen. All wins were checkmate. All draws repetition except three stalemates each for 2/0 and 3/0. Checking/mating-drop counts respectively: 564/37,398/44,409/48,547/31,387/57,391/58.

Decision: retain 2/1 and 3/1 as provisional confirmation candidates, not official balanced variants. Capacity one strongly favors Black; higher capacities without capture cooldown favor White. Six seeds repeat the same 16 king starts, the heuristic has no stored-charge bonus, and finite-depth play is not an optimal-play proof. Do not pool with other engine identities. Next measurement, if authorized, is fresh starts/seeds and deeper matched-budget search. No new experiment started; no automatic merge.
## 2026-10-25 — Completed checking/drop-mate × capture-cooldown matrix

All 576 games finished and frozen runtime --resume verified the source fingerprint and
all checkpoint/replay validity after original PID 6412 exited. Complete replay bundles,
runtime/manifest, reports/rates/progress and SHA-256-verified compressed archive preserved.

96 games each (White/Black/draws; decisive%; White share of wins):
quiet delay 0: 57/28/11; 88.5%; 67.1%.
quiet delay 1: 43/39/14; 85.4%; 52.4% — only screening hit.
checking including mate delay 0: 68/10/18; 81.3%; 87.2%.
checking including mate delay 1: 72/8/16; 83.3%; 90.0%.
checking without drop-mate delay 0: 80/2/14; 85.4%; 97.6%.
checking without drop-mate delay 1: 74/8/14; 85.4%; 90.2%.

Draw reasons: quiet-0 has 11 repetitions; quiet-1 has 10 repetitions and four stalemates;
checking-0 has 18 repetitions; checking-1 has 14 repetitions and two stalemates;
no-drop-mate-0 and -1 each have 14 repetitions. All wins are checkmate.
Checking/mating-drop usage respectively: quiet-0 0/0, quiet-1 0/0,
checking-0 379/26, checking-1 380/24, no-drop-mate-0 366/0, no-drop-mate-1 360/0.
Prohibiting immediate drop mate did not remove the observed White advantage.

Keep this objective-search-v2 depth-4 dataset separate from earlier engines and the
separately authorized charge-bank experiment. Six seeds repeat 16 starts, finite search
and correlated samples prevent proven-balance claims. No rule tuning, new experiment or
automatic merge follows these results. Full checking-drop charge-bank tests are independently
authorized and tracked in PR #121; do not pool their results. Next measurement for this
matrix would need separately specified deeper/multi-engine confirmation.

## 2026-10-25 — Merge open PR stack and start full fixed-color engine regression

At the user's explicit request, merged every then-open PR (#108–#122) into master, in dependency
order. Resolved divergent experiment-record append conflicts while preserving both reports;
no PRs remained open afterward. Final merge 9fe678d911041af38d5c9056bc9838cc11e25cc5 has the
same validated playing-engine core as the prior optimization pass.

Started sharp-v7-v2-full-v1-2026-10-25: 6,912 fixed-depth games on all 36 shared production
presets, six fresh seeds and all 16 king starts, split into 3,456 candidate-White and 3,456
candidate-Black tasks. Both engines search exactly four individual actions with repetition
aversion and independently seeded tie selection; no time/node caps, quiescence or reductions.
Ceiling is 200 total actions. New-engine source and an original Sharp v2 runtime are frozen;
the old files' original manifest hashes and Sharp v2 metadata were checked before copying.
Source fingerprint: b964f7a4c0cde7738e449eeef1976fc3cad98176608f976483df527b236f3097.

All 338 unit tests pass, including complete color/seed/start coverage and checkpoint/resume,
active-lock and source-tampering regressions for this runner. Each actual transition is also
cross-checked against legacy rules during play. Results are pending; do not infer non-inferiority
from partial schedules or pool distinct historical research adapters into this comparison.
A completion monitor will verify all replays, archive full runtime/bundles and publish final data.

## 2026-10-25 — Full Sharp v7 versus Sharp v2 fixed-color benchmark completed

All 6,912 authorized games completed on the 36 shared production presets: six seeds and all
16 king starts, with 3,456 games in each fixed candidate color. Both use exact depth four,
seeded tie selection and repetition aversion, no time/node caps, no quiescence/reductions and
a 200-total-action ceiling. No additional experiment or frozen-runtime change was made.

After confirming original PID 6171 had exited and the run lock was absent, frozen --resume
validated every source hash and checkpoint/replay. The archived runtime's 15 source files,
all 6,912 bundled replay IDs, 72 variant/color groups of 96 games, eight archive parts and
the whole SHA-256 archive were independently checked. Fingerprint:
b964f7a4c0cde7738e449eeef1976fc3cad98176608f976483df527b236f3097.

Descriptive suite counts, kept separate by candidate color:
- v7 White: 1,409 v7 wins / 548 v2 wins / 1,499 draws; score 62.46%.
  Draws: 1,470 repetitions, 23 ply ceilings, six stalemates.
- v7 Black: 636 v7 wins / 1,357 v2 wins / 1,463 draws; score 39.57%.
  Draws: 1,430 repetitions, 27 ply ceilings, six stalemates.
- Across this fixed equally weighted preset schedule: 2,045 v7 wins / 1,905 v2 wins /
  2,962 draws; v7 score 51.01% with draws worth one half.

After both colors, raw win-minus-loss differences favor v7 in 23 presets, favor v2 in 11
and tie in two. Classic specifically is 7 v7 wins / 9 v2 wins / 176 draws (49.48%).
Reject a universal non-inferiority or Elo claim: six seeds repeat 16 starts, individual
variant samples are small, draws include artificial ceilings, and variant color biases
dominate separate-color raw rates. Mixed-engine games are not intrinsic variant balance
measurements. Historical custom-army/objective/capture-delay/charge datasets are separate
rule and engine adapters and were not pooled into this result.

Full raw per-variant and per-color counts, scores and draw reasons are in
research/data/sharp-v7-v2-full-v1-2026-10-25/report.md and rates.json. That directory also
contains complete replay/runtime archive parts, manifest, progress and verification.json.
All PRs open at the user's merge request (#108–#122) had already been merged. The completion
monitor can now be removed; future strength work should investigate specific tactical
differences rather than silently relaunching a modified benchmark.

## 2026-10-25 — Explicit per-color engine results and thinking times

At the user's request, derived readable tables for all 36 presets, showing new-engine versus
v2 wins and draws separately with each engine's colors explicit. Each pairing has 96 games.
Mean thinking times use only transcript entries with actual engine decisions; automatic king
and private-placement actions are excluded. Summed timing totals were cross-checked against
the archived rates.json for every variant/color/engine group. Eight games ran concurrently
and engines reached different positions, so these are observed wall times, not an isolated
equivalent-position speed measurement. No new games or runtime changes.

See docs/engine-comparison-by-variant-2026-10-25.md and
research/data/sharp-v7-v2-full-v1-2026-10-25/thinking-times.json for counts and timing detail.


## 2026-10-25 — Same-position depth calibration

Measured frozen Sharp v2 depth four against Sharp v7 depths four, five and six on 32 saved Classic positions, serial and warmed, three repetitions. Mean milliseconds per position (median full pass): v2 d4 70.86; v7 d4 4.58; v7 d5 24.93; v7 d6 104.10. With each position's measured v2 budget, iterative v7 completed depth five on 23 positions and depth six on nine (mean observed 71.46 ms). Prefer time budgets for comparable latency; fixed depth five is conservative and six can take longer. All selected actions and continuation lines replay-validated; source fingerprints recorded. This is timing calibration, not a strength test or a universal browser/variant budget. Full compressed raw data, summary, report and reproducible script committed under research/depth-calibration-v1 and scripts/bench-depth-calibration.js.


## 2026-10-26 — Deeper v7 matches and queued Fairy comparison

Launched two frozen, separate full schedules: v7 depth five and depth six versus frozen Sharp v2 depth four, 6,912 games each, 36 shared presets, six reused seeds, 16 starts, both fixed engine colors. Four workers per schedule; observed move wall times include parallel contention. Core engine hashes match the earlier v7 tournament; defaults unchanged. Extended the harness with explicit candidate depth and resume metadata checks, and reports with per-engine decision counts, mean times and win rates. Harness tests pass and actual opening searches completed at both requested depths.

Prepared a 192-game serial equal-time browser follow-up against Fairy-Stockfish b2e693ef, 100 ms each, six-slot capture-bank quiet-drop rules only, no NNUE. This is not Classic or an all-variant Fairy adapter. Opening adapter verification passed 32 root move-list comparisons and 64 legal searches. Queue waits for both deeper schedules and completed replay verification. Freeze fingerprints and constraints are in research/depth-matches-v1. Complete game data and reports will be archived separately on completion; no results are claimed at launch.


## 2026-10-26 — Depth-five versus Sharp v2 completed

Completed all 6,912 frozen v7 depth-five versus v2 depth-four games. Confirmed runner exit, resumed the exact frozen runtime successfully, replay-validated all games, checked every runtime source and all 14 compressed parts plus whole SHA-256. Full manifest/runtime/replay bundles and readable per-variant/color results archived in research/data/sharp-v7-d5-v2-full-v1-2026-10-26.

Across 36 presets, v7 White: 2,574 wins / 241 losses / 641 draws (74.48% raw win rate, 83.75% score); v7 Black: 1,824 / 982 / 650 (52.78% win rate, 62.18% score). Observed mean AI-decision time v7/v2: White-candidate games 78.45/159.81ms; Black-candidate games 55.48/262.27ms, under parallel contention and different evolving positions. Classic alone White:53/5/38, Black:45/2/49. Draw reasons retained: ceiling760, repetition458, stalemate73. Score counts half a draw. Descriptive mixed-variant aggregates are not intrinsic color balance, Elo or proven noninferiority; six reused seeds repeat16starts and ceiling draws are artificial. No pooling with historical depth-four or pending depth-six/Fairy data. Depth-six continues; Fairy remains queued after it. No production defaults changed.


## 2026-10-26 — Depth-six versus Sharp v2 completed; Fairy match started

Completed all6,912 frozen v7 depth-six versus v2 depth-four games. Confirmed runner exit and repeated frozen resume verification successfully. All runtime source hashes,6,912 replays,7 archive parts and whole SHA-256 verified. Full data and readable per-variant/color counts, raw win rates, scores, draw reasons and mean AI-decision times archived separately under research/data/sharp-v7-d6-v2-full-v1-2026-10-26.

Across36presets, v7 White:2,371wins/60losses/1,025draws (68.61% raw win rate,83.43% half-draw score); v7 Black:1,426/745/1,285 (41.26%,59.85%). Observed mean v7/v2 milliseconds per AI decision: White-candidate games1176.40/151.97, Black-candidate games348.32/297.31. Classic alone: White32/0/64, Black41/0/55. Draw reasons: repetition2246, ceiling51, stalemate13. Depth six did not improve aggregate score against this opponent over the separate depth-five schedule and costs substantially more observed time; this is not a direct depth-five-versus-six match or proof of relative strength. Keep datasets separate; reused seeds and16starts, mixed variants, search parity effects and changing parallel contention limit interpretation. No Elo, independent-game CI or proven noninferiority claim. Production defaults unchanged.

The existing queue verified both completed depth datasets and started the authorized192-game serial equal-time browser match against Fairy-Stockfish. Its shared capture-bank rules are not Classic. No results claimed before completion.


## 2026-10-26 — Fairy-Stockfish match complete; all authorized depth matches archived

Completed all 192 serial browser games at 100 ms requested per engine move. Fairy-Stockfish won every game by checkmate: v7 White 0 wins / 96 losses / 0 draws; v7 Black 0 / 96 / 0. V7 raw win rate and half-draw score are 0% with both colors. Observed mean v7/Fairy decision time: White-candidate games 99.52/87.41 ms; Black-candidate games 99.52/84.69 ms. Pooled medians 99.49/101.84 ms; early returns affect means, so this is not a pure throughput comparison. Mean total actions 32.76, range 17–69 including two king placements.

This tests shared six-slot capture-bank quiet-drop rules, not Classic. Fairy b2e693ef uses one thread, 16 MiB hash, NNUE disabled; v7 uses time-limited iterative deepening. Full history supplied to Fairy and legal root-move parity checked at every played position. Confirmed runner and queue inactive, resumed frozen runtime to verify all source hashes and 192 replays, verified four compressed part hashes and whole SHA-256, and preserved full UCI output plus GPL license/source in the archive. Environment and adapter checks are readable alongside it. Six candidate seeds repeat 16 starts; no seeded Fairy diversity, independent-game confidence interval or Elo claim.

All three authorized schedules now complete and published separately: depth-five and depth-six versus frozen v2 plus equal-time Fairy. See docs/engine-depth-and-fairy-results-2026-10-26.md for the combined navigation and interpretation, without pooling datasets. No production defaults or engine algorithms changed. Completion monitor can stop.


## 2026-10-26 — Competitive Schness research (ongoing)

Removed the implicit numeric-strength node cap while retaining explicit caller budgets. Added an opt-in competitive depth-20 profile with iterative tactical search, king-safety/exposed-material evaluation, count-equivalent repetition caching and stronger ordering. The exact reference profile and existing tournament presets remain unchanged. Added completed-iteration telemetry and prevented selective reductions from being presented as a mate proof. Browser worker forwards the competitive profile.

All 347 unit tests passed, including the new competitive search and frozen-match checks. First 32-game frozen screen: White 9 wins / 6 losses / 1 draw; Black 2 / 13 / 1; total 11 / 19 / 2, raw win rate 34.375%, below the >=51% target. Schness was allowed 1,000ms and pinned Fairy-Stockfish 100ms, so this is not an equal-time improvement claim. Every source/replay was validated after the runner exited; full runtime, licensed opponent sources, replays and checked archive parts are preserved under research/data/competitive-r1-fairy-screen02-2026-10-26. An earlier zero-game startup failure on browser-blocked port 4190 is also archived.

An uncapped depth-20 two-game feasibility probe remains active; no completed-depth-20 claim is made. A new frozen r3 32-game screen uses stronger ordering and 10,000ms candidate versus unchanged 100ms Fairy. The queue runs a fresh-seed 192-game frozen confirmation only if the entire screen crosses 51% raw wins. Threshold is 98/192 wins, with draw counts and candidate colors retained separately. Repeated starts, asymmetric budgets and concurrent CPU contention limit interpretation. Research remains ongoing and no success is declared. See research/competitive-engine-v1/README.md for the complete contract and launch fingerprints.


## 2026-10-26 — r3 screen complete; quiet-drop reduction r4 started

Validated and archived the entire r3 32-game screen after runner/queue exit: candidate White10 wins/5 losses/1 draw, Black4/12/0; total14/17/1, 43.75% raw wins, below51%. The sole draw reached the 200-action ceiling. Schness used10,000ms per decision (mean9,999.54ms); unchanged Fairy100ms (actual means96.19/96.24ms). Candidate median completed depth9; rangesWhite6–14, Black7–14. No confirmation was launched. No equal-time or causal feature-gain claim follows. Full runtime/GPL sources/replay bundles plus readable reports/logs and part/whole SHA256 checks are committed under research/data/competitive-r3-fairy-screen-2026-10-26.

Added explicit reduceQuietDrops option, forwarded by browser worker and frozen runner, and preserved by campaign confirmation preparation. Only late quiet drops outside check become eligible for the existing one-ply reduction; improving bounds are re-searched, checking children/captures/evasions retain safeguards. Selective fail-lows can still miss tactics; exact reference behavior is unchanged. On four selected Black-loss opening positions, fixed-depth6/quiescence2 work fell from518,677 to243,151nodes (53% fewer); all completed, but scores changed. Full inputs, hashes and legal PVs are recorded in research/competitive-engine-v1/drop-reduction-ablation.json, not a strength claim. All348 unit tests passed; focused checks passed after worker/config tests.

Frozen r4 screen now active at output/local-experiments/competitive-r4-fairy-screen-2026-10-26, fingerprint02737370b4a7b2043905f9c2bd973df2117783600bcf1507fe6d7b0107fafa19. Same32 starts/colors/seed and10s candidate vs100ms Fairy for comparison, depth20 request/q4, now including quiet-drop reductions. Queue will confirm only a complete >=51% screen in192games with fresh seeds, same source/settings. The separate original uncapped r2 probe is unchanged and still searching its first move beyond completed depth11 (493,116,169nodes). Requested20 remains unachieved there. Target remains unmet; no auto-merge or production-profile promotion.


## 2026-10-27 — r4 complete; target missed

Frozen quiet-drop reduction screen completed 32 games: candidate White 7 wins/7 losses/2 draws; Black 2/13/1. Total 9 wins/20 losses/3 draws, 28.125% raw wins, 32.8125% half-draw score. All three draws were threefold repetition. Candidate mean decision time approximately 9999.55ms versus Fairy 95.74ms (candidate White) / 96.17ms (candidate Black). Candidate median completed depth 10, ranges White 7–15 and Black 7–14; requested 20 remains unachieved. No confirmation launched. These unequal-budget results do not establish strength improvement. Compared with r3, this screen supplies no evidence to promote quiet-drop reductions.

The original processes disappeared without a recorded exception; completed game checkpoints were retained and identical frozen sources resumed on 27 October. Interruption record included. After completion and confirming runners inactive, frozen resume verified source hashes and all replays. Full runtime/GPL sources/replays and readable results archived under research/data/competitive-r4-fairy-screen-2026-10-26. Whole archive SHA256 86f5459ade0c8841a11e48e9027bfc8bbe68a26fc0848abbd875c4234eb5adb9; part hashes verified. The separate uncapped probe was likewise resumed unchanged after interruption; depth20 and the campaign target remain unmet. Further engine analysis is required; no profile promotion or merge.


## 2026-10-27 — bounded checked-horizon evasions; r5 started

Loss review covered all20 r4 losses. A checked quiescence leaf previously stopped at the ordinary q limit. New optional quiescenceEvasionDepth (0–8, default0) permits bounded all-legal evasions beyond that boundary, forbids stand-pat cutoff during extension, and respects explicit budgets. The final bound still evaluates statically; no exhaustive mate guarantee. Reference and production defaults unchanged. New forced-loss/safe-line and endless-check/cancellation tests pass. Full350 tests passed, focused13 tests passed after worker/manifest changes. A selected20-position ablation completed40 depth4/q2 searches withoutLMR:26469 baseline versus29078 extended nodes,8 changed scores/2 changed actions; diagnostics are not independent strength evidence.

R5 frozen fingerprint924de3af2687a1964338a946c006f8a0f3fa5fd36f26de6be9e4accb8842002f,32-game screen, allowance2/q4/checks/board-moveLMR, quiet-drop reductions disabled. Requested20,10000ms versus pinned unchangedFairy100ms, same16starts/seed20261801/bothcolors. Conditional192-game confirmation forwards exact flags and freshseeds only if complete screen>=51%raw wins. No success claimed; uncapped old probe still separate and CPU contention applies.


## 2026-10-27 — r5 archived; score-preserving evaluation cache tested in r6

R5 completed13W15L4D=40.625%rawwins,46.875%halfdrawscore. White10/5/1Black3/10/3,allrepetitiondraws. Mediancompleted9,rangeW6–13B6–20;requested20 remainsnotpractical/exhaustive. Candidate9999.58/9947.22ms,Fairy94.15/97.26ms. No confirmation. After inactive-runner check, frozen resume verified allsource/replays. Archiveparts,wholeSHA2566e5bfd659f0071b184bb09de5e543a5073ba6f66a48431e4f5ac01de7e5a01c7,allarchivedsourcehashesand32bundledgamesverified;fullruntime/GPL/replays/readablereports included.

New optional caches are defaultfalse. Quiescence bound caching uses separate bounded history/q/evasion-keyed table;15completed selectedlossdiagnostics retainedscores, saved~3%nodes but slowed600to895ms, so notenabledforr6. Static evaluation cache requires explicitadapter.evaluationKey; Schness completepositionkey excludesonlyhistory,terminal/repetitioncheckedfirst. Per-search boundedcache preservedall15pairsscores/nodecounts,cut106548to67689evaluationcalls and570to475ms (~17%less). SelectedtimingswithCPUcontentionarenotstrengthproof. All353unit testspassed,including exactreference/oracles/restoration/cacheequivalence.

R6 frozenfingerprintab36feae4b2a2d9ca7442fd26c35b12169eea8af128fd156438cf9adf55b0a14 screens32games withstatic-evaluationcachetrue,quiescencecachefalse,otherwise r5settings. Candidate10000msversusunchangedFairy100ms,same16starts/seed20261801/bothcolors. Queueconditionalconfirmationforwardsallflags. Allattempts retained; no promotion/merge/targetclaim. Uncapped oldprobe stillseparate.


### 2026-10-27 — Executable specification for a future Rust backend

Added a language-independent JSON-lines conformance harness: 17 hand-authored graph cases, 15 independently checked mate fixtures, and 142 frozen rule snapshots across all 36 presets (174 portable cases). Tests check semantic results rather than identical tie choices, node counts, or timings. Added independent graph oracle checks, protocol/error tests, frozen-source provenance checks, and negative tests of the checker itself. Documented depth/budget/history/cache/restoration contracts and future Rust acceptance in docs/engine-behavior-contract.md; corrected the obsolete implicit node-cap documentation. Worker coverage now includes cache option validation/forwarding. All 359 unit tests and 174 executable contract cases passed. No Rust implementation or live frozen benchmark source was changed; strength target remains unmet.


### 2026-10-27 — r6 frozen screen completed

All 32 games finished: 12 wins, 18 losses, 2 draws; raw wins 37.5%, half-draw score 40.625%. White 9/6/1 (56.25% raw,59.375% score); Black 3/12/1 (18.75% raw,21.875% score). Both draws were threefold repetition. Mean candidate decisions White9999.50ms/Black9999.52ms versus Fairy96.09ms/96.42ms. Requested20 plies, median completed9, ranges White5–16/Black6–13. Unequal-time, shared-CPU results do not show equal-time strength or intrinsic variant color balance. Threshold missed; no confirmation launched. This is not demonstrated improvement over r5. Runner/queue inactive before frozen resume verified sources and all replays. Full runtime/GPL/bundles plus readable results/logs archived; every archived file matched source and all part/whole hashes verified. Archive whole SHA256 87ae1b9ce5826d263f8fc57c4ac6aee8f65b02fa60bc3976af3f729f690da01d. Future strength comparisons must honor the user's paired-start/color-swapped, per-variant equal-time baseline priority. Rust conformance specification remains in place; no Rust implementation has started.


### 2026-10-27 — Matched color-aware comparison and reduction diagnostics

Added tested paired-outcome comparison rejecting incomplete/duplicate/unmatched starts, malformed results, and changed frozen rules/opponent/time budgets/action limits. On identical r5/r6 schedules White gained2/lost3 wins (-6.25 percentage points); Black gained1/lost1 (unchanged). These descriptive, correlated results do not prove strength change or intrinsic color bias. All18 r6 first-detected losing-mate positions were compared at depth5/q4/evasion2 with reductions off/on:36 searches completed,121503 versus101983 nodes,one score changed and one tied-score action changed. This does not identify reductions as the general cause of losses and does not justify a new strength claim. All363 unit tests passed. Existing uncapped probe process remains alive, depth20 still unestablished. No new playing profile promoted.


### 2026-10-27 — Experimental native Rust backend and equal-budget Fairy screens

Implemented a native JSON-lines Rust rules/search backend, portable contract runner, generated differential checks and CI workflow; browser production remains JavaScript. Validation: 366 JavaScript tests, 3 Rust tests, 174 portable cases, 1555 generated rule positions across36 presets,36 exact-reference score comparisons and8 invalid-request recovery cases passed locally. Native search still lacks JavaScript transposition/evaluation caches, PVS/aspiration, killer/history ordering and repetition-aversion ties; inherited tuning flags for those features are inert. This is an experimental backend, not equivalent search in a faster language or a completed production migration.

All frozen screens used16 identical starts with both colors,100ms candidate/100ms pinned Fairy,requested20 plies. Rust r1:0W31L1D; r2:0W30L2D; r3:1W29L2D (3.125% raw), versus matching JavaScript baseline2W27L3D (6.25%). R3 White0/16/0,Black1/13/2; JS White1/14/1,Black1/13/2. No demonstrated win-rate improvement, no confirmation or promotion. Full per-color timing/depth/draw reports, frozen source/binaries, GPL opponent source, replays and all four archives retained in research/rust-engine-v1/README.md and research/data. All frozen resumes validated sources/replays after runners ended; archive parts/whole/every archived file and32 games each verified. Selected fixed-depth allocation/reversible-search diagnostics preserved, not strength evidence. Some nominal20 forced-line completions do not establish practical/exhaustive20.

Stopped old uncapped probe at the user's request after excessive runtime;0/2 games completed, historical depth11,depth20 not achieved. Its stopped-by-user progress, original runtime/logs and interruption/stop records are preserved in a dedicated partial archive; do not resume or count unfinished games as losses. No experiments remain active.


### 2026-10-27 — Bounded native static evaluation cache

Ported optional cacheEvaluation (defaultfalse) using fullposition keys,per-search FIFO bounded by maxTableEntries; terminal/repetition runs before lookup. No searchbounds/gameoutcome reuse. Five Rust tests pass including cacheon/off score/node/action equality,capacityeviction,repetitionprecedence,cancellation; external1555rulepositions/36exactsearches/174portablecases pass. Eighteen selected fixeddepth5/q4/evasion2/noLMR pairs preserved all scores/actions/nodes:250026vs144210static evaluations,105816hits; single ordered elapsed1348vs1197ms. Full inputs/source/binaryhashes retained. Selected diagnostic timing is not win-rate improvement or holdout evidence. No new match launched,appremainsJS; remaining native search feature gaps remain.


### 2026-10-27 — Completed-iteration native root ordering

Ported root reorder from fully completed previousiteration,retainingallrootactionsbeforeMultiPVtruncation;rootOrderingfalse diagnostic switch. SixRusttests pass with sampled exactscore/MultiPVset equivalence,external1555positions/36exactsearches/8recovery/174portablecases pass.18selecteddepth5iterative/q4/evasion2/cacheEval/nonLMRpairs allscoresmatch:342976vs247592nodes,1701vs1069ms singleorderedrun. Fullinputs/source/binaryhashes retained in rust-root-ordering-ablation.json. Tiedactions maydiffer;selectiveorder changesrequirefreshmatches. No win-rateclaim/newmatch/appswitch.


### 2026-10-27 — Repair native search feature gaps and complete r4 retest

User challenged worse output from supposedly same algorithm; earlier Rust was incomplete. Ported same-depth repetition-safe transposition bounds/bounded hints, killer/history ordering,PVS,aspiration,root repetition-aversion full tie re-search,and missing exposed-piece ordering penalty. Native profile defaults now match JS for iterative budgets/provenwin/repetition; defaults-only change after r4 freeze does not alter its explicit settings. Quiescence cache remains off/unimplemented;native ties deterministic. EightRusttests plus366JStests,1555generatedpositions,36reference/36competitive nonreduced score comparisons,8invalidrecovery and174portable pass.18selecteddepth5 nonreduced diagnostic scores matcholdRust/newRust/JS:342976/125899/125809nodes,1690/630/544ms includingIPC/concurrent contention. Not language superiority/strength proof.

Frozenr4 full32:2W28L2D=6.25%raw,9.375%halfdraw;W2/13/1 B0/15/1,boththreefold. Candidate101.46/101.49ms,Fairy91.25/90.73ms nominal100each. Requested20,completedW3/6/11 B3/6/9. PreviousRust1/29/2=3.125%;JSbaseline2/27/3=6.25%. No demonstratedstrengthgain/confirmation/promotion. PairedJS comparisonWhitegained1oldwin,Blacklost1oldwin. Full archive/GPL/runtime/binary/source/replays/readabledata verified afterinactive+frozenresume. WholeSHA2560452bb558392243d41c935ae3ce7bae0aae7dc04bd9f540e83b21c107051deeb;allparts/everyfile/32gamesverified. Noactiveexperiment.


### 2026-10-27 — Canonical native key allocation cleanup

Cache immutable ruleJSON once perparse;reservekeys count kinds instead of clone/sort. Ruleconfiguration private,canonical keys/dynamicrights/repetitionunchanged. EightRusttests and1555rules/36reference/36competitive/8recovery/174portablepass. Selected18fixeddepth5nonreducedcases preserve125899nodes/allscore/action versusfrozenr4. ABBAnew/old/old/new558/618/621/558ms,initial561/620ms;JS535ms125809nodes. Noconcurrentmatch. Allinputs/source/binaryhashes/repeatedoutputsretained rust-key-allocation-ablation.json. Selectedallocationtiming,notwin-rateimprovement;nonewmatch.


### 2026-10-27 — Borrowed native mobility counting and r5 freeze

Share borrowed actionvisitor for both-color mobility count without cloningconfiguration/reserves or buildingsecondmovevector. NineRusttests pass (>2000bothcolorfixture/childcounts+unchangedstate);external1555rules/36reference/36competitive/8recovery/174portablepass. Combinedkey/mobilitycleanupvsfrozenr4 all18selecteddepth5scores/actions/125899nodes match;ABBAnew/old/old/new515/615/616/517ms,initial522/619JS526. Fullinputs/hashes/repeatedoutputs retained. Notstrength/languageproof.

Frozen r5 launched32games/16identicalstarts/bothcolors/seed20262001/100mscandidateandFairy/request20/q4checks/evasion2/LMRtrue/dropsfalse/staticcachetrue. Fingerprinta1988a40d346f3b80d3af02129c39709e5621fbe922dde90d67f2bfed7a77496,exactlaunchmanifestpublished. No partialstrengthclaim,do notmutatefrozenruntime/duplicates. No confirmationunlesscomplete17/32threshold;fresh192required. AppstillJS.


### 2026-10-27 — Complete r5 allocation screen, no strength gain

Full32games1W29L2D=3.125%raw,6.25%halfdraw;White1/14/1Black0/15/1,boththreefold. Candidate101.39/101.44msFairy92.60/90.49msnominal100each. Requested20completedW3/6/9B4/6/11. Previousr4 2/28/2=6.25%,JSbaseline2/27/3=6.25%. Pairedr4/r5Whitegained1lost2wins,Blackunchanged0. No demonstratedstrengthgain,no confirmation/promotion. Allocationdiagnosticgains didnottranslateintobetterresults. Inactiverunnerconfirmed beforefrozenresumesource/replayvalidation;fullruntime/source/binary/GPL/bundles/readables/logsarchived,allpartwholefilebytes32gamesverified. Whole20510a0d248c788d936f36a78dbd953880451e90506690b93320d497c170da0c. Noactiveexperiment;nextinspectearlydecisivetactical/evaluationdifferencesratherthanallocation-onlyscreens.


### 2026-10-27 — Bounded early Rust loss analysis

Analyzed all 29 frozen Rust r5 losses, selecting early observed score swings within the first 12 candidate decisions. At explicit depth-6/200,000-node/1,500-ms diagnostic limits, 15 best-versus-forced-played pairs completed; 14 incomplete pairs are excluded from fixed-depth comparisons. Full inputs, trajectories, PVs, frozen binary identity and results are retained. These finite-horizon scores are not game-theoretic proofs or strength evidence.

Matched reduction-off/on searches on all 15 completed cases finished all 30 searches: six scores and one action differed. At Black start 2, ply 7, reduction-on selected the played bishop move while the nonreduced depth-6 search preferred a king move. This identifies a selective-search discrepancy for further tested investigation, not grounds to disable reductions globally or claim improved win rate. No engine settings changed, new match launched, or production promotion occurred.


### 2026-10-27 — Experimental principal-variation reduction guard

Added opt-in reducePrincipalVariation:false: late quiet reductions are restricted to null windows; default behavior remains unchanged. A selected Black-start-2 regression now recovers the nonreduced depth-6 king defense and score. Ten Rust tests pass, plus1555 rule positions,36 exact reference/36 nonreduced competitive comparisons,8 recovery checks and174 portable cases. All15 selected early-loss positions completed both bounded depth6 variants: four scores and one action changed. Full inputs/results/source/binary hashes retained. This is finite-horizon tactical evidence, not universal equivalence or improved playing strength. No new screen launched or app/default promotion.


### 2026-10-27 — Frozen Rust r6 PV-guard screen

Benchmark now explicitly freezes and forwards reducePrincipalVariation (CLI --reduce-pv true/false); invalid values rejected. New preparation/invocation tests and all367 JS tests pass. Regression fixture is included in frozen source set. Release rebuilt. Launched32 identical starts/colors/seed20262001 at100ms candidate and100ms unchanged Fairy, requested20/q4/evasion2/LMR/staticcache with reducePrincipalVariation:false. Fingerprint b8b0b13778233412da1d9ef2f24766a5a91bf6f7b321285683acf934db109e7a. Full result pending; no partial strength claim or automatic promotion.


### 2026-10-27 — Redirect to JS100ms; five-minute improvement loop

User paused Rust and authorized all four JS research directions with a five-minute loop. Added opt-in lazy secondary move ranking with private per-node ranks; default remains unchanged. Worker/manifest/confirmation forwarding included. All368 JS tests pass, including exact traversal/node/PV agreement and cancellation/restoration. Fifteen selected depth5 cases preserve91058nodes/scores/actions across ABBA lazy/sort/sort/lazy timings395/355/340/335ms. Mixed timing and warmup do not establish benefit; no new strength screen launched. Base adapter ordering remains eager. Development generator-length/root-facts errors were caught/fixed before validation; no frozen run affected. Next optimize actual staged adapter scoring and reserve-aware exchanges, then separately reduction/evaluation improvements. All evidence retained; no strength/default promotion.


### 2026-10-27 — Staged adapter scoring and Rust r6 administrative archive

JS optional staged move groups now defer independent adapter base scoring until consumed; exact traversal/cancellation and tactical-cutoff tests pass. All369 JS tests pass. Fifteen selected depth5 cases preserve91058nodes/actions/scores across ABBA388/373/342/326ms; warmup-sensitive mixed evidence, no strength claim or new match. Nonindependent adapters retain prior path; defaults unchanged. Next reserve-aware exchange ordering, then reduction/evaluation work separately.

Completed paused-Rust r6 archive administration:2W27L3D6.25%raw10.9375%halfdraw,W1/14/1B1/13/2,allthreefold. Frozen resume/source/replay already verified after inactivecheck. Full runtime/source/binary/GPL/bundles/readables/logs archived; two parts/whole/every archived file bytes and32games verified. WholeSHA2566f284242d794a42e250020e7292d9a5d8c6e9c5ed7d9b1da338788549f00fbdf. Pairedr5/r6 White gained1lost1,Black gained1lost0; descriptive small correlated sample,not strength proof. Rust remains paused, no experiment active.


### 2026-10-27 — JS reserve-aware exchange-ordering screen

Implemented opt-in capture-only exchange estimate for ordering: reserve ownership/capacity, drop material, king-safe recaptures and declining recaptures. It excludes other drops/variant turn rights/repetition and never prunes or adjudicates. All373 JS tests pass after resolving decision-record/frozen dependency failures; service-worker cache and shell include the new module. Frozen runtime generators include the dependency. Selected15depth5 ABBAexchange/eager/eager/exchange scores match;87883/91058/91058/87883nodes,464/351/360/407ms. Lower nodes but higher cost, not strength evidence. Frozen32same starts/colors/seed20262001 at100ms each isolates exchangeOrdering:true,stagedfalse,q4/evasion2/LMR/cacheEval. Fingerprint0ba6c42beae72cd74304ff5b6bb8f212688c1d7e62effe5df2c0faab634181be. Full result pending/no partial strength claim/default promotion. Next evaluate complete paired outcomes and independently test PV/history reduction guards and reserve threat evaluation.


### 2026-10-27 — Exchange result and independently tested JS reduction safeguards

Exchangeordering screen final1W29L2D3.125%raw6.25%halfdraw,W1/14/1B0/15/1,boththreefold. JS99.56/99.50msFairy92.23/91.35ms,request20median6W3–9B3–9. Below baseline2/27/3; no promotion/confirmation. After inactivecheck frozen source/replay validation passed. Archive parts/whole/everyfilebytes32gamesverified,whole370e982fa928c9ca3b79fdd7ac4db9e433455f9af0badb433cc5c2ea3bef8090. Paired outcomes retained.

Added opt-in PV/nullwindow and killer/history reduction guards separately, preserving default true/false. All376 JS tests pass including generic fail-low trap, actual protected-reduction telemetry, cancellation and immutable input. All60 selected depth6 diagnostics complete: nonreduced/baseline/PV/history nodes237514/187247/222225/191504,ms1013/754/888/770; differences from nonreduced0/6/2/5. History protects197eligible reductions. Selected finitehorizon evidence, not strength/exactness proof. Frozen32same starts/colors/seed20262001 at100ms each now isolates PVguardfalse with exchange/staged/historyguardoff;fingerprint07abac00bf42cf62a1e8ab3f793c485062607f8ceaee5574eab146dffa4c5fe4. Full result pending. Reserve/king-threat evaluation remains next independent work; Rust stays paused.


### 2026-10-27 — PV-guard result and isolated reserve-pressure evaluation

PVguard screen complete2W29L1D6.25%raw7.8125%halfdraw,W1/14/1B1/15/0,onlydrawthreefold. JS99.51/99.48msFairy90.47/92.21ms,request20median6W3–9B3–9. Same rawrate asbaseline but fewer draws;no improvement/promotion/confirmation. Inactivecheck thenfrozenresume source/replay verified. Fullarchive2parts/whole/everyfile32gamesverified,whole9a9746d3f1b657e008ff61bd1b3aedccbbec463a0cbac7d8a0af5be0ad8ca4c1. Pairedoutcomes/fullsource/GPL/readables/logs retained.

Fourth JS direction implemented as opt-in legal reserve-pressure evaluation: best single legal deployment,added king-ring control12/check40/exposedlanding-12,capped80perside. Reuses mobility action sets. All379JS tests pass including legalchecking-drop policies/color symmetry/noreserve/duplicatepieces/state and15independentmates. Selected15depth5ABBAon/off/off/on scores change11cases,92542/91058/91058/92542nodes,445/346/350/389ms;slower heuristic,notstrength. Fresh32same starts/colors/seed20262001 at100ms each isolates reserveThreatEvaluation:true with ordering/guardsoff,otherwisebaseline. Fingerprint2122691ea504a98efc486f5e91bb27ca7f437d19e0efcc8afa349832d2c25397. Fullresultpending/no partialclaim. Allfourideasnowexperimentalimplementations;continuedstrengthtesting/evidence-led iteration remains required, Rustpaused.


### 2026-10-27 — Archive reserve screen; freeze isolated history/staged screens
Reserve evaluation completed2W30L0D (6.25% raw), White1/15/0 Black1/15/0; no strength gain or confirmation. Inactive/source/replay checks completed, full archive parts/whole/every file/32games verified; SHA256281513eb8dbb72747d7c121793af24d7cf04e03849ec003ad225c383b25b1d29. Retain paired baseline comparison. Freeze remaining history-only and staged-only32game equal100ms screens, identical starts/colors/seed; sequential operational queue, no live tuning or automatic promotion.379 correctness tests previously passed; pending games are not strength evidence. Rust remains paused.


### 2026-10-27 — Complete isolated JS history/staged screens
Both32game equal100ms screens completed and runners exited; own frozen resume validated all source hashes/replays. History3W28L1D9.375%raw, White1/15/0 Black2/13/1; baseline White unchanged, Black gained one win. Staged1W29L2D3.125%raw, White0/15/1 Black1/14/1. All draws threefold; median completed depth6 vs20requested. Small descriptive results, no established strength gain, confirmation or promotion. Full runtime/source/GPL/bundles/log archives verified part/whole/everyfile; history whole644e2f791e2bb4cb915cddf4ee648d353f983b8c0cb10a2de1060a065ee8dcf4, staged b79d6b81a4d1a258000a4648bdd9ead4906b3410ea116e5288300c1e1001da74. Preserve paired comparisons and all failed attempts. Next early JS loss/search-cost analysis, Rust remains paused.


### 2026-10-27 — Early JS loss analysis and capture-only quiescence screen
Investigated all55baseline/history losses, selecting one decision within first12candidate decisions perloss by observed score swings.40best/forced nonreduced depth6/depth5 pairs complete,15incomplete excluded at100000nodes/500ms. Three >=200 gaps involve early bishop deployments; differing played horizons prevent bug attribution. All inputs/PVs/source hashes retained. On40selected cases, q4checks/q4captures/q2checks all120queries complete:931524/787211/902026nodes,3974/3526/3912orderedms. Quiescence dominates cost; capture-only reduces15.5%nodes but changes horizon, not guaranteed strength. Retains15independent mate actions/scores/restoration;21focused tests pass. Reject budget escalation and arbitrary option combination; freeze isolated capture-only q4 baseline100ms32games against unchangedFairy100ms. No defaults changed, no production promotion; complete playing result required.
