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
