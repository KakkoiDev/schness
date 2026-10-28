# Research decision — 28 October 2026

The equal-100 ms goal remains unmet. The latest completed isolated screen, king-escape geometry, scored 2 wins, 29 losses and 1 draw (6.25% raw wins); the preceding direct-drop screen scored 2/28/2. Neither supports promotion or a 192-game confirmation. Production keeps experimental geometry, fork evasions and root PVS off. The exact checked-node evaluation deferral remains adopted with prior 394-unit, 174-portable, 19-independent-mate and four browser-worker checks.

## What the recent evidence rules out

| Direction | Retained evidence | Decision |
| --- | --- | --- |
| Quiescence bound cache | 128-case fixed-depth ABBA: about 80% slower for 2.26% fewer nodes | Keep off; stop cache/hint variants |
| Q best-action hints | Similar node reduction, no clear timing gain | Reject |
| Lazy evaluation bounds | Fewer evaluations but 0.83% more nodes, no compelling timing gain | Reject; no generic-hook adoption |
| Piece-specific history keys | Observed cross-piece history use; prototype slightly increased nodes and cost | Reject; aliasing is not an identity bug |
| Category-based ordering changes | Cutoff ranks and tried-action denominators differ by category | No candidate: conditional rates do not establish a better order |
| Root equality shortcut | Random-tie diagnostic: 344 of 582 equal bounds resolved lower; 238 remained equal | Preserve verification, repetition preference and randomized ties |
| LMR guards, aspiration retries, fork refinements | Prior bounded candidates failed equal-time diagnostics | Stop these families without new independent evidence |
| Mate-delay/material-horizon drilling | Complete short-mate audits found no demonstrated missed winning choice; deeper material probes hit unchanged caps | Stop expanding these audits |

The root-tie study includes 128 no-random and 128 deterministic-random queries, with two random queries capped at depth four. All instrumented results match the source baseline, including scores, actions, nodes, completed depth and PV. Its modes are not playing-strength comparisons. The tried-action study's child-node costs overlap ancestor edges and cannot be summed as a partition of search work.

## Selected next question

The competitive static evaluator discounts an attacked nonking piece by 12% of value when geometrically defended, versus 45% when undefended. A geometric defender may be pinned to its king and unable to recapture. This is an intentional heuristic approximation, not a demonstrated rule bug or evidence that either coefficient should change. Unlike the rejected king-escape work, this concerns nonking recapture feasibility.

Measure the approximation before proposing a candidate. Use the existing 128 outcome-inclusive snapshots and the separately preregistered 32 random legal positions, retaining every attempted position. Cap each snapshot at 20,000 generated transitions or 200 ms; retain incomplete snapshots without interpreting them as negative findings. Identify attacked, geometrically defended nonking pieces; simulate each legal enemy capture and compare resulting legal recaptures on that square. Preserve actual capture-bank ownership, occupied squares and terminal/king-safety policy. Report cases where geometric defense has no legal recapture, separately from captures that are themselves illegal and malformed/terminal positions. Retain exact positions, actions, source hashes and bounded diagnostics. Do not interpret geometric attack as a legal capture, alter coefficients, add pruning, or claim strength from this count.

A candidate requires a concrete reproducible mechanism plus a bounded cost check and default-preserving correctness coverage. If the discrepancy is absent or lacks a plausible decision effect, stop rather than manufacturing a heuristic combination. Any strength screen still requires the unchanged opponent, settings, full schedule and independent archive verification; timing or self-reference agreement alone does not justify it.

## Evidence index

- `js-quiescence-cache-ablation.json.gz`, `js-quiescence-hints-diagnostic.json.gz`
- `js-lazy-evaluation-diagnostic.json.gz`
- `js-history-alias.json.gz`, `js-typed-history-ablation.json.gz`
- `js-cutoff-ranks.json.gz`, `js-cutoff-costs.json.gz`
- `js-root-tie-cost.json.gz`
- `js-broad-tactical-corpus.json.gz`, `js-random-tactics.json.gz`

These are retained diagnostics, not pooled match results or an Elo estimate. No new experiment or engine change accompanies this decision note.
