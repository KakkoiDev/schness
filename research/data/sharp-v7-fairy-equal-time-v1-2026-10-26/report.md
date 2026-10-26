# Sharp v7 versus Fairy-Stockfish — equal-time browser match

Status: complete (192/192).

Equal-time browser match on shared six-slot capture-bank quiet-drop rules, not Classic. Fixed candidate colors, six candidate tie seeds repeating 16 starts. Fairy is deterministic except timing; no seeded diversity claim. Full move history sent to Fairy. Root legal-move parity checked at every played position. Times include engine call overhead, exclude parity checks. Serial games, no Elo/proven-balance claim.

| v7 color | Games | v7 wins | Fairy wins | Draws | v7 win rate | v7 score | v7 mean ms/move | Fairy mean ms/move | Draw reasons |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| white | 96 | 0 | 96 | 0 | 0.0% | 0.0% | 99.52 | 87.41 | — |
| black | 96 | 0 | 96 | 0 | 0.0% | 0.0% | 99.52 | 84.69 | — |

Score = wins plus half the draws divided by games. Actual browser wall times include command overhead; parity checks and setup are excluded. No neural network is used by Fairy. Reported selective depths are not equivalent exhaustive horizons. This uses a finite shared-rule adapter and the host adjudicates repetition/terminal outcomes; no universal equivalence or Classic-strength claim follows. The six seeds repeat 16 starts and are not independent samples.
