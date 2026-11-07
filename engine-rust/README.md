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

The native search now includes repetition-safe, same-remaining-depth transposition
bounds, bounded position hints, killer/history ordering, principal-variation
search, aspiration windows, completed-iteration root ordering, and repetition
aversion with full re-search before bound-equality tie selection. Competitive
ordering includes the exposed-piece penalty used by JavaScript. Static evaluation
caching is optional; quiescence caching remains unimplemented and its option is
inert. Native ties are deterministic; JavaScript may use seeded random ties.
This closes known feature gaps but does not prove identical selective trees,
node counts, tie choices, timing, or playing strength. The reference/nonreduced
score checks and independent rules/tactics remain mandatory.

`test:rust` checks 1,555 generated positions across all presets, 36 depth-3 exact
reference and36 nonreduced competitive score comparisons, and the 174 portable cases. These are sampled
conformance checks, not universal equivalence or strength proofs. Match logs,
source hashes, the exact native binary and Fairy GPL sources are frozen with
every screen. No strength improvement is claimed from compilation or test passes.

Rust dependencies are locked in Cargo.lock. serde and serde_json are used for
JSON transport; Cargo metadata identifies their licenses. Fairy remains a
separate pinned GPL engine; its source, license and authors are preserved by the
benchmark manifest/archive.

Optional `cacheEvaluation: true` now enables a bounded per-search static evaluation table (default off, `maxTableEntries` default50000). Full position keys include rule rights and reserves; repetition is adjudicated before lookup. This stores neither search bounds nor game results. It does not establish a playing improvement.

Root actions are now reordered by the previous fully completed iteration, retaining the entire root set before Multi-PV truncation. `rootOrdering: false` disables this for diagnostics. Interrupted iterations never publish or reorder partial results. This changes selective move order, so playing strength still requires fresh matches.

Immutable rule JSON is cached once per parsed position for key construction; bank keys use fixed piece counts instead of cloning/sorting reserve vectors. Public state and canonical repetition keys remain unchanged. Selected repeated diagnostics preserve all scores/actions/node counts; no playing improvement follows from this allocation change alone.

Mobility evaluation uses the same borrowed action visitor as legal generation, counting callbacks rather than cloning rules/research/reserves and collecting a second move vector. Both-color counts over frozen fixtures and children are checked against cloned-side generation; public state remains untouched.


Experimental `reducePrincipalVariation: false` restricts late-move reductions to null windows; default true preserves existing behavior. On all15 selected early-loss cases, all30 paired depth6 searches completed: four scores and one action changed. The Black start2 defense now matches the nonreduced depth6 action/score. This selected regression is tested; it does not establish universal equivalence or stronger play. Ten Rust tests and the external conformance batch pass. No new match launched or default promoted. Data: `rust-pv-reduction-ablation.json`.
