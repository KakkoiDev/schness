# Native Schness engine (research backend)

Build with a current stable Rust toolchain:

```sh
cargo build --release --locked --manifest-path engine-rust/Cargo.toml
npm run test:rust
node scripts/check-engine-contract.js --engine ./engine-rust/target/release/schness-engine
```

The executable reads the version-1 JSON-lines protocol in
`docs/engine-behavior-contract.md`. It implements all 36 preset rule policies,
full state transitions and repetition adjudication, reference/competitive
static evaluation, iterative alpha-beta, bounded tactical quiescence/check
evasions, explicit late-move reductions, Multi-PV, and caller time/node budgets.
No implicit search time/node cap is applied. Requested and completed depth are
separate; reductions are selective, not a mate proof.

This is a native research backend, not yet the browser's production engine.
The JavaScript host still adjudicates the recorded match and independently
checks legal actions at every position, alongside pinned Fairy's perft output.
The benchmark explicitly configures a 30-second process-failure watchdog; the client defaults to no watchdog. Bench searches
explicitly use 100 ms. Process IPC overhead is included in recorded times.

The hot path uses typed actions and reversible state updates, keeping JSON at the process boundary.

The first version favors a straightforward port over complete internal feature
parity: JavaScript's transposition cache, PVS, aspiration windows,
killer/history ordering and repetition-aversion tie preference are not yet
implemented here. Cache/PVS tuning fields sent by the research harness have no
effect. Do not attribute result differences solely to language, or call this
an equivalent algorithm speed comparison. Exact nonselective score comparisons
and independent rule fixtures must continue to pass before integration.

`test:rust` checks 1,555 generated positions across all presets, 36 depth-3 exact
reference score comparisons, and the 174 portable cases. These are sampled
conformance checks, not universal equivalence or strength proofs. Match logs,
source hashes, the exact native binary and Fairy GPL sources are frozen with
every screen. No strength improvement is claimed from compilation or test passes.

Rust dependencies are locked in Cargo.lock. serde and serde_json are used for
JSON transport; Cargo metadata identifies their licenses. Fairy remains a
separate pinned GPL engine; its source, license and authors are preserved by the
benchmark manifest/archive.

Optional `cacheEvaluation: true` now enables a bounded per-search static evaluation table (default off, `maxTableEntries` default50000). Full position keys include rule rights and reserves; repetition is adjudicated before lookup. This stores neither search bounds nor game results. It does not establish a playing improvement.

Root actions are now reordered by the previous fully completed iteration, retaining the entire root set before Multi-PV truncation. `rootOrdering: false` disables this for diagnostics. Interrupted iterations never publish or reorder partial results. This changes selective move order, so playing strength still requires fresh matches.
