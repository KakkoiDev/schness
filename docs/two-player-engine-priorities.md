# Two-player engine priorities

Scope: deterministic, perfect-information, two-player games. Keep the game adapter reusable,
but defer multiplayer search, chance, hidden information and simultaneous turns.

The goal is stronger decisions within a practical browser budget, with correct variant rules
and honest reporting of completed depth. Requested depth alone is not a strength measurement.

## Acceptance gates

1. Correctness: preserve exhaustive small-game oracles, legal continuations, terminal scores,
   repetition rights, budget limits and exact make/unmake restoration. Compare exact search
   changes with the frozen reference on saved positions and every production preset.
2. Tactical quality: expand a versioned corpus of forced mates, sole legal escapes, poisoned
   captures, bank tactics, checking-drop restrictions and objective wins. Verify known answers
   with sufficiently complete search or independently checked lines. Deeper search can still
   miss a tactic if generation, terminal handling or evaluation is wrong.
3. Performance: compare warmed saved workloads on the same machine, with source fingerprints,
   equal depth for work cost and equal time for useful search. Include actual browser workers.
4. Strength: use paired starts and swapped colors against a frozen engine. Report wins, losses,
   draws, draw causes, budgets and sample limits. Separate variant and engine versions. A small
   draw-heavy match cannot establish an Elo gain or absence of regressions.

## Next improvement order

- Build out the tactical corpus before changing evaluation or introducing selective pruning.
- Profile remaining hot paths; optimize only when savings survive the correctness gates.
- Compare tactical leaf extensions / quiescence with the default engine under equal time.
  Search forcing continuations only with appropriate safeguards for drops and variant objectives.
- Improve variant-aware evaluation, including king safety and reserve threats, one change at a
  time. Validate strength rather than tuning to a few benchmark positions.
- Consider late-move reductions only as an optional experiment, with full-depth verification
  when a reduced move improves the bound. Keep an exact reference mode.
- Consider learned evaluation only after collecting a clean, versioned training and held-out
  evaluation dataset. Do not assume Stockfish weights or chess-specific pruning transfer.

No multiplayer implementation, evaluator retuning or speculative pruning is introduced by
this scope decision. The current performance round preserves the existing evaluator.

## Progress on 25 October 2026

Round five adds 15 terminal-only exhaustive mate fixtures across five rule recipes,
an additional 5,000-board legality comparison, a checking-extension oracle, and explicit
reduction-risk/re-search tests. Exact default play uses proved non-king legality and
stack-reused masks. Checking extensions, reductions and a king-escape evaluation bonus were
screened separately; small match results do not justify promoting them to defaults.

Evaluation tuning still needs broader paired testing and held-out positions. NNUE training,
null-move pruning, SEE-based pruning and parallel search are not automatically warranted by
these screens. Future work should proceed through the same gates, rather than enabling a
collection of unvalidated heuristics together. See the round-five report for results.
