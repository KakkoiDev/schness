# Preregistration — Compact board-and-reserve value model from fresh Fairy outcome labels

Status: **preregistered** by publication of this file on `codex/competitive-engine-2026-10-26`, before any data generation, query, fit or run.
- Base: remote head `146f8ffa78a7e7dbdd3c94ac781047cbcf0ebb3f`; `src/bot.js` and `src/search.js` identical to it.
- Strength goal remains unmet (≥98/192 raw wins against pinned Fairy at 100 ms). No candidate is approved for promotion. Rust remains paused.
- Publishing this plan authorizes no run by itself; each stage starts only on the user's go-ahead.

## 1. Question and falsifiable mechanism

**Mechanism.** The competitive static evaluator is a fixed hand-written sum (`src/bot.js:139–186`):
- material, with a +20 bonus for deployed pieces;
- mobility ×2;
- check ±30;
- a positional term: king safe squares ×14 and pressure ×20, centre +6/+6, defended +12, exposure 12%/45%.

It has no square-specific piece values. It values a reserve piece only through material and mobility, and there is no interaction between where a reserve piece could land and the position.

The Fairy self-play replay found that Schness and Fairy disagree most on drops: 170/355 agreement on drops, against 262/301 on captures (DEVLOG L2050).

**Hypothesis.** A small, cheap learned correction can make the evaluator predict real game outcomes better on unseen games. It would add piece-square values, reserve composition, and their side-to-move context on top of the current evaluator. If it does, Schness's 100 ms decisions should move toward Fairy's on unseen positions without losing search depth.

**Falsified if** any gate in §6 fails. Each failure stops this family, with no retuning.

## 2. Why this is not a closed family (overlap check against the full DEVLOG)

| Closed item | Difference |
|---|---|
| Four-term ridge (L1967–1973) | **Different target:** game outcomes, not Fairy centipawn scores. **Different features:** piece-square and reserve features, not 4 term multipliers. **Fresh data:** about 1,000 new games, not the 64 archived snapshots. The existing terms enter only as one fixed input (§4), so this is not a refit of their multipliers. |
| Reserve-pressure evaluation (L1597–1601) | No hand-written deployment, check or king-ring features. Reserve inputs are counts by piece type only (§4). |
| Reserve duplicates (L2082) | No archived 964-decision data is used. There is no duplicate-specific feature; it can only be learned implicitly through counts. |
| King-escape geometry; legal-defence exposure; coefficient tuning (L1702–1716, L1819–1844, L1633/1641) | The existing positional term is left untouched; nothing in it is recomputed or reweighted. |
| Interior ordering ranker (L2067) | This is a value model only. Move ordering and reductions are unchanged, apart from score effects. |
| Interrupted-pass shadow rule (L2062) | Not a root decision rule and not trained on the archived self-play. |

Rows not listed (efficiency, caches, quiescence, reductions, root policy) have no mechanism in common with this plan.

## 3. Data generation (one frozen run, no replacements)

- **Rules and opponent:** the benchmark settings. Shared quiet six-slot capture bank. Pinned Fairy 1.1.12 `b2e693ef`, 100 ms per decision, one thread, 16 MiB hash, NNUE off, a fresh hash for every move, full UCI history and legal-move parity at every position, a 200-ply host limit. GPL sources are archived.
- **Starts:** the 16 standard king layouts, with White's king on squares 12–15 and Black's on 0–3, in the same order as `run-competitive-fairy.js`.
  - For each layout, use prefix seeds **20265001–20265064** (64 per layout, 1,024 games). These seeds have never been used.
  - Each seed's prefix length is fixed by schedule: k = 4, 6, 8, 10 or 12 uniform random legal plies after king placement, cycling through those values by seed index.
  - The random prefix gives positional variety. Without it, every game from a layout would follow Fairy's near-deterministic line.
- **Play:** Fairy plays both sides from the end of the prefix. The prefix moves are sent as UCI history.
- **No replacements:** a game that ends inside its prefix is recorded and excluded, not replaced.
- **Labels:** each position after the prefix is labelled with the final result from the side to move's point of view: win 1, draw 0.5, loss 0. Draw reasons are kept, and ply-limit draws are reported separately.
- **Harness:** a frozen copy of `scripts/run-fairy-selfplay-research.js` with a prefix option added. Source hashes are recorded before launch. It uses a persistent runner, and the run is resumed only if interrupted. After it finishes, it is marked inactive, then the frozen source and every replay are verified.
- **Estimated cost:** about 60 decisions × 0.1 s per game, roughly 2–3 hours serial. No parallel contention with other runs.
- **Leakage:**
  - Never read the archived screen, confirmation-gate or Fairy self-play games for training.
  - Report how many positions share a full position key with any archived screen game. Exclude those positions from validation and test.
  - The 192-game confirmation games do not exist yet and stay untouched.

## 4. Model (fixed before data)

Logistic regression on the side to move's outcome. All features are from the side to move's point of view, with the board flipped for Black.

