# Two-player engine performance, round four — 25 October 2026

The current engine preserves the tested fixed-depth scores and reduces the cost of searching.
Sharp is version 6; Learning and Steady are version 5. Their standard depths remain 4, 2 and 3.
The evaluator and variant rules are unchanged. Older experiment runtimes remain frozen.

## What changed

Legal actions are generated directly in historical order, with early check-evasion and pin
filters followed by full king-safety validation. Precomputed geometry and private frozen
pooled actions reduce allocation; public legal actions remain independent mutable copies.
Legality checks reuse a scratch mask buffer. Static leaves obtain exact legal-action counts
without allocating lists, and node facts share those counts. Search uses linked continuations
and reusable ordering ranks instead of repeatedly copying arrays and allocating wrappers.
These changes add no speculative pruning.

## Same-session saved workload

32 saved Classic positions, depth four, three warmed repetitions; the table gives median time
for one complete pass and nodes for one pass. All 384 searches agree in score across stages.

| Stage | Time (ms) | Nodes |
|---|---:|---:|
| Earliest preserved generalist baseline | 2,610.1 | 165,145 |
| Shared root bounds / earlier facts work | 900.1 | 72,755 |
| Previous optimized engine, a069cf2 | 207.9 | 50,824 |
| Current engine | 157.6 | 50,824 |

The latest round is 1.32× as fast (24.2% less time); cumulative speed is 16.56× the earliest
preserved baseline on this workload. Identical latest node counts show reduced per-node cost,
not additional branch pruning. With a fixed 4,096-node budget, both latest versions completed
mean depth 4.28125. These are workload-specific measurements, not an Elo claim.

## Browser and correctness

All 332 unit tests pass, including reference comparisons across 36 production presets,
1,000 generated boards, exact small-game search oracles, public action isolation and legal
principal variations. Four browser-worker tests pass on desktop and Pixel 7 emulation.
Emulation is not a physical-phone performance measurement.

In Chromium, 96 searches per version with a 100 ms budget completed mean depth 5.729 for the
previous engine and 5.969 for the current engine. Total nodes were 2,706,035 and 3,487,473.
All returned actions and continuations replay legally. Requested depth was 100 with a
10-million-node cap; this does not mean depth 100 was reached.

## Equal-time play and limitations

A 32-game Classic match covered all 16 king starts with colors swapped, at 25 ms per action:
current engine **3 wins, 0 losses, 29 draws**. Three games ended in checkmate, five in threefold
repetition and 24 at the artificial 100-play-ply ceiling. This small, draw-heavy sample offers
limited strength evidence; ceiling draws should not be interpreted as inevitable game draws.
Wall-clock budget matches are not bit-for-bit reproducible, and only Classic was matched.

## Reproducibility and scope

The research directory contains frozen predecessor sources, benchmark scripts' source hashes,
full saved search results, browser results, CPU profiles, logs and all match replays. Run
`node scripts/verify-search-v4.js` to verify hashes, legal lines, score agreement, replay results
and archive checksums. CPU sampling includes runtime/JIT overhead and is diagnostic rather
than a causal decomposition of the speed improvement.

See [how the engine works](how-the-game-engine-works.md) for the algorithm and Stockfish
comparison, and [two-player priorities](two-player-engine-priorities.md) for the next gates.
Multiplayer is deferred. Further strength work should begin with tactical regression coverage
and controlled equal-time evaluation, before changing selective search or evaluation weights.
