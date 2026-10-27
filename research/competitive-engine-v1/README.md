# Competitive Schness research — 26 October 2026

Goal requested by the user: remove implicit thinking caps, support a requested depth of
20, and improve Schness until a complete match records at least 51% wins against the
pinned Fairy-Stockfish opponent. This is ongoing research, not an achieved result.

## Engine changes

- Numeric levels 0–100 retain their requested depth and no longer inject a 262,144-node
  budget. Explicit caller time/node budgets remain supported. A cache-size bound limits
  retained memory, not the amount of thinking.
- `analyzeAction(p, {profile:'competitive'})` requests depth 20 with iterative deepening,
  tactical quiescence (captures, checks and evasions), optional late-move reductions,
  king-confinement/exposed-material evaluation, and repetition-safe transpositions.
- Competitive transpositions use the multiset of history extensions relative to the
  fixed root history. Different traversal orders can share entries only when the full
  repetition counts agree. The exact reference profile and its evaluator are preserved.
- Competitive ordering prioritizes captures and checks, then central/safe deployment.
  This ordering was added after the first frozen screen; it is not attributed to r1.
- Iteration telemetry exposes only fully completed depths. Requested depth is measured
  in individual player actions (plies), not pairs of moves. Quiescence can extend a line
  past its nominal depth; reductions can search alternatives less deeply.
- An exact completed winning search can stop early when requested; selective reductions
  disable that proof shortcut. A winning selective score is not a mate certificate.
- The browser worker accepts the competitive profile. Existing app/tournament presets
  retain their reference behavior until the candidate is validated.

These weights and reductions are research choices. No claim of stronger play follows
from adding features; complete games, tactical oracles and holdout schedules decide.

## Validation

The first 347-test full suite passed, including the existing exact minimax/transposition,
small-game exhaustive, legal-generation and restoration checks. New checks cover uncapped
numeric levels, explicit budgets, finished-depth telemetry, repetition-sensitive cached
versus uncached/mutable versus immutable competitive results, color symmetry, all 15
independent mate fixtures, and benchmark freezing/licensed opponent sources.

## Match contract

Opponent: the existing pinned `fairy-stockfish-nnue.wasm@1.1.12`, reported commit
`b2e693ef`, one thread, 16 MiB hash, NNUE off, 100 ms requested per decision. No opponent
settings are weakened relative to the previous 0/192 match. Complete UCI history is
supplied and every played position must have identical legal moves in both engines.

Rules: 4×4, six-slot capture bank, captured pieces change owner, quiet drops, no capture
cooldown. This is the supported common ruleset, **not Classic Schness** or orthodox chess.

Schness can use uncapped time or an explicitly recorded calibration budget. Report actual
milliseconds, candidate color, raw wins/losses/draws, draw reasons and completed depth.
An unequal-time success does not establish equal-time superiority. Never compare nominal
Fairy selective depth with an exhaustive Schness horizon as though they were equivalent.
Concurrent jobs can affect timings; record that contention rather than pooling timings.

Screen on 16 starts with both colors (32 games). A screen crossing 51% is a candidate
for a separately frozen 192-game confirmation, not a reason to stop on a favorable partial
score. The 192 games repeat the 16 starts with six tie seeds; they are not 192 independent
positions and do not prove optimal play, Elo, or superiority on every rule combination.
Hold the source, settings, opponent and entire schedule fixed within each attempt.
Preserve all failed attempts and checkpoints. Report wins divided by **all** games, not
wins among decisive games or score including half draws. At least 98/192 wins meet the
numerical confirmation target; there is no guaranteed termination or guaranteed success.

## Runs started

- `competitive-r1-fairy-screen-2026-10-26`: startup failure, 0 games. Browser/Node fetch
  blocks port 4190 (reserved service). Failure/progress and frozen runtime retained.
- `competitive-r1-fairy-screen02-2026-10-26`: 32-game screen, 1,000 ms Schness versus
  100 ms Fairy, depth request 20, quiescence 4, reductions enabled. Source fingerprint
  `d9f1d05fd8ca8faa2051036fc1a3b324648f25d69c2a4051712c6ebe91f6f67f`.
  Completed result: 11 wins, 19 losses, 2 draws (34.375% raw wins). White 9/6/1;
  Black 2/13/1. The numerical target was missed; no confirmation is attributed to r1.
  This predates the conservative proof-shortcut fix and stronger ordering. Its early
  winning scores are selective, not proofs; actual wins require terminal checkmate.
