# Fairy-Stockfish self-play and Schness replay

Fairy played both sides in all 16 king layouts before Schness analysis began. The recorded games contain 964 engine decisions; fixed king placements are excluded. Results: 5 white, 9 black, 2 threefold-repetition.

Schness agreed at 100 ms on 643/964 moves (66.7%). The deeper replay had no clock cap, reached depth six on 807/964, and retained 85,234 finished root branches across all depths. Root rankings use the last fully completed depth for each position, never the partial final iteration.

On disagreements, the deeper Schness search preferred the Fairy move over the 100 ms Schness move in 65 cases, the Schness move in 227, and gave the same score in 29. These are within-engine scores at a finite horizon, not objective move-quality labels.

| Position or move group | Moves | Same at 100 ms | Fairy top 3 in deeper Schness | Fairy strictly preferred | Schness strictly preferred |
|---|---:|---:|---:|---:|---:|
| all | 964 | 643 | 888 | 65 | 227 |
| first 12 decisions | 192 | 107 | 163 | 18 | 66 |
| Fairy drop | 355 | 170 | 302 | 43 | 130 |
| not in check | 822 | 520 | 747 | 60 | 217 |
| white | 485 | 325 | 449 | 31 | 115 |
| black | 479 | 318 | 439 | 34 | 112 |
| Fairy quiet move | 308 | 211 | 292 | 17 | 65 |
| Fairy capture | 301 | 262 | 294 | 5 | 32 |
| decisions 13–32 | 306 | 215 | 286 | 15 | 73 |
| in check | 142 | 123 | 141 | 5 | 10 |
| decision 33 onward | 466 | 321 | 439 | 32 | 88 |

### Examples with the largest score differences

At most one example per game per direction. Mate-band and ordinary scores are kept raw and are not comparable in magnitude.

favorsFairy:
- fairy__8, decision 58, black: Fairy knight@c4; Schness knight@d1. At depth 6, Schness scored them 1000000 and 1844.
- fairy__7, decision 42, black: Fairy rook@a1; Schness bishop@b3. At depth 5, Schness scored them 2486 and 1868.
- fairy__4, decision 70, black: Fairy rook@b4; Schness rook@d1. At depth 6, Schness scored them 1718 and 1295.
- fairy__3, decision 27, white: Fairy rook@b2; Schness d4–b2. At depth 6, Schness scored them -1044 and -1416.

favorsSchness:
- fairy__1, decision 139, white: Fairy c4–d2; Schness a1–a2. At depth 6, Schness scored them 1818 and 1000000.
- fairy__8, decision 56, black: Fairy a1–c2; Schness bishop@a3. At depth 5, Schness scored them 1834 and 1000000.
- fairy__15, decision 43, white: Fairy knight@a3; Schness knight@a1. At depth 6, Schness scored them -1000000 and -1902.
- fairy__13, decision 29, white: Fairy c3–c2; Schness a4–a3. At depth 6, Schness scored them 2476 and 1000000.

This is a decision comparison, not a head-to-head match or a training run. The 16 games share a ruleset and opening family; adjacent positions are correlated. For any future learning experiment, split by entire game or layout and reserve fresh games for validation. The raw paired data preserve move class, score, search depth, nodes, and continuations.
