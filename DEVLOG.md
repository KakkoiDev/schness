# Schness development log

This is the chronological record of experiments and product direction. Each meaningful experiment
records the question, alternatives, decision, evidence, and next step. `DECISIONS.md` remains the
authority for current architecture and invariants; this file explains how and why those decisions
were reached.

Future contributors must add an entry in the same commit when they run an experiment, change product
direction, tune an AI, or accept/reject a meaningful alternative.

## 2026-09-11 — One bilingual interface and one product mark

**Language.** English and Japanese now share one browser-native interface rather than separate page
copies that would drift apart. Japanese is selected from the device language on a first visit; an
explicit EN/日本語 control persists the player’s choice. Static copy, live game status, accessibility
labels, chat, tutorials, puzzles, the arena, and the game library all pass through the same translator.

**Layout.** Japanese uses native system Gothic fonts, tighter heading tracking, strict Japanese line
breaking, and guarded button wrapping. The language control is deliberately compact so adding it does
not create a second mobile-header row.

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
