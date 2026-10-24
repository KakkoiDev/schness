# Local variant experiments

The local batch uses the same `playTournamentGame`, rules, named AI profiles, seed handling and
80-game research plan as CI. This is fixed-depth screening, not stronger-AI training. No new
engine heuristics or rule changes are included. All 36 implemented presets are supported; larger
boards, new piece armies and other proposals have no engine and cannot yet be tested.

## Prepared run

Default: all 36 presets × 3 fresh seeds (20261201–03) × 80 games = **8,640 games**. Each seed/preset
covers five AI matchups and sixteen king starts. Each game has a 200-total-ply ceiling, including
setup as in CI. Eight worker threads on the current 12-core machine leave capacity for other work.
Results are screening evidence only; no automatic expansion or cherry-picked favorable seed.
Fresh seeds do not create independent engine behavior when an opening is deterministic.

Prepare (does not start computing games):

```
node scripts/run-local-experiments.js --output output/local-experiments/all-variants-2026-10-24 --workers 8
```

The command prints the frozen runtime's resume command. Run that exact command to start or resume.
The runtime snapshots every src JavaScript module, this runner and package.json, with SHA-256 hashes,
plus records the local dirty Git state, Node version, hardware, actual rules and AI profiles.
This is necessary because work-in-progress variants are not all on local HEAD. Ongoing edits in
the normal workspace cannot change the running snapshot. A modified snapshot fails verification.

For a smaller batch, pass `--variants canonical,permanent-loss-quiet`, `--seeds 123,456`,
`--repetitions 1`, `--max-plies 200`. Smoke tests with a low ply ceiling verify plumbing only;
they are not balance evidence. Do not pool different configurations or source fingerprints.

## Files and progress

- `manifest.json`: immutable experiment configuration and full source provenance.
- `runtime/`: frozen executable source; preserve it with results.
- `games/`: one atomic, complete, replay-validated JSON checkpoint per scheduled game.
- `progress.json`: refreshed every ten seconds, with total completed, in-flight tasks and per-preset
  counts, matchup counts, draw reasons, normal plies, checking drops and low-material outcomes.
- `run.log`: background launch output, one line per completed game.
- `run.lock`: active process ID; prevents two processes writing the same batch.
- `bundles/`: standard self-contained game JSONL grouped by preset and seed, exported at completion.
  These records include existing replay/rules/AI fields plus local experiment identity. Use the
  existing aggregation tools on one matching ruleset at a time; do not mix variants in one bundle.

Every finished game is replayed before checkpointing, checking legality, mover, resulting keys,
final position and result. Resuming revalidates checkpoints and runs only missing tasks. A second
resume of a completed batch is idempotent. Unexpected worker failures mark the batch failed rather
than silently skipping games. Temporary unfinished files are ignored on resume.

To stop, send SIGTERM to the PID in `run.lock`. Finished games remain; in-flight games restart
from their deterministic seed on resume. The runner handles stop signals and removes its lock.
A stale lock is recoverable only when its process no longer exists. Do not manually delete a live
lock. Sleeping/rebooting the machine may interrupt computation; resume from the frozen runtime.

## Interpreting partial data

Tasks interleave variants, seeds and matchups. Until all planned games finish, completion speed
can bias any displayed win rate; progress counts are not rankings. The full analysis must include
color/equal-engine balance, repetition and ceiling draws, setup behavior, material retention,
checking drops and transcript diversity. Gate candidates only after full seed coverage and
confirm promising findings on held-out schedules. No throughput-based finish estimate is claimed
until enough representative games complete.
