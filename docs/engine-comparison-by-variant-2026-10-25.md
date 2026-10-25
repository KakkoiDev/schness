# Engine results and thinking time by variant

Each row contains **96 games**. Wins are shown for each engine; the other engine lost those games. Both searched depth four. Thinking time is the **mean milliseconds per AI decision**, excluding automatic king/private placements. Eight games ran in parallel, and engines reached different positions, so these are observed game timings rather than an isolated speed benchmark.

## New engine White vs Sharp v2 Black

| Variant | New wins | v2 wins | Draws | New ms/move | v2 ms/move |
|---|---:|---:|---:|---:|---:|
| Classic | 5 | 1 | 90 | 12.7 | 145.5 |
| permanent-loss-quiet | 6 | 0 | 90 | 5.9 | 49.5 |
| permanent-loss-checking | 72 | 13 | 11 | 19.3 | 30.1 |
| capture-bank-3-quiet | 43 | 25 | 28 | 18.7 | 230.8 |
| capture-bank-3-checking | 88 | 8 | 0 | 43.6 | 73.5 |
| capture-bank-4-quiet | 61 | 22 | 13 | 17.8 | 223.4 |
| capture-bank-4-checking | 71 | 9 | 16 | 31.5 | 59.7 |
| capture-bank-5-quiet | 61 | 22 | 13 | 18.0 | 226.0 |
| capture-bank-5-checking | 71 | 12 | 13 | 31.5 | 61.5 |
| capture-bank-6-quiet | 61 | 22 | 13 | 17.7 | 221.2 |
| capture-bank-6-checking | 71 | 12 | 13 | 31.2 | 66.4 |
| home-half-check | 36 | 1 | 59 | 17.3 | 114.8 |
| distant-check | 11 | 34 | 51 | 14.6 | 153.0 |
| supported-check | 82 | 6 | 8 | 25.7 | 127.1 |
| countercheck-only | 3 | 6 | 87 | 16.3 | 186.0 |
| knight-check | 10 | 12 | 74 | 16.3 | 141.1 |
| bishop-check | 11 | 13 | 72 | 17.9 | 144.1 |
| rook-check | 46 | 0 | 50 | 30.1 | 191.7 |
| Unrestricted checking drops | 91 | 5 | 0 | 30.8 | 58.6 |
| protected-recurring | 24 | 40 | 32 | 18.5 | 480.8 |
| protected-opening | 13 | 50 | 33 | 16.3 | 425.5 |
| first-turn-quiet | 60 | 18 | 18 | 21.5 | 163.0 |
| protected-first-turn | 38 | 20 | 38 | 25.3 | 223.9 |
| mutual-one | 57 | 16 | 23 | 22.3 | 171.4 |
| mutual-two | 28 | 26 | 42 | 25.8 | 281.7 |
| limited-check | 8 | 10 | 78 | 14.9 | 136.0 |
| cooldown | 36 | 14 | 46 | 19.4 | 176.2 |
| no-drop-mate | 81 | 8 | 7 | 155.8 | 292.6 |
| grace | 43 | 12 | 41 | 21.6 | 200.9 |
| quiet-return | 7 | 20 | 69 | 17.5 | 185.8 |
| setup-white-quiet | 14 | 5 | 77 | 8.6 | 78.8 |
| setup-white-checking | 27 | 15 | 54 | 11.0 | 66.5 |
| setup-black-quiet | 7 | 20 | 69 | 8.9 | 81.5 |
| setup-black-checking | 16 | 39 | 41 | 10.9 | 78.8 |
| hidden-quiet | 13 | 3 | 80 | 7.2 | 75.6 |
| hidden-checking | 37 | 9 | 50 | 9.0 | 53.1 |

## Sharp v2 White vs new engine Black

| Variant | New wins | v2 wins | Draws | New ms/move | v2 ms/move |
|---|---:|---:|---:|---:|---:|
| Classic | 2 | 8 | 86 | 8.7 | 193.5 |
| permanent-loss-quiet | 2 | 2 | 92 | 4.1 | 90.4 |
| permanent-loss-checking | 13 | 73 | 10 | 4.5 | 394.9 |
| capture-bank-3-quiet | 28 | 46 | 22 | 15.8 | 289.2 |
| capture-bank-3-checking | 9 | 87 | 0 | 9.9 | 712.9 |
| capture-bank-4-quiet | 32 | 56 | 8 | 14.6 | 280.0 |
| capture-bank-4-checking | 9 | 74 | 13 | 8.9 | 668.3 |
| capture-bank-5-quiet | 33 | 55 | 8 | 14.8 | 283.0 |
| capture-bank-5-checking | 9 | 74 | 13 | 9.0 | 670.1 |
| capture-bank-6-quiet | 33 | 55 | 8 | 14.8 | 283.7 |
| capture-bank-6-checking | 10 | 74 | 12 | 8.8 | 670.0 |
| home-half-check | 3 | 37 | 56 | 9.4 | 397.1 |
| distant-check | 32 | 10 | 54 | 10.7 | 333.4 |
| supported-check | 0 | 90 | 6 | 9.0 | 705.2 |
| countercheck-only | 0 | 5 | 91 | 11.3 | 263.5 |
| knight-check | 16 | 5 | 75 | 10.8 | 336.1 |
| bishop-check | 18 | 7 | 71 | 11.5 | 318.7 |
| rook-check | 1 | 37 | 58 | 16.3 | 749.1 |
| Unrestricted checking drops | 6 | 87 | 3 | 7.0 | 580.9 |
| protected-recurring | 40 | 24 | 32 | 29.1 | 375.0 |
| protected-opening | 49 | 14 | 33 | 26.9 | 299.0 |
| first-turn-quiet | 17 | 56 | 23 | 13.0 | 433.8 |
| protected-first-turn | 27 | 40 | 29 | 13.6 | 564.1 |
| mutual-one | 22 | 56 | 18 | 13.7 | 480.1 |
| mutual-two | 24 | 23 | 49 | 16.1 | 470.8 |
| limited-check | 8 | 11 | 77 | 10.3 | 293.0 |
| cooldown | 18 | 37 | 41 | 13.1 | 358.4 |
| no-drop-mate | 9 | 77 | 10 | 35.3 | 2335.0 |
| grace | 16 | 36 | 44 | 15.8 | 433.5 |
| quiet-return | 24 | 6 | 66 | 14.3 | 328.3 |
| setup-white-quiet | 7 | 5 | 84 | 7.7 | 100.7 |
| setup-white-checking | 24 | 19 | 53 | 8.4 | 106.3 |
| setup-black-quiet | 29 | 6 | 61 | 8.0 | 103.1 |
| setup-black-checking | 54 | 16 | 26 | 9.3 | 115.5 |
| hidden-quiet | 6 | 14 | 76 | 6.7 | 79.6 |
| hidden-checking | 6 | 35 | 55 | 6.1 | 87.2 |
