# Sharp v7 versus Sharp v2: complete shared-preset regression bench

This is a fixed-depth playing-strength comparison, not a timed speed competition.

- Both engines search depth four: four individual actions, not four complete move pairs.
- All 36 production presets supported by both frozen rule implementations.
- Six new seeds, all 16 king placements and both engine colors: 6,912 games.
- 3,456 tasks with v7 as White, followed by 3,456 tasks with v7 as Black.
- Seeded tie selection and repetition aversion for both; independent per-engine random streams.
- No time/node cap, quiescence or reductions. Ceiling: 200 total actions including placement.
- Every actual transition is checked against the legacy rules. Frozen-source hashes, checkpoints,
  replay verification and a single-runner lock prevent silent changes or duplicate work.

Baseline files are copied byte-for-byte from the archived all-variants-2026-10-24 runtime after
checking their original manifest hashes. origin.json records the Sharp v2 metadata and hashes.
Candidate core matches merged master 9fe678d911041af38d5c9056bc9838cc11e25cc5. The new run's
manifest records its exact runtime files, independent of the dirty working checkout's Git HEAD.

Run:

    node scripts/run-engine-regression.js --output output/local-experiments/sharp-v7-v2-full-v1-2026-10-25 --workers 8 --candidate-commit 9fe678d911041af38d5c9056bc9838cc11e25cc5
    node output/local-experiments/sharp-v7-v2-full-v1-2026-10-25/runtime/scripts/run-engine-regression.js --resume output/local-experiments/sharp-v7-v2-full-v1-2026-10-25

Do not prepare into an existing directory. Resume only with its frozen runtime. The same command
verifies all checkpoints after completion. Generate the readable per-color report with:

    node research/engine-regression-v1/report.js output/local-experiments/sharp-v7-v2-full-v1-2026-10-25

Reports show candidate wins, v2 wins, draws and draw reasons for each variant and each candidate
color separately. Wins count 1 and draws ½. A raw score >=50% does not prove non-inferiority or
universal strength. Seeds repeat 16 starts, ceiling draws are artificial, and timings collected
under parallel load are not isolated performance measurements. Do not pool historical custom-army,
capture-delay, objective or charge-bank datasets, which use distinct rule/engine adapters.

On completion preserve full runtime, manifests and bundles with scripts/archive-local-experiments.py,
verify all SHA-256 parts and the whole archive, and commit readable report/rates/progress beside it.
All PRs open at the merge request (#108–#122) have already been merged; this benchmark is new data.