- `e`: the current competitive static evaluation (`kingEscapeGeometry` and `reserveThreatEvaluation` off), divided by 500. This is one input with a learned coefficient `a`.
- **Piece-square terms:** an indicator for each of (rook, bishop, knight, king) × 16 squares × own/enemy, 128 features.
- **Reserve counts:** count of each type (R, B, N) × own/enemy, plus indicators for counts ≥2 and ≥3. Twelve features.
- **Turn context:** side-to-move-in-check and opponent-in-check indicators. Two features.
- Total: 143 weights, with no intercept because the features are relative to the side to move.

**Fitting**
- L2 penalty on every weight except `a`. λ is chosen from **{0.01, 0.1, 1}** on validation log-loss only, and no other value is tried.
- Each game carries total weight 1: each of its positions is weighted 1/n, so long games don't dominate.
- Use one deterministic solver (Newton/IRLS). Fail if the result is non-finite or does not converge in 50 iterations.

**Control model.** Logistic regression on `e` alone (just the coefficient `a₀`), fitted on the training split.

**Search integration** (a temporary prototype first):
- evaluation′ = evaluation + round(500 · (w·f) / a).
- This keeps the current scale and leaves mate and terminal scores alone.
- **Requires a > 0**; otherwise stop.
- Features are summed over at most 16 squares plus the reserves, with no legal-move generation.

## 5. Splits (fixed before data)

- **By game:** each whole game goes to exactly one split.
  - Seeds 20265001–20265038 are training (608 games).
  - Seeds 20265039–20265051 are validation (208 games).
  - Seeds 20265052–20265064 are test (208 games).
  - Every layout appears in every split.
- **Mirror-pair groups:** the 8 groups are layout pairs (w, b) ↔ (3−w, 3−b), using columns within each row. They are used only for heterogeneity checks.
- **The test split is read exactly once**, after λ is fixed.

## 6. Gates (each failure stops the family; no retuning, no reruns, no new data)

**G0 Data integrity**
- ≥95% of scheduled games complete past their prefix.
- Every replay is legal, with UCI parity at every position.
- ≤10% of games end in a ply-limit draw.

**G1 Offline signal (test split, read once)**
- Model log-loss is ≥3% lower in relative terms than the control's.
- It improves in at least 6 of the 8 mirror-pair groups.
- Training log-loss also improves on the control.

**G2 Correctness and cost (temporary prototype, default off)**
- Unchanged: 174 portable cases, all 19 independent mate fixtures with the option on, restoration, cancellation, and the default-off behaviour.
- Fixed-depth exactness is not expected, because the evaluation changes.
- Per-call static evaluation cost: ≤ +15% over control, measured ABBA (control and candidate alternated A-B-B-A).
- Mean completed depth at equal 100 ms: falls by ≤0.10 plies against control, on 64 test-split positions fixed by index before measurement.

**G3 Decision gate against Fairy (independent teacher), on positions Schness has never seen**
- **Positions:** 256 positions taken from test games by a fixed index rule: decisions 4, 12, 20, … from each game, up to the quota. No position may share a key with an archived screen game.
- **Method:** run the benchmark settings at 100 ms, candidate against control, ABBA.
- **Pass requires all three:**
  - Among decisions the candidate changes, those that gain Fairy's move outnumber those that lose it by **≥2:1**, matching the shadow-rule gate.
  - Net gain ≥ **+4 percentage points** (about 10 positions).
  - Improvement in ≥5 of 8 mirror-pair groups.

**G4 Screen** (only if G0–G3 all pass)
- Adopt as an optional evaluation, off by default. If it adds a new module (`src/value-model.js`), update `SHELL`, bump `CACHE` in `sw.js`, and add the module to DECISIONS' inventory and to every frozen runtime the screen uses.
- Weights are frozen as JSON with a recorded SHA-256.
- Run one isolated 32-game screen under the unchanged protocol: seed 20262001, both colours, every other optional flag at the benchmark baseline.
- **≥17/32 raw wins** unlocks the 192-game fresh confirmation on seeds 20261901–20261906 with the exact frozen candidate. That confirmation needs **≥98/192**.
- Report per colour W/L/D, raw wins separately from the half-draw score, termination reasons, actual milliseconds and completed depth. Compare against both the preceding JS screen and the original baseline.

## 7. Explicitly excluded

- Changes to features, models, λ, splits, prefixes or seeds after data generation begins.
- Pooling with the ridge or the archived self-play data.
- Fairy centipawn targets; converting mate scores to centipawns.
- Neural networks, policy heads, MCTS (search architecture is a later, separate question).
- Rust; a larger budget for Schness; a weaker opponent.
- Partial-run stopping; automatic merge or promotion.

## 8. Archiving and publication per stage

- Archive per stage: frozen sources and runtimes, harness, settings, prefix transcripts, all games/UCI/GPL material, features, fitted weights, every metric record, logs, SHA-256 sums.
- Publish via GitHub Git Data with a head lease. Append to the latest remote DEVLOG and update DECISIONS where an invariant or module changes.
- Each stage's result is published before the next stage starts.

## Fixed choices

- Dataset size: 1,024 games (seeds 20265001–20265064 per layout).
- Prefix lengths: 4, 6, 8, 10, 12 random legal plies, cycling by seed index.
- Gate thresholds exactly as written in §6.
