# Chess-variant ideas for Schness

Researched 2026-10-24. These are proposals, not implemented presets or additions to the frozen
balance-v1 batches. Established rules below are distinct from suggested Schness adaptations;
possible balance benefits are hypotheses, not published results.

| Inspiration | Established mechanic | Schness experiment | Implementation scope |
|---|---|---|---|
| [Placement Chess](https://www.pychess.org/variants/placement) | Players alternate placing back-rank pieces before normal play. | Own-home-row setup, quiet versus checking drops after setup. Already launched as the home-setup supplement. | Implemented in research only. |
| [Crazyhouse](https://lichess.org/variant/crazyhouse) | Captures change color and enter the capturer's pocket; drops can checkmate. | Existing capture banks, with quiet-drop and delayed-reuse restrictions being tested. | Already covered; use as baseline, not a newly invented mechanism. |
| [Three-check](https://lichess.org/variant/threeCheck) | Giving a third check wins; checkmate still wins. | Quiet drops, win on the third or fifth checking turn. Count each action once even for double check. | Moderate: counters, hashes, replay, terminal evaluation and check-progress heuristic. |
| [King of the Hill](https://lichess.org/variant/kingOfTheHill) | Legally moving the king into a central target square wins; king safety still applies. | Hold one of b2/c2/b3/c3 until the start of your next turn; checkmate remains a win. Explicitly an adaptation: instant center arrival is very near on 4x4. | Moderate: target-hold state, terminal precedence and search objective. |
| [Racing Kings](https://lichess.org/variant/racingKings) | Checks are forbidden; reaching the finish rank wins, with a next-move equalizing chance for Black after White finishes. | Each king races toward the opposite home row; retain quiet bank drops. Adapt the reply/equalization rule explicitly for opposite-direction racing. | Substantial: new objective, no-check legality and terminal timing. |
| [Dobutsu Shogi](https://www.pychess.org/variants/dobutsu) | Tiny 3x4 capture-to-hand game; king/lion reaching the far rank is an additional goal. Rook/bishop-like animals are single-step pieces. | First test rook/bishop range caps of one or two squares with quiet capture banks; separately explore a defended far-rank king goal. | Moderate: movement tables/attacks and values; new king objective is separate. |
| [Kyoto Shogi](https://www.pychess.org/variants/kyotoshogi) | Non-kings flip between paired movement types after moving; captured pieces can be dropped with either face. | One bishop/knight transforming piece, flipping after a board move; define capture/drop face policy first. | Substantial: piece identity/forms, attacks, hashes, UI and evaluation. |
| [Seirawan Chess](https://www.pychess.org/variants/seirawan) | Extra pieces can enter a vacated home-rank square when its starting occupant first moves; includes bishop+knight and rook+knight hybrids. | Start with two deployed pieces and one reserve; allow entry through a vacated own home square. Compare ordinary drops against gating-only. | Substantial: compound actions, gating rights, king safety and search cost. |
| [Duck Chess](https://www.pychess.org/variants/duck) | After moving, relocate an uncapturable blocker; the king is captured and check restrictions are absent. | A neutral blocker on 5x5/6x6, with explicit move-then-block phase. Keeping normal checkmate would be a separate adaptation requiring safety after the entire turn. | Large: turn phases, branching factor, blocker state, objective and UI. |
| [Antichess](https://lichess.org/variant/antichess) | Captures are mandatory; kings are ordinary pieces; losing all pieces or being stalemated wins. | Borrow only mandatory legal captures while keeping royal kings/checkmate; try full giveaway as a separate mode later. | Moderate for mandatory captures; large for full objective reversal. |
| [Atomic](https://lichess.org/variant/atomic) | Captures remove the capturing/captured piece and adjacent non-pawns; king explosions decide games. | Explore only after larger boards. On 4x4 a standard blast covers much of the board; define whether blasted pieces return to banks. | Large: alternate attack/safety semantics, capture effects and evaluation. |

## Recommended next screen

1. Range-limited rook/bishop (one or two squares), quiet capture bank 4: directly tests whether
   tiny-board long-range pressure drives the opening advantage.
2. Three-check and five-check with quiet drops: alternate objectives that can turn some repeated
   checking sequences into progress. Repetition precedence must be explicit; do not claim all
   repetitions disappear.
3. Center hold with normal king safety: a positional objective as well as checkmate. Entry is not
   immediate victory; the opponent gets a response. Test for accidental forced White wins.
4. Mandatory legal captures with normal kings: tests tactical commitments. Never force a capture
   that leaves the king in check.
5. Seirawan-style restricted reserve entry: a larger change, but a natural fit for a reserve game.

Retain the >=80% decisive / 45–55% White share target, but distinguish checkmate wins from new
objective wins. Declaring every stalemate a loss can cosmetically raise decisiveness without
improving play. New objectives need a matching search evaluator; identical old Sharp settings
alone do not make an engine competent at them. Record engine policy/version and test mirrored
positions/color swaps, fresh seeds and deeper search before judging balance. A small symmetric
rule is not automatically a balanced game: opening tempo still matters.
