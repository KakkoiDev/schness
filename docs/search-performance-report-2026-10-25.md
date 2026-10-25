# Playing-engine search optimization — 25 October 2026

This change optimizes game-playing computation. It does not change app navigation or UI controls.
The baseline is the generalist engine at commit `3d4dea355e2f9e9c79430bcc842f2ff2db25f8c3`.
Results below are local measurements, not an Elo rating or a claim about every game/variant.

## What changed and why

1. **Play and ranked analysis have different root searches.** With one requested line, the best
   score found at the root becomes alpha for subsequent alternatives, allowing losing branches
   to be cut. With `multiPv > 1`, every root alternative still gets an exact score so ranking is
   meaningful. `chooseAction` always uses the play path.
2. **Move ordering reuses search knowledge.** Completed root rankings order the next iteration.
   A separate bounded table promotes previously searched best actions at internal nodes, even
   across iterations. Existing Schness capture-first ordering remains the fallback. Generic
   adapters can supply `actionKey` to recognize equivalent freshly generated actions.
3. **Transposition tables are bounded and depth-safe.** Each of the score and best-action tables
   defaults to at most 50,000 entries (`maxTableEntries`), evicting the oldest entry on insertion
   when full. Score/bound reuse requires the same remaining depth; arbitrary adapters can have
   depth-dependent terminal values. Cross-depth entries guide ordering only. Full repetition
   history remains part of Schness identity; deleting it for more cache hits would be incorrect.
4. **Less duplicate work per node.** Lazy per-node `facts.actions()` generates the current side's
   legal actions once and shares them between adjudication, expansion and evaluation. A trusted
   `getResultUnchecked` path reuses that list; public adjudication still performs its existing
   guarded action generation. Root successor states are also reused across iterative depths.
   Without a time cap, the inner loop no longer reads the clock at every node.
5. **Measurable search diagnostics.** Completed searches include cutoff, cache-hit, table-cutoff,
   best-action-hint, tie-research, evaluation, action-generation, transition and table-size counts.
   Tactical-node counts are now zero when tactical extension is disabled.

A fail-low score equal to the current root best can be only an upper bound. Before random or
repetition tie-breaking can select that action, it is searched again with a full window. A
regression test constructs exactly this trap. Partial iterations still never replace completed
results, and the node cap includes these re-searches.

The heuristic, legal rules, numeric level semantics, optional tactical extensions and fixed
preset depths are unchanged. Named engine identities advance to Sharp v4 and Learning/Steady v3,
because ordering changes can alter budget-limited play and seeded tie choices. Browser cache
advances to v120. Historical/frozen experiments are unchanged and must not be pooled with these
new identities.

## Fixed-position performance

Thirty-two saved Classic positions, drawn from six correlated opening trajectories in the prior
benchmark, are searched at depth 4 with repetition aversion. Both engines are warmed first; three
measured passes alternate engine order. The saved corpus is identical for both engines.

| Measurement | Previous engine | Optimized engine |
|---|---:|---:|
| Total visited nodes per fixed-depth pass | 165,145 | 72,755 |
| Median time for the 32-position pass | 2,598.8 ms | 892.0 ms |
| Average completed depth at 4,096 nodes/position | 3.44 | 4.19 |
| Depth distribution at that cap | 19×3, 12×4, 1×5 | 2×3, 24×4, 4×5, 2×6 |

All 96 fixed-depth score pairs match exactly. Nodes fall **55.9%**; median elapsed time improves
**2.91×** on this machine and corpus. The optimized search completes greater depth on 23 positions,
equal depth on nine, and less depth on none. Both capped engines consume the same total 131,072
nodes. These are comparative engineering measurements, not independent samples of all possible
positions. Other games, hardware, evaluators, random tie policies and branching factors can differ.

The optimized fixed-depth passes record 13,872 alpha-beta cutoffs. In capped iterative search,
5,992 best-action hints are used. Score-table cache hits are zero on this history-sensitive corpus:
these data support the pruning, reuse and ordering improvements, not a claim that more score-table
hits produced the gain. The bounded cache and exact-depth transposition behavior are additionally
checked on game graphs with actual transpositions.

## CPU profiling

Separate Node CPU profiles use three depth-4 passes of the same corpus. In the baseline,
`boardInCheck`, `rayHits`, `stepHits` and legal-action generation account for about 65% of self
samples. This confirms attack/legal generation is a major cost. Reusing legal lists and visiting
fewer nodes reduces that work without changing legality. Samples for `boardInCheck` fall from
1,920 to 572 in the profiling runs; these are statistical samples, not exact call counts.

State transitions/copying and full position/history identities remain visible costs. The change
reuses root children but retains immutable state transitions and complete draw history rather
than introducing a risky mutable undo mechanism or incomplete hashes. Raw CPU profiles, their
readable summary and benchmark observations are archived for further work.

## Playing comparison

A separate 32-game paired match uses all 16 king starts with colors swapped, Classic quiet-drop
rules, a requested depth of 8, 2,048 nodes per move, deterministic tie handling and a 120-action
normal-play ceiling. Neither side uses tactical extensions. Same node limits, not equal time.

| Optimized wins | Previous-engine wins | Draws | Optimized score with half-draws |
|---:|---:|---:|---:|
| 13 | 1 | 18 | 68.8% |

All 14 decisive games end in checkmate. Four draws are threefold repetition and 14 reach the ply
ceiling. Full replays and final outcomes are checked, not merely the aggregate counts. These are
engine-vs-engine counts, not color-balance results. The schedule is small and deterministic; this
is promising playing evidence, not a proven general strength gain. Search depth improvements
also do not guarantee better heuristic decisions on every position.

## Regression and integration checks

- All **320 workspace unit tests pass**. This workspace includes research suites beyond the PR's
  original parent branch, so the number is explicitly a workspace result.
- Independent exhaustive tic-tac-toe minimax still agrees on all 5,478 reachable states.
- Sixty seeded transposition graphs are checked at every depth 1–6 against an independent oracle,
  with caching on/off, tiny cache capacity, iterative search and ranked analysis (1,800 searches).
- Targeted tests cover exact alternate scores, real root pruning, false-tie re-search, extra turns,
  bounded table sizes, cross-iteration hints, legal-list reuse, immutable continuations and budgets.
- Trusted adjudication matches public results through Classic, checking-drop and capture-bank play.
- Direct real-browser worker tests pass on desktop and Pixel 7 emulation (2/2). No wider UI changes
  or UI clicking ability are part of this optimization.

`node scripts/verify-search-performance.js` verifies source fingerprints, benchmark pairs, legal
principal variations, node limits, archive checksums, and all 32 match replays/results without
starting new games. `scripts/bench-search-performance.js` reruns performance measurements;
`scripts/bench-search-play.js` reruns the separate match schedule. Artifact hashes are recorded in
`research/search-performance-v2/artifacts.json`. Complete observations are in `results.json.gz`,
readable aggregate data in `summary.json`, and full matches in `play-games.jsonl.gz`.

Decision: keep these exact-search optimizations, retain tactical extensions as opt-in, and publish
for review without automatic merge. A larger fresh-start, multi-budget match would be needed for
an Elo-style or general-strength claim. No speculative null-move, futility or reduced-depth pruning
was added: those would need additional game-specific safety assumptions in a general engine.