- `competitive-r2-fairy-uncapped-probe02-2026-10-26`: two-game feasibility probe, depth
  request 20, no node/time cap, quiescence 4, reductions enabled. Source fingerprint
  `5329707cdf29acd13b1859a2f9c11d8dff784f0e68c5c4166c97007d0f3ebdf6`.
  Completed iterations are in run.log. Do not relabel a partial search as depth 20.

- `competitive-r3-fairy-screen-2026-10-26`: queued after r1; stronger ordering and corrected
  proof shortcut, 10,000 ms Schness versus unchanged 100 ms Fairy, fresh tie seed, 32 games.
  Fingerprint `eea7cc1186c818ab49d335c334d1b045fa79f10c756666fa9c16d116e131395c`.
  This intentionally permits 100× the opponent's requested time and is not an equal-time test.
  The queue prepares a fresh-seed 192-game confirmation from that same frozen runtime only
  if the full screen wins >=51%. If the screen/confirmation misses, it requests further
  engine analysis rather than silently changing the runtime or opponent. The uncapped probe
  runs separately; timing results have CPU contention.

Two intermediate prepared directories without runner/progress files were never launched;
they have no game results. Current and frozen runtimes must not be interchanged.

## Commands

Prepare a frozen schedule with `scripts/run-competitive-fairy.js --output RUN` and optional
`--depth 20 --seeds 6 --starts 16 --candidate-millis 10000 --quiescence 4 --port 4193`.
Omit `--candidate-millis` for uncapped time. `--reductions false` disables selective
reductions; `--checks false` restricts quiet quiescence to captures. Every schedule is
both colors. Run `RUN/runtime/scripts/run-competitive-fairy.js --resume RUN` with a local
browser server permitted. Resume verifies source hashes and every existing replay.

Generate readable results with `research/competitive-engine-v1/report.js RUN`.
Archive completed attempts with `scripts/archive-local-experiments.py RUN research/data/NAME`.
Publish every full runtime, replay bundle, checksum and readable report on the research
branch, preserving the opponent source and GPL license. Do not modify older archives.


## Completed r3 and next r4 — 26 October, 12:42 UTC

The r3 screen completed all 32 games: 14 wins, 17 losses, 1 draw; **43.75% raw wins**.
White: 10/5/1, Black: 4/12/0 (wins/losses/draws). The draw reached the 200-action ceiling.
Candidate mean decision time was 9,999.54ms for each color; Fairy means were 96.19ms
against candidate White and 96.24ms against candidate Black. Candidate median completed
depth was 9 for both colors (White range 6–14, Black 7–14). This missed the target and
no r3 confirmation was launched. Full source/replay validation and archive hash checks
passed after the runner and queue exited. Data: research/data/competitive-r3-fairy-screen-2026-10-26.

R4 tests an explicit `reduceQuietDrops:true` option. Late quiet drops can be searched
one ply less initially, just as late quiet board moves already were. An improvement
must be searched again at full depth. Captures, check evasions and moves giving check
retain their existing safeguards. This remains selective: a reduced fail-low can miss
a defense, so scores are not exact minimax/mate proofs. The reference/default behavior
is unchanged and reductions can be disabled. Worker and frozen runner forward the flag;
the campaign queue preserves it in any confirmation schedule.

The fixed-depth-6, quiescence-2 ablation on four saved Black-loss opening positions
used 243,151 versus 518,677 nodes (53% fewer) and all searches completed their requested
horizon. This sample is selected and scores changed; it is evidence of reduced work,
not improved playing strength. Full inputs, source hashes, legal PVs and measurements
are in drop-reduction-ablation.json. All 348 unit tests passed.

Active r4 screen: competitive-r4-fairy-screen-2026-10-26, source fingerprint
`02737370b4a7b2043905f9c2bd973df2117783600bcf1507fe6d7b0107fafa19`.
Same 16 starts, both colors, screen tie seed 20261801 and 10,000ms versus unchanged
100ms Fairy, depth request20, quiescence4 with checks, LMR including quiet drops. The
queue will run competitive-r4-fairy-confirmation-2026-10-26 with six fresh seeds starting
20261901 only after a complete >=51% screen. Source fingerprint must remain identical.
No winning claim is made. The older uncapped r2 probe continues separately; its latest
completed first-move iteration was depth11 at 493,116,169 cumulative nodes. Depth20 has
not completed, and ongoing CPU contention limits timing comparisons.

