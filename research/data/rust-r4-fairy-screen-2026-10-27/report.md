# Schness competitive research versus Fairy-Stockfish

Status: complete (32/32).

Target: >=51% raw wins across all games; reached: false. Current raw wins: 2/32. Candidate requested depth 20; candidate time budget 100ms; Fairy 100ms.

Native Rust research screen on shared six-slot capture-bank quiet-drop rules, not Classic. Candidate has no node cap; Native process has a 30-second failure watchdog, not a search budget; search explicitly uses candidateMillis. Fairy has 100ms per move, one thread, 16MiB hash, NNUE off. Candidate and Fairy budgets explicitly recorded in manifest; native IPC overhead is included in actual candidate timing. Selective algorithms differ; results are not universal strength evidence. Fixed colors and recorded schedule seeds (native ties deterministic); repeated starts are correlated. Root legal parity checked every move; full history supplied. Requested depth counts plies, quiescence/reductions make this selective search. Proven mates may finish before requested depth. Every attempt is retained, not just successful screens. A successful screen requires a separate frozen confirmation schedule.

| Schness color | Games | Schness wins | Fairy wins | Draws | Schness win rate | Schness score | Schness mean ms/move | Fairy mean ms/move | Draw reasons |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| white | 16 | 2 | 13 | 1 | 12.5% | 15.6% | 101.46 | 91.25 | threefold-repetition: 1 |
| black | 16 | 0 | 15 | 1 | 0.0% | 3.1% | 101.49 | 90.73 | threefold-repetition: 1 |

white: completed Schness depths (plies) min/median/max = 3/6/11. Requested depth is not completed depth.

black: completed Schness depths (plies) min/median/max = 3/6/9. Requested depth is not completed depth.

The target uses wins divided by all games, not half-draw score. Score = wins plus half the draws divided by games. Actual browser wall times include command overhead; parity checks and setup are excluded. No neural network is used by Fairy. Reported selective depths are not equivalent exhaustive horizons. This uses a finite shared-rule adapter and the host adjudicates repetition/terminal outcomes; no universal equivalence or Classic-strength claim follows. Seeds repeat the recorded king starts and are not independent samples. An unequal-budget win rate does not demonstrate equal-time superiority or optimal play. Concurrent processes can affect elapsed time and completed depth. Failed and partial runs remain part of the research record.
