# Executable engine specification

This document defines the compatibility boundary for a future Rust engine. The current JavaScript implementation is the first backend. Passing this suite establishes compatibility for the covered cases; it does not establish playing strength, exhaustive support for every possible position, or a performance gain.

## Run the contract

```sh
npm test
npm run test:engine-contract
node scripts/check-engine-contract.js --engine ./target/release/schness-contract
```

An executable may take arguments through repeated `--arg VALUE` flags after `--engine PATH`. The runner starts one process without a shell, sends one JSON request per line on standard input, and expects one JSON response per line in the same order. Diagnostics belong on standard error. The harness currently allows 30 seconds and 8 MiB of output for this small conformance batch; these are harness limits, not engine thinking limits.

Every request has `schemaVersion: 1`, a unique `id`, a `game`, and `state`. Search requests also have `options`; rule requests have an `action` (possibly null). Responses echo `id`. The JavaScript protocol adapter is `scripts/engine-contract-js.js`; `scripts/engine-contract.js` defines semantic assertions. Invalid requests return `{id, error: {message}}` and must not prevent a subsequent valid request from being processed.

## Search semantics

- Scores are from the root player's perspective. Actual player identity determines maximizing/minimizing behavior, including consecutive turns by the same player.
- Integer strength 0–100 requests the same depth. Explicit depth overrides strength. One depth unit is one player action, including placement, drops, and extra turns; it is not a full pair of turns.
- There is no implicit node or time cap. Explicit budgets remain binding. A budget interruption publishes only the last completed iteration, or a legal fallback with null score and empty continuations if none completed. Requested depth and completed depth are separate fields.
- Level zero chooses a legal action without searching successors. Terminal roots return no action and require no expansion.
- Principal variations must replay legally and begin with their corresponding root action. Multi-PV alternatives must be distinct and sorted by score. Equally optimal tie choices and equivalent continuations may differ across backends; exact node counts and timings are not compatibility requirements.
- The exact reference profile must agree with independent exhaustive oracles when tactical extensions and selective reductions are disabled. Quiescence, bounded check evasions, and late-move reductions are explicit options. Nominal depth with reductions is not exhaustive minimax depth, and a selective winning score is not a mate proof.
- Search must not mutate caller state. Reversible adapters must restore state after completion, cancellation, and exceptions. Published arrays must not be reused as scratch buffers. Treat action values as read-only; Schness may share frozen action objects.
- Search-bound caches must preserve repetition/history semantics and remaining-depth semantics. Static evaluation caching requires an explicit evaluation key and must not bypass terminal/repetition adjudication. Cache capacity must remain bounded.

The portable adapter exposes `action`, `score`, `requestedDepth`, `completedDepth`, `nodes`, `stopped`, `pv`, and `variations`. Graph actions are strings; Schness actions are structured values. See the committed fixtures for complete wire examples and expected values.

## Rules and state

Rule responses contain the complete sorted `legalActionKeys`, `result`, and `nextState` (null when no action was requested). Full state includes phase, board, side to act, reserves, rights, variant configuration, and repetition bookkeeping. A rewrite must preserve legal move sets and complete transitions, not merely visible board placement.

The static corpus includes 142 snapshots across all 36 production presets, sampled from deterministic opening and later positions. Their expected results come from the frozen v5 rules implementation, separately from the current optimized rules. Source hashes are checked. `scripts/generate-engine-rule-contract.js` is an explicit maintenance tool: generation is never part of test execution, and expectation changes require review. These sampled paths are not exhaustive rule coverage.

## Coverage and independent checks

| Contract | Automated evidence |
| --- | --- |
| Portable graph search, budgets, turn identity, ties, terminal roots, Multi-PV, quiescence | 17 hand-authored cases in `test/fixtures/engine-contract/graphs.json`; independent exhaustive graph oracle in `test/engine-contract.test.js` |
| Tactical winning actions | 15 committed fixtures from `research/search-performance-v5/tactical-corpus.json`; independent exhaustive mate checks in `test/search-tactics.test.js` |
| Rules compatibility | 142 frozen snapshots in `test/fixtures/engine-contract/rules.json`; all-preset legacy comparisons and more than 10,000 reversible transitions in `test/search-reversible.test.js` |
| Exact generic search | All 5,478 reachable tic-tac-toe states and randomized DAG oracles in `test/search.test.js`; additional reversible/PVS DAG checks |
| Restoration, attack safety, history, caches, selective-search limitations | `test/search-reversible.test.js`, `test/search-tactics.test.js`, `test/competitive-search.test.js` |
| Worker request correlation, option forwarding, errors | `test/bot-worker.test.js`; browser integration in `e2e/engine-contract.spec.js` |
| Benchmark configuration and frozen sources | `test/competitive-benchmark.test.js` |

The portable batch totals 174 cases. Its assertions are shared by JavaScript and an external executable; it does not ask Rust to reproduce JavaScript's internal data structures. Existing JavaScript unit tests remain necessary for adapter-specific invariants that the portable protocol cannot observe.

## Rust acceptance

Before switching backends, run the portable contract against the Rust executable, port adapter-specific restoration and cancellation tests, and add differential legal-action/transition tests over broad generated positions. Preserve all existing fixtures and independent oracles. Exercise the real browser/worker integration after wiring it up. Benchmark identical frozen positions and settings separately from correctness tests. Playing-strength acceptance still requires completed, preserved matches against the unchanged opponent; passing conformance tests does not meet the 51% win target.

The experimental native implementation and build instructions are in [engine-rust/README.md](../engine-rust/README.md); completed match evidence and limitations are in [research/rust-engine-v1/README.md](../research/rust-engine-v1/README.md). Conformance passes do not authorize production promotion.