## 27 October: r4 result and r5 horizon-evasion experiment

R4 completed 9 wins/20 losses/3 repetition draws (28.125% raw wins), White
7/7/2 and Black 2/13/1. Median completed depth10 did not yield a successful
screen. Full verified archive is committed; no confirmation was launched.

R5 adds an explicit `quiescenceEvasionDepth` allowance (0–8, default0). At the
ordinary quiescence boundary a checked position may search all legal evasions
for at most this many additional actions. No stand-pat cutoff is allowed during
that extension; node/time budgets still apply. At the final allowance boundary
static evaluation remains a deliberate finite-horizon approximation. This is
not an exhaustive mate proof or a demonstrated strength improvement.

The generic checked-horizon trap test now chooses the safe line, and an endless
check fixture confirms bounded termination/cancellation. All350 unit tests passed;
focused benchmark/worker/search tests passed after freezing-option edits. In20
selected first detected losing-mate positions from r4, depth4/q2 withoutLMR,
allowance2 used29078 versus26469 nodes, changed8 scores and2 actions, with all
40 analyses complete. Full inputs/PVs/source hashes are in
`horizon-evasion-ablation.json`; selected diagnostics are not a holdout.

R5 screen uses allowance2, q4/checks, existing board-move LMR, quiet-drop reduction
disabled, requested20, 10000ms candidate versus unchanged100ms Fairy,32 games,
same16starts/seed20261801/bothcolors. Frozen fingerprint
`924de3af2687a1964338a946c006f8a0f3fa5fd36f26de6be9e4accb8842002f`.
Confirmation forwards the exact allowance and other flags and runs only after a
complete successful screen. Reference/app defaults remain unchanged. The old
uncapped probe is separate, and concurrentCPU affects timings.

## r5 complete; r6 evaluation-cache experiment

R5 completed13W/15L/4D (40.625% raw wins,46.875% half-draw score), White10/5/1
and Black3/10/3. All four draws were repetition. Median completed depth9;
White range6–13,Black6–20. A few nominal20 searches do not establish exhaustive20
or practical20 on every position. Mean candidate9999.58ms White/9947.22ms Black,
Fairy94.15/97.26ms. No confirmation launched. Full source/replay/archive hashes
verified; archive whole6e5bfd659f0071b184bb09de5e543a5073ba6f66a48431e4f5ac01de7e5a01c7.

Two optional caches were tested, both defaultfalse. `cacheQuiescence` uses a
separate bounded table keyed by exact adapter history plus remaining q and evasion
allowances. Fifteen selected r5 losing positions at depth5/q4/evasion2 withoutLMR
completed with identical scores,122691 versus119202nodes, but600ms versus895ms;
this overhead outweighed savings, so it is OFF in r6.

`cacheEvaluation` requires the adapter to provide an explicitly history-independent
`evaluationKey`. Schness keys the complete rules/board/banks/turn/phase state;
terminal and repetition adjudication still precede evaluation lookup. The cache
is per-search and bounded, and does not reuse game results or search bounds.
Fifteen matched completed diagnostic pairs had identical scores/nodes,106548
versus67689 evaluator calls,570ms versus475ms (~17%less). These selected timings
include CPU contention and are not strength evidence. Full inputs/options/PVs/
source hashes are in `evaluation-cache-ablation.json` and
`quiescence-cache-ablation.json`. All353 unit tests passed, including cached/
uncached equivalence, bounded tables, restoration and explicit key validation.

R6 enables only static-evaluation caching on r5 settings, still10000ms versus
unchanged100ms Fairy,32games/same16starts/seed20261801/bothcolors/requested20.
Fingerprint`ab36feae4b2a2d9ca7442fd26c35b12169eea8af128fd156438cf9adf55b0a14`.
Confirmation forwards exact cache/extension/reduction flags. No promotion or
strength claim until completed evidence; production/reference defaults unchanged.
