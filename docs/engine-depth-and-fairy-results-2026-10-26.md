# Completed v7 depth and Fairy-Stockfish comparisons — 26 October 2026

All three authorized schedules completed. Their frozen runtimes, manifests and complete replay bundles were verified and archived separately. No production defaults changed.

## Against frozen Sharp v2 depth four

Each schedule contains 6,912 games across 36 shared presets: six reused seeds, 16 starts and both fixed candidate colors. Score counts a draw as half a point; win rate counts wins over all games.

| v7 depth | v7 color | Games | v7 wins | v2 wins | Draws | v7 win rate | v7 score | v7 mean ms/move | v2 mean ms/move |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 5 | White | 3456 | 2574 | 241 | 641 | 74.5% | 83.8% | 78.45 | 159.81 |
| 5 | Black | 3456 | 1824 | 982 | 650 | 52.8% | 62.2% | 55.48 | 262.27 |
| 6 | White | 3456 | 2371 | 60 | 1025 | 68.6% | 83.4% | 1176.40 | 151.97 |
| 6 | Black | 3456 | 1426 | 745 | 1285 | 41.3% | 59.9% | 348.32 | 297.31 |

Depth five has the better observed aggregate score against this opponent in these separate schedules and costs less observed time. Depth six has fewer losses but more draws. This is not a direct depth-five versus depth-six match or proof of relative strength. Depth means individual actions. Fixed-depth searches have no time/node cap, quiescence or reductions. Timings include changing parallel contention and different evolving positions; they are not a controlled speed ratio or an equal-time match.

- [Depth-five per-variant/color results and draw reasons](../research/data/sharp-v7-d5-v2-full-v1-2026-10-26/results.md)
- [Depth-five full archive](../research/data/sharp-v7-d5-v2-full-v1-2026-10-26/archive.json)
- [Depth-six per-variant/color results and draw reasons](../research/data/sharp-v7-d6-v2-full-v1-2026-10-26/results.md)
- [Depth-six full archive](../research/data/sharp-v7-d6-v2-full-v1-2026-10-26/archive.json)

## Equal requested time against Fairy-Stockfish

192 serial browser games, 100 ms per move requested for each engine. Shared rules only: 4×4, six-slot capture bank, captures change ownership, quiet drops, no cooldown. This is not Classic. Fairy b2e693ef uses one thread, 16 MiB hash and no NNUE. v7 uses time-limited iterative deepening requesting depth 100; this is not a fixed depth-five or six match.

| v7 color | Games | v7 wins | Fairy wins | Draws | v7 win rate / score | v7 mean ms/move | Fairy mean ms/move |
|---|---:|---:|---:|---:|---:|---:|---:|
| White | 96 | 0 | 96 | 0 | 0% / 0% | 99.52 | 87.41 |
| Black | 96 | 0 | 96 | 0 | 0% / 0% | 99.52 | 84.69 |

Fairy won all 192 games by checkmate. Mean game length was 32.76 total actions, including the two automatic king placements (range 17–69). Its lower mean time is not a standalone throughput measurement; engines can return before their full budget. Pooled per-decision medians were v7 99.49 ms and Fairy 101.84 ms.

Fairy is clearly stronger in this tested setting. The result does not establish its performance on Classic or unsupported variants. All played positions passed root legal-move parity checks during play; completed frozen-source and replay validation passed. This finite adapter validation is not a universal rules-equivalence proof. Full UCI output is retained in replays. Selective search depths are not equivalent exhaustive horizons.

- [Fairy match report](../research/data/sharp-v7-fairy-equal-time-v1-2026-10-26/report.md)
- [Fairy timing and outcome summary](../research/data/sharp-v7-fairy-equal-time-v1-2026-10-26/summary.json)
- [Fairy full archive](../research/data/sharp-v7-fairy-equal-time-v1-2026-10-26/archive.json)

## Interpretation limits

Six seeds repeat 16 starts. Fairy does not have a seeded tie stream; repeated starts and time-based variation do not create independent samples. No Elo or independent-game confidence interval is claimed. Mixed-engine aggregates do not measure intrinsic variant color balance. Ceiling draws in the depth schedules are artificial. Keep these datasets separate from the earlier depth-four, custom-army and research-adapter experiments. Further tournaments, tuning and production changes require separate authorization.
