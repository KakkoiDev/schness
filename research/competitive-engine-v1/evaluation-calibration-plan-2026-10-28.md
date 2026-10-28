# Preregistered teacher-residual dataset

Current search/ordering review offers no supported candidate after the retained negative diagnostics. Return to the original evaluation-calibration question with independent opponent outputs rather than another search guard or coefficient guess. The existing evaluator adds linear board/reserve material, legal mobility, check status, geometric king confinement and exposed-material terms. We have measured their mechanics but have not collected a fixed outcome-inclusive teacher dataset for their combined residuals.

## Question and fixed data

Do these terms leave systematic residuals against unchanged pinned Fairy at100ms on actual game positions, sufficiently large and consistent to justify designing a separate learned evaluation experiment? A Fairy finite-time score is a teacher target, not ground truth; differences in horizon and mate detection must remain explicit. No coefficient or policy will change in this stage.

Take exactly indices0,2,4,...126 from js-broad-tactical-corpus.json:64 existing snapshots across all32 completed games, including wins and draws, in original order. Match each snapshot to its retained original full game transcript and replay from the original root. Stop and retain the failure if identity/history reconstruction or frozen/current/Fairy legal parity fails. No replacement, score selection or extra query is allowed. Unlike the prior32 synthetic action-continuation diagnostic, this stage collects evaluation targets for a fixed actual-game dataset; it does not ask which action agrees.

Query each root once using the unchanged pinned Fairy1.1.12/b2e693ef,100ms,one thread,16MiB,NNUEoff and full UCI history. Record raw cp/mate score with perspective, actual time, depth, PV, full UCI traffic and legal parity. Retain mates, unknown/missing scores, failures and incompletes as separate categories rather than converting mate to a chosen centipawn value. No additional continuation searches. Keep the complete runtime/source/GPL/environment archive and verify every file byte.

Record the current competitive static evaluation at each identical snapshot and its existing term contributions without changing decisions or coefficients. Require their sum to reproduce the production evaluator exactly, with input restoration and color-perspective checks. No new coefficients, action selection or strength inference. A score residual is descriptive, not a heuristic bug or a missed-win certificate.

## Analysis boundary

Separate the64 fixed records into even/odd game-start identifier groups before any fit; both colors from one start stay together. Report term ranges, nonmate teacher coverage, residual distributions and paired color signs. Do not fit or choose weights in this stage. Do not tune on the old correlated61 cases or revive failed reserve-pressure/geometry families. If coverage or term reconstruction is inadequate, stop with that finding. Any later model requires its own preregistered grouped train/validation design, bounded evaluation cost, default-preserving correctness tests and a complete unchanged-opponent screen. Predicting teacher scores alone never establishes strength or authorizes promotion.
