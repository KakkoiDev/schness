# Two-player engine, stepwise optimization — 25 October 2026

The default engine keeps the same evaluator and exact tested depth-limited scores while reducing
search cost. Sharp is now v7 and Learning/Steady v6; standard depths remain 4/2/3. Two optional
search experiments and a separate evaluation experiment were screened rather than silently
promoted. Multiplayer is deferred. Older tournament runtimes and datasets are unchanged.

## Steps and decisions

1. **Tactical/reference coverage.** Added 15 sparse constructed mate fixtures across Classic,
   checking drops, no-drop-mate, permanent loss and capture-bank rules. Their winning actions
   are independently recomputed with complete terminal-only AND/OR search through three plies.
   These are useful tactical cases, not a comprehensive tactical suite or claims of reachability
   from the initial position. Added 5,000-board legality comparisons, including malformed
   multi-king boards, and exhaustive checking-extension and reduction-risk tests.
2. **Avoid redundant safety simulation — retained.** Ordinary non-king moves already satisfy
   complete check-evasion and pin constraints. With at most one friendly king these establish
   safety without constructing a hypothetical board mask for every move. Drops cannot uncover
   attacks and must block every checking ray. King moves and multi-king boards retain the full
   safety simulation. This relies on Schness having no castling or en passant.
3. **Reuse search-stack masks — retained.** Each active depth owns a distinct buffer. Siblings
   reuse it after unmake; no child overwrites an active ancestor's masks. Overall timings improve;
   the isolated marginal speed benefit of pooling is too small to distinguish confidently here.
4. **Extend through checks — opt-in.** `quiescenceChecks:true` with a positive quiescence depth
   follows captures and legal checks, including permitted checking drops. In-check nodes search
   all legal evasions. An exhaustive small oracle verifies the selected extension semantics.
   It consumes the same node/time budget and can reduce completed nominal depth.
5. **Late-move reductions — opt-in experiment.** `lateMoveReduction:true` initially searches
   later qualifying quiet board moves one ply less deeply and re-searches improvements at full
   depth. Excludes root moves, captures, drops, setup, check evasions and checking moves.
   A regression fixture explicitly demonstrates a reduced fail-low hiding a full-depth win.
   This is selective search, not an exact optimization; default play leaves it disabled.
6. **King-escape evaluation — research only.** A frozen experimental runtime adds five points
   per safe king escape relative to the opponent during normal play. It includes the cost of
   calculating these escapes. The screen does not justify changing production evaluation.

Both search switches default to false and are forwarded by the browser worker. Invalid switch
types produce correlated worker errors. The exact mode remains the reference for future work.

## Performance and correctness

Seven warmed repetitions over 32 saved Classic positions at depth four:

| Version | Median time for 32 positions | Nodes per pass |
|---|---:|---:|
| Frozen round-four engine | 160.60 ms | 50,824 |
| Final default engine | 147.96 ms | 50,824 |

That is **7.9% less time**, or **1.085× speed**, on this workload. Scores and node counts agree
for every position in each stage: 672 baseline/candidate pairs across the three seven-pass
measurements. Stage one measured 153.76→142.99 ms; stage two 152.03→141.51 ms against the same
frozen baseline. These separate timings should not be multiplied together or combined with
historical speed ratios. Measurements are host/workload specific, not Elo estimates.

All **336 unit tests** and **four actual browser-worker tests** pass. Browser tests cover desktop
and Pixel 7 emulation, including variant rights, legal continuations, caps and experimental
option forwarding. Emulation is not physical-phone performance testing.

A separate Chromium benchmark ran 96 searches per engine at 100 ms each: mean completed depth
5.979 versus 6.000; total nodes 3,355,893 versus 3,751,520. This shows increased throughput but
little change in this sample's completed integer depth. All actions and continuations replay
legally. Depth 100 was requested, subject to time and node caps, not promised or generally reached.

## Separate equal-time screens

Each row is 32 games: 16 king starts with candidate colors swapped, 25 ms per action, requested
depth 100, ten-million-node cap and a 100-play-ply ceiling. Classic quiet-drop rules only.

| Candidate / opponent | Candidate wins | Losses | Draws | Mate / repetition / ceiling |
|---|---:|---:|---:|---|
| Final exact engine / frozen round four | 2 | 0 | 30 | 2 / 4 / 26 |
| Checking extension depth 2 / frozen round four | 4 | 1 | 27 | 5 / 5 / 22 |
| Reduced search / frozen round four | 5 | 3 | 24 | 8 / 5 / 19 |
| King-escape evaluation / final exact engine | 3 | 2 | 27 | 5 / 4 / 23 |

These are **four separate screens, not a pooled strength estimate or ranking**. The checking
extension ran before reductions were added; its exact source snapshot is preserved. The first
three candidates include the exact speed improvements; only the evaluation row isolates its
heuristic against the final exact engine. Many games hit an artificial ceiling. Wall-clock
matches are noisy, the schedules repeat the same starts, and there is no held-out strength
validation across variants. No experimental result establishes an Elo gain or proven balance.

## Reproduction and remaining work

`research/search-performance-v5/` contains full compressed measurements, all 128 match replays,
readable results, exact source hashes, historical stage snapshots, a frozen baseline and the
experimental king-safety runtime. `artifacts.json` records SHA-256 hashes and byte sizes.
Run `node scripts/verify-search-v5.js` to validate source hashes, score agreement, legal lines,
all replay results, caps and archive checksums. Benchmark scripts are in `scripts/`.
Round-four original source snapshots are also preserved so its historical verifier remains usable.

Larger paired and held-out tests should precede promotion of tactical extensions, reductions
or evaluation weights. Null-move/futility/SEE pruning, neural evaluation and shared-table parallel
search remain unimplemented: their rule assumptions, training data or concurrency costs need
separate evidence. This pass does not claim to exhaust every possible engine optimization.

See [how the engine works](how-the-game-engine-works.md) and
[two-player priorities](two-player-engine-priorities.md).
