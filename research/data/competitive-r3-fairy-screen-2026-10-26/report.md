# Schness competitive research versus Fairy-Stockfish

Status: complete (32/32).

Target: >=51% raw wins across all games; reached: false. Current raw wins: 14/32. Candidate requested depth 20; candidate time budget 10000ms; Fairy 100ms.

Competitive research screen on shared six-slot capture-bank quiet-drop rules, not Classic. Candidate has no node cap; candidateMillis null means uncapped time. Fairy has 100ms per move, one thread, 16MiB hash, NNUE off. Unequal-budget results do not establish equal-time superiority. Fixed colors and recorded tie seeds; repeated starts are correlated. Root legal parity checked every move; full history supplied. Requested depth counts plies, quiescence/reductions make this selective search. Proven mates may finish before requested depth. Every attempt is retained, not just successful screens. A successful screen requires a separate frozen confirmation schedule.

| Schness color | Games | Schness wins | Fairy wins | Draws | Schness win rate | Schness score | Schness mean ms/move | Fairy mean ms/move | Draw reasons |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| white | 16 | 10 | 5 | 1 | 62.5% | 65.6% | 9999.54 | 96.19 | ply-limit: 1 |
| black | 16 | 4 | 12 | 0 | 25.0% | 25.0% | 9999.53 | 96.24 | — |

white: completed Schness depths (plies) min/median/max = 6/9/14. Requested depth is not completed depth.

black: completed Schness depths (plies) min/median/max = 7/9/14. Requested depth is not completed depth.

The target uses wins divided by all games, not half-draw score. Score = wins plus half the draws divided by games. Actual browser wall times include command overhead; parity checks and setup are excluded. No neural network is used by Fairy. Reported selective depths are not equivalent exhaustive horizons. This uses a finite shared-rule adapter and the host adjudicates repetition/terminal outcomes; no universal equivalence or Classic-strength claim follows. Seeds repeat the recorded king starts and are not independent samples. An unequal-budget win rate does not demonstrate equal-time superiority or optimal play. Concurrent processes can affect elapsed time and completed depth. Failed and partial runs remain part of the research record.
