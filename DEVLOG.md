# Schness development log

This is the chronological record of experiments and product direction. Each meaningful experiment
records the question, alternatives, decision, evidence, and next step. `DECISIONS.md` remains the
authority for current architecture and invariants; this file explains how and why those decisions
were reached.

Future contributors must add an entry in the same commit when they run an experiment, change product
direction, tune an AI, or accept/reject a meaningful alternative.

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
