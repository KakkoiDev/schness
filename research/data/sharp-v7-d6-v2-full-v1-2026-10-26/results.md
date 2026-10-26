# Depth-six results by variant and engine color

6912 games, complete; frozen runtime and replays verified. Aggregate rows mix variants and are descriptive only. Score counts each draw as half a point. Timings are observed wall time under parallel load, not an isolated benchmark. Six reused seeds repeat 16 starts; no independent-game confidence or proven noninferiority claim.

| Variant | v7 color | Games | v7 wins | v2 wins | Draws | v7 win rate | v7 score | v7 ms/move | v2 ms/move | Draw reasons |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| All 36 (descriptive) | white | 3456 | 2371 | 60 | 1025 | 68.6% | 83.4% | 1176.40 | 151.97 | threefold-repetition: 991, ply-limit: 28, stalemate: 6 |
| All 36 (descriptive) | black | 3456 | 1426 | 745 | 1285 | 41.3% | 59.9% | 348.32 | 297.31 | threefold-repetition: 1255, ply-limit: 23, stalemate: 7 |
| canonical | white | 96 | 32 | 0 | 64 | 33.3% | 66.7% | 1259.66 | 145.61 | threefold-repetition: 63, ply-limit: 1 |
| canonical | black | 96 | 41 | 0 | 55 | 42.7% | 71.4% | 533.11 | 192.03 | threefold-repetition: 54, ply-limit: 1 |
| permanent-loss-quiet | white | 96 | 28 | 0 | 68 | 29.2% | 64.6% | 366.19 | 42.96 | threefold-repetition: 44, ply-limit: 18, stalemate: 6 |
| permanent-loss-quiet | black | 96 | 10 | 2 | 84 | 10.4% | 54.2% | 132.81 | 83.99 | threefold-repetition: 71, stalemate: 7, ply-limit: 6 |
| permanent-loss-checking | white | 96 | 88 | 0 | 8 | 91.7% | 95.8% | 1204.69 | 39.06 | threefold-repetition: 8 |
| permanent-loss-checking | black | 96 | 22 | 51 | 23 | 22.9% | 34.9% | 24.43 | 151.87 | ply-limit: 13, threefold-repetition: 10 |
| capture-bank-3-quiet | white | 96 | 73 | 11 | 12 | 76.0% | 82.3% | 1362.15 | 215.58 | threefold-repetition: 12 |
| capture-bank-3-quiet | black | 96 | 59 | 23 | 14 | 61.5% | 68.8% | 457.67 | 241.68 | threefold-repetition: 14 |
| capture-bank-3-checking | white | 96 | 96 | 0 | 0 | 100.0% | 100.0% | 3687.25 | 81.80 | — |
| capture-bank-3-checking | black | 96 | 17 | 77 | 2 | 17.7% | 18.8% | 123.05 | 395.66 | threefold-repetition: 2 |
| capture-bank-4-quiet | white | 96 | 71 | 4 | 21 | 74.0% | 84.9% | 1206.28 | 246.19 | threefold-repetition: 21 |
| capture-bank-4-quiet | black | 96 | 50 | 23 | 23 | 52.1% | 64.1% | 327.99 | 211.42 | threefold-repetition: 23 |
| capture-bank-4-checking | white | 96 | 87 | 0 | 9 | 90.6% | 95.3% | 1502.61 | 46.90 | threefold-repetition: 9 |
| capture-bank-4-checking | black | 96 | 11 | 62 | 23 | 11.5% | 23.4% | 98.78 | 451.37 | threefold-repetition: 23 |
| capture-bank-5-quiet | white | 96 | 70 | 12 | 14 | 72.9% | 80.2% | 1076.55 | 245.51 | threefold-repetition: 14 |
| capture-bank-5-quiet | black | 96 | 50 | 23 | 23 | 52.1% | 64.1% | 328.50 | 211.12 | threefold-repetition: 23 |
| capture-bank-5-checking | white | 96 | 87 | 0 | 9 | 90.6% | 95.3% | 1454.99 | 46.81 | threefold-repetition: 9 |
| capture-bank-5-checking | black | 96 | 17 | 62 | 17 | 17.7% | 26.6% | 124.68 | 441.30 | threefold-repetition: 17 |
| capture-bank-6-quiet | white | 96 | 70 | 12 | 14 | 72.9% | 80.2% | 1073.16 | 245.22 | threefold-repetition: 14 |
| capture-bank-6-quiet | black | 96 | 50 | 23 | 23 | 52.1% | 64.1% | 327.70 | 209.99 | threefold-repetition: 23 |
| capture-bank-6-checking | white | 96 | 87 | 0 | 9 | 90.6% | 95.3% | 1450.80 | 46.34 | threefold-repetition: 9 |
| capture-bank-6-checking | black | 96 | 18 | 62 | 16 | 18.8% | 27.1% | 132.34 | 449.62 | threefold-repetition: 16 |
| home-half-check | white | 96 | 77 | 0 | 19 | 80.2% | 90.1% | 812.16 | 106.21 | threefold-repetition: 19 |
| home-half-check | black | 96 | 15 | 10 | 71 | 15.6% | 52.6% | 173.38 | 331.45 | threefold-repetition: 71 |
| distant-check | white | 96 | 94 | 0 | 2 | 97.9% | 99.0% | 715.32 | 83.40 | threefold-repetition: 2 |
| distant-check | black | 96 | 54 | 0 | 42 | 56.2% | 78.1% | 192.90 | 306.17 | threefold-repetition: 42 |
| supported-check | white | 96 | 96 | 0 | 0 | 100.0% | 100.0% | 1089.50 | 100.43 | — |
| supported-check | black | 96 | 4 | 74 | 18 | 4.2% | 13.5% | 115.25 | 535.84 | threefold-repetition: 18 |
| countercheck-only | white | 96 | 29 | 0 | 67 | 30.2% | 65.1% | 1612.98 | 209.25 | threefold-repetition: 67 |
| countercheck-only | black | 96 | 28 | 0 | 68 | 29.2% | 64.6% | 612.45 | 248.36 | threefold-repetition: 68 |
| knight-check | white | 96 | 26 | 0 | 70 | 27.1% | 63.5% | 1025.46 | 166.75 | threefold-repetition: 69, ply-limit: 1 |
| knight-check | black | 96 | 28 | 1 | 67 | 29.2% | 64.1% | 234.33 | 265.06 | threefold-repetition: 67 |
| bishop-check | white | 96 | 37 | 0 | 59 | 38.5% | 69.3% | 990.25 | 139.74 | threefold-repetition: 58, ply-limit: 1 |
| bishop-check | black | 96 | 21 | 0 | 75 | 21.9% | 60.9% | 368.98 | 249.56 | threefold-repetition: 73, ply-limit: 2 |
| rook-check | white | 96 | 46 | 0 | 50 | 47.9% | 74.0% | 1889.13 | 301.37 | threefold-repetition: 50 |
| rook-check | black | 96 | 36 | 2 | 58 | 37.5% | 67.7% | 399.58 | 520.53 | threefold-repetition: 58 |
| unrestricted | white | 96 | 96 | 0 | 0 | 100.0% | 100.0% | 3738.92 | 80.77 | — |
| unrestricted | black | 96 | 14 | 82 | 0 | 14.6% | 14.6% | 95.80 | 458.57 | — |
| protected-recurring | white | 96 | 88 | 0 | 8 | 91.7% | 95.8% | 1432.91 | 322.60 | threefold-repetition: 8 |
| protected-recurring | black | 96 | 95 | 0 | 1 | 99.0% | 99.5% | 1032.68 | 365.73 | threefold-repetition: 1 |
| protected-opening | white | 96 | 76 | 0 | 20 | 79.2% | 89.6% | 1835.48 | 424.10 | threefold-repetition: 20 |
| protected-opening | black | 96 | 88 | 0 | 8 | 91.7% | 95.8% | 1142.17 | 328.85 | threefold-repetition: 8 |
| first-turn-quiet | white | 96 | 91 | 0 | 5 | 94.8% | 97.4% | 1489.81 | 185.59 | threefold-repetition: 5 |
| first-turn-quiet | black | 96 | 49 | 26 | 21 | 51.0% | 62.0% | 367.84 | 354.55 | threefold-repetition: 21 |
| protected-first-turn | white | 96 | 80 | 0 | 16 | 83.3% | 91.7% | 1063.22 | 170.19 | threefold-repetition: 16 |
| protected-first-turn | black | 96 | 75 | 0 | 21 | 78.1% | 89.1% | 548.29 | 522.52 | threefold-repetition: 21 |
| mutual-one | white | 96 | 86 | 0 | 10 | 89.6% | 94.8% | 1910.43 | 210.38 | threefold-repetition: 10 |
| mutual-one | black | 96 | 51 | 29 | 16 | 53.1% | 61.5% | 364.72 | 405.42 | threefold-repetition: 16 |
| mutual-two | white | 96 | 71 | 4 | 21 | 74.0% | 84.9% | 2769.57 | 322.93 | threefold-repetition: 21 |
| mutual-two | black | 96 | 49 | 0 | 47 | 51.0% | 75.5% | 760.79 | 426.58 | threefold-repetition: 47 |
| limited-check | white | 96 | 44 | 0 | 52 | 45.8% | 72.9% | 982.57 | 172.20 | threefold-repetition: 51, ply-limit: 1 |
| limited-check | black | 96 | 55 | 0 | 41 | 57.3% | 78.6% | 281.49 | 247.01 | threefold-repetition: 41 |
| cooldown | white | 96 | 78 | 0 | 18 | 81.2% | 90.6% | 1395.90 | 162.20 | threefold-repetition: 18 |
| cooldown | black | 96 | 43 | 8 | 45 | 44.8% | 68.2% | 352.63 | 388.72 | threefold-repetition: 45 |
| no-drop-mate | white | 96 | 94 | 0 | 2 | 97.9% | 99.0% | 4345.09 | 209.79 | threefold-repetition: 2 |
| no-drop-mate | black | 96 | 12 | 70 | 14 | 12.5% | 19.8% | 668.57 | 1518.14 | threefold-repetition: 14 |
| grace | white | 96 | 87 | 0 | 9 | 90.6% | 95.3% | 2472.06 | 217.02 | threefold-repetition: 9 |
| grace | black | 96 | 37 | 8 | 51 | 38.5% | 65.1% | 711.84 | 297.76 | threefold-repetition: 51 |
| quiet-return | white | 96 | 22 | 0 | 74 | 22.9% | 61.5% | 1194.17 | 143.76 | threefold-repetition: 74 |
| quiet-return | black | 96 | 37 | 0 | 59 | 38.5% | 69.3% | 620.42 | 223.78 | threefold-repetition: 58, ply-limit: 1 |
| setup-white-quiet | white | 96 | 30 | 0 | 66 | 31.2% | 65.6% | 250.16 | 67.94 | threefold-repetition: 63, ply-limit: 3 |
| setup-white-quiet | black | 96 | 12 | 1 | 83 | 12.5% | 55.7% | 179.87 | 71.89 | threefold-repetition: 83 |
| setup-white-checking | white | 96 | 67 | 0 | 29 | 69.8% | 84.9% | 368.91 | 46.84 | threefold-repetition: 29 |
| setup-white-checking | black | 96 | 51 | 2 | 43 | 53.1% | 75.5% | 265.33 | 62.06 | threefold-repetition: 43 |
| setup-black-quiet | white | 96 | 25 | 2 | 69 | 26.0% | 62.0% | 242.29 | 67.67 | threefold-repetition: 66, ply-limit: 3 |
| setup-black-quiet | black | 96 | 71 | 0 | 25 | 74.0% | 87.0% | 210.70 | 87.62 | threefold-repetition: 25 |
| setup-black-checking | white | 96 | 54 | 14 | 28 | 56.2% | 70.8% | 350.98 | 61.65 | threefold-repetition: 28 |
| setup-black-checking | black | 96 | 90 | 0 | 6 | 93.8% | 96.9% | 259.10 | 96.06 | threefold-repetition: 6 |
| hidden-quiet | white | 96 | 25 | 0 | 71 | 26.0% | 63.0% | 183.29 | 56.18 | threefold-repetition: 71 |
| hidden-quiet | black | 96 | 33 | 7 | 56 | 34.4% | 63.5% | 166.33 | 62.19 | threefold-repetition: 56 |
| hidden-checking | white | 96 | 63 | 1 | 32 | 65.6% | 82.3% | 212.01 | 31.01 | threefold-repetition: 32 |
| hidden-checking | black | 96 | 33 | 17 | 46 | 34.4% | 58.3% | 149.09 | 59.94 | threefold-repetition: 46 |
