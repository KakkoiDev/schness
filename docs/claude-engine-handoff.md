# Claude AI handoff — Schness competitive JavaScript engine

Prepared 2026-11-07 (Asia/Tokyo). This document transfers context; it does not authorize promotion or restart any closed work.

## Start here

Workspace: /Users/kakkoidev/Documents/ChatGPT/Schness  
Repository: https://github.com/KakkoiDev/schness  
Draft research PR: https://github.com/KakkoiDev/schness/pull/123  
Research branch: codex/competitive-engine-2026-10-26  
Latest remote head verified during handoff preparation: b55c06fe6133d1e056a2f691117262efe912f86f.

The goal remains at least 98 raw wins in 192 fresh games against the pinned Fairy reference under the unchanged 100 ms benchmark. That goal is **unmet**. No candidate is approved for promotion. Rust is paused.

The scheduled heartbeat still cites a2bf5f7fba25d712b6f241a9318d0b076136f562. That is an older checkpoint. The intervening commits are:
- 004eb5f28d90fa0f026f3f7092f6a7435e023fdf: final-continuation allocation evidence.
- b55c06fe6133d1e056a2f691117262efe912f86f: correction identifying that probe as a repeat of an already closed mechanism.

Recheck the remote branch head before any write. Local DEVLOG is stale relative to the remote research branch. Local Git status contains substantial existing modified and untracked research/UI work; do not reset, clean, overwrite, or infer that it is disposable. Local .git is read-only. Do not checkout, commit, fetch, stage or mutate local Git metadata.

## Mandatory reading before editing or proposing a probe

Read the complete files, not just the recent tail:
1. CLAUDE.md and DECISIONS.md.
2. Local DEVLOG.md **and the latest remote DEVLOG.md** on PR #123's actual head.
3. research/competitive-engine-v1/README.md.
4. src/search.js and src/bot.js.
5. scripts/engine-contract.js and docs/engine-behavior-contract.md.
6. The relevant prior plans, reports, archived source and stopped hypotheses.

Pinned remote log at handoff:
https://github.com/KakkoiDev/schness/blob/b55c06fe6133d1e056a2f691117262efe912f86f/DEVLOG.md

A prior agent missed a November 4 entry while reviewing only recent portions of the remote log and repeated the same continuation allocation mechanism on November 6. The correction is published. A fresh position set does not make an old mechanism distinct. Check semantic overlap with the full research history before preregistration.

## Preserve these invariants

Preserve all 36 variants, rule semantics, histories/repetition, restoration, cache contracts, independent exact oracles and all 19 mate fixtures. Keep production defaults and the competitive benchmark unchanged. Preserve unrelated UI work.

If touching service-worker SHELL assets, bump CACHE in sw.js. Include any new runtime module in SHELL, DECISIONS' module inventory, and every frozen runtime. Keep DECISIONS current when changing an invariant or architecture. Never rewrite old frozen research runtimes.

## Closed work — do not tune, rerun, extend or match

| Mechanism | Recorded outcome |
|---|---|
| Deployment history copy-on-write | Exact parity; 4.59% fixed-depth saving below 5%; 100 ms mean depth 6.453125 control / 6.5 candidate. 42 archive files, 2,044 successors, 32 paths, 256 queries verified. |
| Split occupancy slider visibility | Exact parity; 4.23% saving below 5%; mean depth 6.296875 both arms. 48 archive files, 32 paths, 256 queries verified. |
| Reserve duplicates | Seven informative equal-material pairs over five games: Fairy preferred fewer duplicates in four, more in three. 321 disagreement records verified. Do not alter exclusions or fit weights. |
| Knight bitset mobility count | 12.3% slower at fixed depth despite exact count/search parity; 34 archive files, 4,382 count comparisons, 256 timing queries. Do not extend to other pieces. |
| Ordered child mask reuse | 0.25% slower fixed depth; 100 ms depth 6.125 control / 6.078 candidate. 36 files, 177 preflight pairs, 256 queries. |
| Interior ordering headroom | 32 paired roots identical; 30 samples, 19 stable labels, only two ranked fourth or later. Do not train an interior ranker or extend audit. |
| Interrupted-pass shadow rule | 60 changes across 16 games; 22 gained / 16 lost Fairy matches, below preset 2:1 gate. |
| Continuation allocation, November 4 | Best score/action/child link held in locals, materialize at return; 3.9% slower, failed original 3% saving gate. Closed. |
| Final continuation allocation, November 6 | Same mechanism repeated in error; exact parity, 4.05% saving below 5%; 100 ms depth 6.734375 control / 6.75 candidate. 42 archive files, 32 paths, 256 queries verified. Do not pool with November 4. |
| First legal action terminal prototype | Exact parity; 1.08% slower, failed 5% saving gate; both mean depth 6.3125. Closed. |

