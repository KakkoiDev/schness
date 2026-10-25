# Faster Schness search without Stockfish — 2026-10-25

The existing JavaScript engine now searches the same depth-four workload **4.44× faster** and
examines **30.1% fewer nodes**, while preserving every measured exact score. In an equal-time
32-game Classic match it scored **12 wins, 1 loss and 19 draws** against the previous engine.
These are encouraging screening results, not an Elo estimate or a proof of optimal play.

## Changes

- Exact 16-bit attack geometry for Schness's 4×4 board replaces repeated coordinate/ray scans.
  Generic search still makes no board-size assumption; this optimization belongs to Schness rules.
- Each search owns one cloned working position. Make/unmake updates and restores board squares,
  bank entries, variant rights and repetition counts. Public moves, saves and replays remain
  immutable. Every successful transition is undone in `finally`, including interrupted searches.
- Material and piece masks update incrementally. The current position key is reused for
  adjudication, repetition checks and ordering instead of being repeatedly serialized.
- Full-history string sorting is replaced by bounded, collision-free interning of ordered
  extensions of the exact root history. Different histories never share an identity. This is
  conservative: equivalent histories reached in different orders may still miss a cache hit.
  Score entries remain restricted to equal remaining depth; board-only hints affect ordering only.
- Previous best moves, captures, quiet killer moves and a bounded history table improve ordering.
- Principal variation search uses narrow windows, with full re-search when necessary. It requires
  the adapter to declare its exact score lattice; arbitrary fractional-score adapters keep the
  original full-window search.
- Iterative single-line search uses aspiration windows around the previous completed score,
  widens failures and eventually retries a full window. Ranked analysis keeps full root windows.
  Only completed iterations are published; level 0 still performs no successor search.
- New production identities: **Sharp v5**, **Learning/Steady v4**. Depth presets stay 2/3/4.
  The service worker caches the new module in `schness-v121`. No Stockfish dependency is used.

The evaluator's values and objectives are unchanged. Tactical extensions remain optional and
speculative null-move/late-move pruning is not enabled. Learned evaluation weights and more
aggressive reductions need separate strength and variant-safety experiments.

## Measurements

Baseline: production engine at commit `d1db2c5b7146f4b44887cce00b92be56aa2398d8`, preserved as
three baseline source files under `research/search-performance-v3`. Current source fingerprints,
all timing samples, statistics and continuations are recorded with the results. Prior experiments
and frozen runtimes were not modified or pooled with this batch.

### Fixed-depth Node benchmark

32 saved Classic positions from the existing corpus, depth 4, three repeats with alternating
engine order after warm-up. These positions are correlated and are not a random game sample.

| Measurement | Previous | Improved |
|---|---:|---:|
| Median total time across 32 positions | 893.25 ms | 201.13 ms |
| Searched nodes | 72,755 | 50,824 |
| Exact score agreement | 96/96 paired measurements | 96/96 |
| Mean completed depth with 4,096 nodes | 4.1875 | 4.28125 |

At the fixed node budget, 3 positions reached a deeper completed iteration, 29 stayed equal and
none became shallower. Most of the time gain comes from lower cost per node; it is not a claim
of a proportional depth increase. The fixed-depth improved search recorded 1,414 score-cache
hits, 667 PVS re-searches and 27,768 history-ordering hits over the corpus.

### Real browser playing search

Headless Chromium 153.0.8010.12 on arm64, CPU reported by the OS as Apple M6. Same 32 positions,
three repeats, alternating engine order, 100 ms per call, depth request 100 and a 10-million-node
safety cap. Both engines ran inside Chromium; this does not measure interface responsiveness.

| Measurement | Previous | Improved |
|---|---:|---:|
| Searches | 96 | 96 |
| Mean completed lookahead | 4.875 plies | 5.792 plies |
| Mean actual elapsed time | 99.992 ms | 99.998 ms |
| Total visited nodes | 942,995 | 2,817,915 |

All returned moves and reported continuations replay legally. Levels describe requested actions
ahead; caps can prevent completion. A requested level of 100 still does not promise a completed
100-ply search. These browser measurements are not a new Fairy-Stockfish comparison.

### Equal-time Classic match

All 16 king-start combinations, each played with engine colors swapped: 32 games, 25 ms per
move, depth request 100, 10-million-node safety cap, no randomized ties, repetition aversion on,
and a 100-ply post-placement limit. Both engines are warmed first; play is serial on this machine.

| Outcome | Count |
|---|---:|
| Improved engine wins | 12 |
| Previous engine wins | 1 |
| Draws | 19 |

All 13 wins were checkmate. Draws: 17 hit the experimental ply ceiling and 2 were threefold
repetition. A ceiling draw does not establish the position is intrinsically drawn. Mean completed
move depth was 4.697 for the improved engine and 3.826 for the baseline, across different positions
encountered by each. Full action transcripts, timings, final positions and adjudications are saved.

This is one short, deterministic, color-swapped test on Classic only, with no thermal or background
load controls. Timed games are not byte-for-byte reproducible across runs. Do not generalize these
counts to every variant, every device or an Elo gain. Variant correctness has broader coverage
below; equal-time variant playing strength still needs separate measurements.

## Regression coverage

The complete workspace suite passes **327 unit tests**, retaining the existing independent
5,478-position tic-tac-toe oracle and 1,800 graph comparisons. Added coverage includes:

- 500 randomized boards comparing both colors' attacks on all 16 squares against frozen geometry.
- All **36 production presets**, comparing legal action order, transitions and adjudication with
  the frozen rules; more than 10,000 one-action undo checks plus nested sequence unwinding.
- Per-action incremental evaluation checks, legal ranked lines and matching fixed-depth scores
  against both frozen and immutable search paths, including capture overflow and setup.
- 5,280 additional graph-oracle comparisons covering PVS, aspiration retries, extra turns,
  transpositions, randomized/repetition ties, tiny caches and disabled optimizations.
- History-sensitive positions, tactical extensions, exact bank ordering, explicit zero repetition
  entries, budget interruption and adapter exceptions. The trusted-entry-point guard now covers
  the new reversible methods too.

**Four real-browser worker tests pass**, across desktop and Pixel 7 emulation: legacy replies,
levels 0/1/11/100, strict node caps, correlated errors, variant rights and legal analysis lines.
Emulation is not a physical-phone performance measurement. Broader interface tests were not run.

## Reproduction and verification

- `node scripts/bench-search-v3.js` — fixed-depth and fixed-node measurements.
- `node scripts/bench-search-play-v3.js` — the 32-game equal-time match.
- Serve the repository on localhost:4173, then `node scripts/bench-browser-search-v3.js`.
- `node scripts/verify-search-v3.js` — checks source fingerprints, score agreement, budgets,
  all Node/browser continuations, all 32 match replays and compressed artifact checksums.

Readable summaries and full compressed data are under `research/search-performance-v3`.
