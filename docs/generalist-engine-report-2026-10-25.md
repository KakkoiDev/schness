# Generalist engine stabilization — 25 October 2026

## Delivery

The engine core is ready for review and controlled use. Full application release approval remains
open because broad UI tests are not consistently green. Tactical search is opt-in; this report
does not establish a general strength gain or an Elo rating. No running/frozen variant experiment
was modified or pooled into this benchmark.

## What changed

| Area | Before | Now |
|---|---|---|
| Numeric level | Nonlinear depth 1–6 and exponential node budget | Integer level 0–100 directly requests that many future actions |
| Level zero | Still searched a successor | Legal ordered fallback, zero successor-search nodes, no score |
| Budget reporting | Completed depth and stop status | Also explicit requested depth; never claims an interrupted depth completed |
| Analysis | One action and score | Chosen continuation plus up to 10 ranked root continuations |
| Tactical horizon | Static evaluation at depth limit | Optional bounded adapter-defined tactical actions and forced danger replies |
| Worker | Action-only response | Backward-compatible response, with analysis included only when requested |
| Validation | Alternate take-away objectives and Schness legality | Extra turns, independent tic-tac-toe oracle, horizon traps, line replay, budgets and worker protocol |
| Browser cache | v118 | v119 |

`strength: 11` requests 11 actions, counting either player's action as one unit. It does not mean
11 complete White/Black rounds. Numeric requests have a default 262,144-node safety budget.
Level 100 is a request, not a promise of exhaustive 100-action search. The API exposes
`requestedDepth`, `completedDepth`, `stopped` and `nodes`; no new settings slider is included.
Explicit depth/node options override the mapping. Existing Learning/Steady/Sharp fixed depths
remain 2/3/4 and tactical extension depth remains zero unless explicitly requested.

The adapter supplies legal actions, immutable transitions, actual next player, terminal outcomes,
heuristic evaluation and complete position identity. Search supports deterministic two-player
zero-sum perfect-information games, including extra turns and different victory conditions.
It does not support dice, hidden information or simultaneous actions automatically. Correct
rules make a variant searchable; a calibrated evaluator is still needed to play it well.

Optional `noisyActions` and `inDanger` callbacks define tactical search without chess knowledge
in the shared module. Schness supplies captures and check detection. Danger disables stand-pat
and searches all legal replies, but the explicit extension limit can still terminate in danger.
All extension nodes count against the same cap. Continuations are predicted best-play lines,
not all possible futures or proofs of forced wins. Quiescence is disabled by default.

## Correctness and regression evidence

- 314 workspace unit tests pass. This workspace includes later research suites not present on
  the parent PR branch; the count describes the tested workspace, not a clean-parent suite count.
- All 5,478 reachable tic-tac-toe positions agree with an independently implemented exhaustive
  minimax oracle; chosen actions preserve the oracle value.
- Tests cover different objectives, terminal roots, extra turns, cache/uncached agreement,
  legal immutable Schness continuations, multi-line ranking, exact node caps, time exhaustion,
  zero-level fallback, invalid options and request-correlated worker errors.
- Dedicated real-browser worker tests pass on desktop and Pixel 7 emulation (2/2). They verify
  levels 0/1/11/100, legal returned actions and continuations, cutoffs, old action-only payloads
  and invalid-level errors.

## Browser investigation

The initial unrestricted-concurrency happy-path run was 35 passed / 21 failed / 2 skipped.
Failures included dynamic module-fetch errors. Limiting to two workers improved this to
51 passed / 5 failed / 2 skipped. Replacing only the engine and service worker with the prior
engine on an isolated copy of the same local interface produced 50 passed / 6 failed / 2 skipped.
This demonstrates failures also occur without the candidate engine; it does not prove every
individual failure is unrelated.

The three failures unique to the controlled candidate run (mobile training, coordinate controls,
first-visit rules) all passed on serial recheck (3/3). The theme toggle failure occurred with both
engines. A mobile-home test explicitly expects a hidden board, contradicting the already implemented
mobile playable board. No unrelated UI implementation or existing assertions were changed to make
these results green. The previous-engine comparison used the same local interface, not a pristine
historical full application. Broad browser release checks remain open. Browser logs and an outcome
summary are preserved beside benchmark results.

## Matched-budget playing comparison

Both sides use the same current Classic Schness rules and material/mobility evaluator. Baseline
search and bot are preserved from commit `bb6a09f85617027a051f60fcd778ff4b9b07e0e8` (only import
paths are adapted for the benchmark). Each move requests depth 4 with at most 1,024 search nodes.
Eight deterministic king starts are each played with candidate colors swapped, per profile.
Games stop after 120 normal-play actions. All 32 full replays and final results were revalidated.

| Candidate profile | Wins | Losses | Draws | Score including half-draws |
|---|---:|---:|---:|---:|
| Default, no tactical extension | 7 | 5 | 4 | 56.3% |
| Optional tactical extension depth 2 | 8 | 3 | 5 | 65.6% |

All wins were checkmate; all nine draws reached the benchmark ply ceiling. These are candidate
versus baseline counts, not White/Black balance statistics. Only 16 games per profile and eight
reused starts are far too few to establish superiority. This is a smoke benchmark, not a rating.
Node accounting is shared, not equal wall-clock time: tactical search does different work per
node and can complete less nominal depth. At extension depth 2, candidate completed depth 4 on
11 moves versus baseline's 37, illustrating that tradeoff. Default candidate completed depth 4
on 25 moves versus baseline's 42. Full depth distributions and observational timings are in
`results.json`; browser tests ran concurrently, so timings are not a clean performance measurement.

## Reproduction and review

Run `npm test`, then `npx playwright test e2e/engine-contract.spec.js --workers=2`.
Run `node scripts/verify-generalist-bench.js` to check source fingerprints, compressed/raw SHA-256
checksums and every saved move/result without starting games. `node scripts/bench-generalist-engine.js`
reruns the exact 32-game schedule and writes fresh observations. The committed compressed replay file
is `research/engine-generalist-v1/games.jsonl.gz`; manifest, source snapshots, results and checksums
are adjacent. The verifier rejects source drift rather than accepting mixed engine versions.

Decision: publish for review with tactical search optional. Before enabling it by default, use a
larger fresh-opening paired benchmark at matched budgets. Before a complete app release, resolve
or independently baseline the remaining broad UI checks. This change is not automatically merged.