The remote log contains further closed families, including normal-cache bound retention, static evaluation reflection reuse, quiet immediate threefolds, positional subtotal caching, concentrated interior mate extrema, same-visit check reuse, and previous-action quiet cutoff replies. This table is not an exhaustive permission list.

Avoid the already investigated families: normal hint depth, three-piece, compulsory Q, root priority, Q cache hints, history key, category, direct legal defense, lazy bounds, and four-term evaluation ridge. The ridge failed its preregistered gate; do not refit or retune it.

## Existing Fairy evidence

Fairy self-play archive checkpoint: 376251525083b99d8b14dc1f34f4da6748650c5c.
Sixteen pinned Fairy-versus-Fairy games were completed before replaying all 964 decisions with unchanged 100 ms JS and clock-free depth-6 / 262144-node full-root research replay: 85,234 completed root branches.

Timed agreement: 643/964 overall and 170/355 on Fairy drops. Among 185 drop disagreements, deeper Schness preferred Fairy in 43, JS in 130, tied in 12. These finite-horizon choices are evidence, not truth or strength.

Local diagnostic: output/local-experiments/fairy-selfplay-2026-11-06/drop-diagnostic.

## Immutable competitive protocol

- Shared quiet six-slot capture-bank only.
- Fairy 1.1.12, pinned b2e693ef; 100 ms per decision, one thread, 16 MiB hash, NNUE off; full UCI history and legal parity at every position; host 200; preserve GPL sources/licenses.
- Screen exactly 32 games: 16 identical starts in both colors, seed 20262001.
- JS requested depth 20; iterative deepening; quiescence depth 4 with checks; evasion depth 2; LMR on; quiet-drop reductions off; evaluation cache on; quiescence cache off; reducePrincipalVariation on.
- Other optional flags off except the one isolated candidate. Preserve frozen settings including stopOnProvenWin, repetitionAversion, table limits and the runner's exact baseline settings.
- Pair against preceding JS and original baseline. Report per-color W/L/D, raw wins separately from half-draw score, termination reasons, actual milliseconds and completed depth.
- Require 17/32 raw wins before 192 **fresh** games on seeds 20261901 through 20261906, using the exact frozen candidate.
- No weaker opponent, increased budget, version pooling, draws counted as wins, favorable partial stopping, unbounded probes, automatic merge or promotion.

The latest allocation-probe control settings are retained in:
output/local-experiments/js-final-continuation-link-2026-11-06/timed-settings.json.
That experiment's candidate is rejected; use its control only as a documented frozen reference, after verifying against the intended current baseline.

## Run and publication discipline

Before any new probe, write a distinct falsifiable mechanism, exact bounded input-generation procedure, correctness requirements, quantitative gates and failure stop rule. Prefer fresh evidence to selected prior reversals. There is no currently preregistered next candidate.

Use persistent runners; finish the complete preset run, mark inactive, verify frozen sources and all replays, then report and pair. Do not restart stopped probes or completed screens. The last continuation runner is inactive: completed. No new match was launched.

Archive source/runtime, settings, inputs, complete raw records, bundles/readables/logs, hashes and GPL material as applicable. Publish using GitHub Git Data with the current expected-head lease, base tree and non-force branch update; append to the latest remote DEVLOG rather than replacing it with the stale local copy. Preserve unrelated tree entries. Independently verify each part, whole file bytes, archive members, source hashes, replay legality and game/query counts. A local-only result is not a verified publication.

Existing publication scripts under /tmp may help explain the procedure but contain hard-coded paths and old expected heads. Never execute them unchanged:
- /tmp/schness-publish-final-continuation.py
- /tmp/schness-correct-continuation-log.py

Latest probe local evidence:
output/local-experiments/js-final-continuation-link-2026-11-06/
Includes PLAN.md, frozen control/candidate, portable fixtures, SOURCE-SHA256SUMS, run/verify scripts, full timing.jsonl, summary.json, logs and report.md.

Remote archive:
research/competitive-engine-v1/js-final-continuation-link.tar.gz
SHA-256: bcf88d22ac6e96692ffaf81ca4a2d7608fe0ea9b355eeb8c749858e8eeac1973.
Published at 004eb5f28d90fa0f026f3f7092f6a7435e023fdf; 131,706 bytes, all 42 members verified, 32 paths / 256 queries / zero games.

## First useful action for Claude

Confirm current remote head and read the full latest remote DEVLOG. Build a list of already closed mechanisms before selecting a genuinely distinct question. Do not resume or combine the rejected candidates. Keep the 100 ms benchmark and unmet strength gate explicit.

This handoff is included in the pending workspace publication on PR #123. The checkpoint above describes the research state before this documentation/UI publication. No new engine experiment was run. See the latest remote DEVLOG for the publication commit and validation results.
