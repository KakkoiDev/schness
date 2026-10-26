# Depth-five results by variant and engine color

6912 games, complete; frozen runtime and replays verified. Aggregate rows mix variants and are descriptive only. Score counts each draw as half a point. Timings are observed wall time under parallel load, not an isolated benchmark. Six reused seeds repeat 16 starts; no independent-game confidence or proven noninferiority claim.

| Variant | v7 color | Games | v7 wins | v2 wins | Draws | v7 win rate | v7 score | v7 ms/move | v2 ms/move | Draw reasons |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| All 36 (descriptive) | white | 3456 | 2574 | 241 | 641 | 74.5% | 83.8% | 78.45 | 159.81 | ply-limit: 387, threefold-repetition: 188, stalemate: 66 |
| All 36 (descriptive) | black | 3456 | 1824 | 982 | 650 | 52.8% | 62.2% | 55.48 | 262.27 | ply-limit: 373, threefold-repetition: 270, stalemate: 7 |
| canonical | white | 96 | 53 | 5 | 38 | 55.2% | 75.0% | 49.59 | 125.89 | ply-limit: 29, threefold-repetition: 9 |
| canonical | black | 96 | 45 | 2 | 49 | 46.9% | 72.4% | 41.94 | 176.85 | ply-limit: 41, threefold-repetition: 8 |
| permanent-loss-quiet | white | 96 | 33 | 8 | 55 | 34.4% | 63.0% | 29.02 | 35.63 | ply-limit: 28, threefold-repetition: 25, stalemate: 2 |
| permanent-loss-quiet | black | 96 | 29 | 7 | 60 | 30.2% | 61.5% | 18.26 | 91.76 | stalemate: 6, threefold-repetition: 41, ply-limit: 13 |
| permanent-loss-checking | white | 96 | 68 | 0 | 28 | 70.8% | 85.4% | 51.23 | 27.86 | stalemate: 16, threefold-repetition: 8, ply-limit: 4 |
| permanent-loss-checking | black | 96 | 23 | 50 | 23 | 24.0% | 35.9% | 10.39 | 155.05 | ply-limit: 13, threefold-repetition: 9, stalemate: 1 |
| capture-bank-3-quiet | white | 96 | 82 | 10 | 4 | 85.4% | 87.5% | 133.73 | 191.38 | threefold-repetition: 4 |
| capture-bank-3-quiet | black | 96 | 88 | 7 | 1 | 91.7% | 92.2% | 62.29 | 220.02 | threefold-repetition: 1 |
| capture-bank-3-checking | white | 96 | 84 | 0 | 12 | 87.5% | 93.8% | 227.59 | 99.62 | stalemate: 12 |
| capture-bank-3-checking | black | 96 | 14 | 74 | 8 | 14.6% | 18.8% | 34.67 | 559.20 | threefold-repetition: 8 |
| capture-bank-4-quiet | white | 96 | 90 | 6 | 0 | 93.8% | 93.8% | 104.43 | 190.20 | — |
| capture-bank-4-quiet | black | 96 | 70 | 24 | 2 | 72.9% | 74.0% | 53.98 | 216.81 | threefold-repetition: 2 |
| capture-bank-4-checking | white | 96 | 84 | 0 | 12 | 87.5% | 93.8% | 122.71 | 74.18 | stalemate: 12 |
| capture-bank-4-checking | black | 96 | 33 | 60 | 3 | 34.4% | 35.9% | 40.75 | 479.39 | threefold-repetition: 3 |
| capture-bank-5-quiet | white | 96 | 90 | 6 | 0 | 93.8% | 93.8% | 104.76 | 188.77 | — |
| capture-bank-5-quiet | black | 96 | 70 | 24 | 2 | 72.9% | 74.0% | 54.59 | 217.47 | threefold-repetition: 2 |
| capture-bank-5-checking | white | 96 | 84 | 0 | 12 | 87.5% | 93.8% | 118.43 | 73.84 | stalemate: 12 |
| capture-bank-5-checking | black | 96 | 33 | 60 | 3 | 34.4% | 35.9% | 40.66 | 478.28 | threefold-repetition: 3 |
| capture-bank-6-quiet | white | 96 | 90 | 6 | 0 | 93.8% | 93.8% | 104.46 | 188.24 | — |
| capture-bank-6-quiet | black | 96 | 70 | 24 | 2 | 72.9% | 74.0% | 54.47 | 217.40 | threefold-repetition: 2 |
| capture-bank-6-checking | white | 96 | 84 | 0 | 12 | 87.5% | 93.8% | 118.13 | 73.13 | stalemate: 12 |
| capture-bank-6-checking | black | 96 | 33 | 60 | 3 | 34.4% | 35.9% | 40.51 | 479.97 | threefold-repetition: 3 |
| home-half-check | white | 96 | 83 | 4 | 9 | 86.5% | 91.1% | 74.16 | 120.30 | ply-limit: 8, threefold-repetition: 1 |
| home-half-check | black | 96 | 49 | 16 | 31 | 51.0% | 67.2% | 50.42 | 252.37 | ply-limit: 17, threefold-repetition: 14 |
| distant-check | white | 96 | 73 | 12 | 11 | 76.0% | 81.8% | 69.93 | 103.44 | ply-limit: 10, threefold-repetition: 1 |
| distant-check | black | 96 | 29 | 57 | 10 | 30.2% | 35.4% | 60.50 | 580.96 | threefold-repetition: 10 |
| supported-check | white | 96 | 92 | 1 | 3 | 95.8% | 97.4% | 106.36 | 106.69 | threefold-repetition: 3 |
| supported-check | black | 96 | 0 | 84 | 12 | 0.0% | 6.2% | 30.88 | 892.99 | threefold-repetition: 12 |
| countercheck-only | white | 96 | 51 | 3 | 42 | 53.1% | 75.0% | 64.42 | 161.00 | ply-limit: 41, threefold-repetition: 1 |
| countercheck-only | black | 96 | 49 | 5 | 42 | 51.0% | 72.9% | 56.86 | 220.52 | ply-limit: 37, threefold-repetition: 5 |
| knight-check | white | 96 | 57 | 5 | 34 | 59.4% | 77.1% | 51.73 | 123.72 | ply-limit: 23, threefold-repetition: 11 |
| knight-check | black | 96 | 69 | 5 | 22 | 71.9% | 83.3% | 53.38 | 253.16 | ply-limit: 18, threefold-repetition: 4 |
| bishop-check | white | 96 | 43 | 8 | 45 | 44.8% | 68.2% | 62.14 | 141.24 | ply-limit: 37, threefold-repetition: 8 |
| bishop-check | black | 96 | 49 | 2 | 45 | 51.0% | 74.5% | 53.81 | 203.35 | ply-limit: 41, threefold-repetition: 4 |
| rook-check | white | 96 | 59 | 12 | 25 | 61.5% | 74.5% | 86.70 | 165.83 | ply-limit: 5, threefold-repetition: 20 |
| rook-check | black | 96 | 44 | 4 | 48 | 45.8% | 70.8% | 59.17 | 305.95 | threefold-repetition: 40, ply-limit: 8 |
| unrestricted | white | 96 | 96 | 0 | 0 | 100.0% | 100.0% | 161.58 | 59.74 | — |
| unrestricted | black | 96 | 9 | 87 | 0 | 9.4% | 9.4% | 31.64 | 537.83 | — |
| protected-recurring | white | 96 | 85 | 8 | 3 | 88.5% | 90.1% | 114.07 | 441.83 | threefold-repetition: 3 |
| protected-recurring | black | 96 | 77 | 15 | 4 | 80.2% | 82.3% | 143.75 | 383.92 | threefold-repetition: 4 |
| protected-opening | white | 96 | 33 | 53 | 10 | 34.4% | 39.6% | 147.03 | 1304.29 | threefold-repetition: 10 |
| protected-opening | black | 96 | 86 | 9 | 1 | 89.6% | 90.1% | 140.11 | 371.80 | threefold-repetition: 1 |
| first-turn-quiet | white | 96 | 85 | 5 | 6 | 88.5% | 91.7% | 122.43 | 131.62 | threefold-repetition: 6 |
| first-turn-quiet | black | 96 | 30 | 66 | 0 | 31.2% | 31.2% | 81.71 | 694.44 | — |
| protected-first-turn | white | 96 | 78 | 4 | 14 | 81.2% | 88.5% | 107.20 | 209.48 | threefold-repetition: 13, ply-limit: 1 |
| protected-first-turn | black | 96 | 82 | 5 | 9 | 85.4% | 90.1% | 102.43 | 418.12 | threefold-repetition: 9 |
| mutual-one | white | 96 | 83 | 6 | 7 | 86.5% | 90.1% | 127.58 | 143.65 | ply-limit: 1, threefold-repetition: 6 |
| mutual-one | black | 96 | 36 | 57 | 3 | 37.5% | 39.1% | 92.03 | 801.45 | threefold-repetition: 3 |
| mutual-two | white | 96 | 87 | 6 | 3 | 90.6% | 92.2% | 128.69 | 186.70 | threefold-repetition: 3 |
| mutual-two | black | 96 | 75 | 12 | 9 | 78.1% | 82.8% | 89.49 | 289.52 | threefold-repetition: 8, ply-limit: 1 |
| limited-check | white | 96 | 37 | 4 | 55 | 38.5% | 67.2% | 50.94 | 138.33 | ply-limit: 50, threefold-repetition: 5 |
| limited-check | black | 96 | 46 | 0 | 50 | 47.9% | 74.0% | 50.41 | 202.55 | ply-limit: 49, threefold-repetition: 1 |
| cooldown | white | 96 | 81 | 11 | 4 | 84.4% | 86.5% | 78.76 | 143.15 | threefold-repetition: 4 |
| cooldown | black | 96 | 70 | 4 | 22 | 72.9% | 84.4% | 69.13 | 296.70 | threefold-repetition: 22 |
| no-drop-mate | white | 96 | 95 | 0 | 1 | 99.0% | 99.5% | 671.28 | 244.14 | threefold-repetition: 1 |
| no-drop-mate | black | 96 | 7 | 88 | 1 | 7.3% | 7.8% | 215.49 | 2227.00 | threefold-repetition: 1 |
| grace | white | 96 | 89 | 4 | 3 | 92.7% | 94.3% | 160.83 | 234.33 | threefold-repetition: 3 |
| grace | black | 96 | 73 | 15 | 8 | 76.0% | 80.2% | 75.74 | 278.93 | threefold-repetition: 8 |
| quiet-return | white | 96 | 52 | 3 | 41 | 54.2% | 75.5% | 71.53 | 167.90 | ply-limit: 39, threefold-repetition: 2 |
| quiet-return | black | 96 | 52 | 2 | 42 | 54.2% | 76.0% | 58.59 | 203.39 | ply-limit: 38, threefold-repetition: 4 |
| setup-white-quiet | white | 96 | 54 | 2 | 40 | 56.2% | 77.1% | 43.64 | 111.78 | ply-limit: 37, threefold-repetition: 3 |
| setup-white-quiet | black | 96 | 50 | 2 | 44 | 52.1% | 75.0% | 42.97 | 122.86 | ply-limit: 41, threefold-repetition: 3 |
| setup-white-checking | white | 96 | 66 | 17 | 13 | 68.8% | 75.5% | 58.90 | 77.77 | threefold-repetition: 13 |
| setup-white-checking | black | 96 | 73 | 14 | 9 | 76.0% | 80.7% | 54.92 | 92.48 | threefold-repetition: 9 |
| setup-black-quiet | white | 96 | 54 | 2 | 40 | 56.2% | 77.1% | 44.76 | 113.82 | ply-limit: 37, threefold-repetition: 3 |
| setup-black-quiet | black | 96 | 76 | 1 | 19 | 79.2% | 89.1% | 42.82 | 123.50 | ply-limit: 18, threefold-repetition: 1 |
| setup-black-checking | white | 96 | 65 | 21 | 10 | 67.7% | 72.9% | 61.55 | 80.22 | threefold-repetition: 10 |
| setup-black-checking | black | 96 | 92 | 1 | 3 | 95.8% | 97.4% | 55.40 | 98.30 | threefold-repetition: 3 |
| hidden-quiet | white | 96 | 52 | 2 | 42 | 54.2% | 76.0% | 41.48 | 117.02 | threefold-repetition: 5, ply-limit: 37 |
| hidden-quiet | black | 96 | 44 | 10 | 42 | 45.8% | 67.7% | 42.56 | 119.09 | ply-limit: 38, threefold-repetition: 4 |
| hidden-checking | white | 96 | 82 | 7 | 7 | 85.4% | 89.1% | 55.64 | 55.24 | threefold-repetition: 7 |
| hidden-checking | black | 96 | 49 | 29 | 18 | 51.0% | 60.4% | 40.83 | 97.98 | threefold-repetition: 18 |
