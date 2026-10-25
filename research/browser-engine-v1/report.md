# Browser playing-engine benchmark — 2026-10-25

Fairy-Stockfish WebAssembly has a substantial search-speed advantage over the current Schness JavaScript engine on this workload. This is a performance measurement, not an Elo or match-strength result.

| Measurement | Schness JavaScript | Fairy-Stockfish WebAssembly |
|---|---:|---:|
| Search nodes/second, aggregate browser wall time | 87,122 | 1,602,117 |
| Median completed/reported exact iteration depth | 6 | 16 |
| Depth range | 4–7 | 12–22 |
| Median wall time for a requested 100 ms search | 99.43 ms | 104.47 ms |
| Total depth-4 legal-tree enumeration time | 890.41 ms | 170.60 ms |

Fairy reports **18.39×** as many search nodes per second; its end-to-end depth-4 legal-tree enumeration is **5.22×** faster. Nodes have different costs and meanings in the two searches. Fairy uses selective search, extensions and reductions, so depth 16 does not mean every line was examined to 16 plies, and the depth figures cannot be compared as equal exhaustive horizons. No games between the engines were played in this benchmark; stronger play is plausible but unmeasured.

## Conditions and rules

- Actual headless Chromium 153.0.8010.12, arm64 Darwin; CPU reported by OS: Apple M6. Both engines ran in the same browser session on the same machine. No phone emulation or UI interaction benchmark.
- Fairy package pinned to `fairy-stockfish-nnue.wasm@1.1.12`, engine commit reported as `b2e693ef`, Emscripten 2.0.26. One search thread, 16 MiB hash, strongest skill default, MultiPV 1, no pondering. **NNUE disabled**: no trained Schness network was supplied. The package's name does not imply neural evaluation was used.
- Schness production source hashes recorded in results.json; depth request 100, 10,000,000 node ceiling, 100 ms time budget, quiescence default 0, repetition aversion disabled. Its own search tables remain per-search bounded defaults. Fairy hash is cleared for each search.
- Common game: 4×4, kings already placed, rook/bishop/knight reserves, captured pieces change to the capturing player's bank, capacity six (all six non-king pieces fit), quiet drops, no cooldown, ordinary board checks/mates, stalemate draw. This is a **capture-bank variant**, not canonical Classic's return-to-original-owner capture rule. Standard Fairy's capture conversion differs from Classic; a Classic performance claim would require an engine extension.
- Corpus: the 32 existing saved positions in research/search-performance-v2/positions.json, reinterpreted under the common capture-bank rules with fresh repetition histories. These are correlated positions from a small number of trajectories, not a random representative population or a new variant tournament.
- Both engines matched every root move and each move's depth-3 subtree, totaling **702,598 depth-4 leaves across 32 positions**. Enumeration deliberately counts legal action paths without adjudicating repetition history; it establishes this finite legal-tree agreement, not universal game equivalence.
- Timed search: 32 positions × three repeats = **96 searches per engine**, alternating engine order each repeat after warm-up. Every returned move was checked against Schness legal actions. Fairy depth/node values use the last info line without lower/upper-bound markers; all its UCI output is preserved. Timer samples and engine lines are in results.json.
- Search wall time includes browser command/polling overhead for Fairy, and the direct synchronous call for Schness. Enumeration includes the same external command overhead; this biases that measurement against Fairy. Warm-up before timed search; no separate warm-up before enumeration. One measured browser session, no thermal/background-workload control, no confidence interval on speed ratios.
- Both are configured for 100 ms, but actual wall times differ by about 5 ms. Aggregate node throughput uses actual wall times. Initialization timing is recorded but excludes initial script download and is not a product startup benchmark.

## What this suggests

Keep the flexible adapter architecture, but optimize the hot playing path: compact board/attack representations; incremental state and evaluation; reversible make/unmake to avoid cloning; and carefully validated search ordering and selective pruning. The earlier exhaustive search-oracle tests remain essential: aggressive pruning can increase speed while introducing wrong tactical results. A single benchmark does not isolate which of these changes explains Fairy's advantage.

Ordinary Stockfish does not provide matching Schness rules. OpenSpiel and Ludii are not included as measured engines: no equivalent local browser build and matching adapter were established. This report compares two browser-running engines, not an untested ranking of those projects.

## Reproduction

The checked-in benchmark scripts never change production code. Download and extract the pinned npm package to `/tmp/schness-browser-engines/package`. Serve the repository on port 4187 with COOP `same-origin` and COEP `require-corp`, mapping `/external/` to that package directory. Then run `node scripts/bench-browser-engines.js` and `node scripts/report-browser-engines.js`. Playwright Chromium must be installed. The server's reproducible implementation is in server.py beside this report. Package JS/WASM hashes and every local engine source hash are included in results.json. External binaries are not vendored.

Sources: [browser build](https://github.com/fairy-stockfish/fairy-stockfish.wasm), [custom variants](https://fairy-stockfish.github.io/custom-variants/), [configuration and rules source](https://github.com/fairy-stockfish/Fairy-Stockfish/blob/master/src/variants.ini). The pinned binary's observed behavior was checked directly rather than inferred from current upstream documentation.
