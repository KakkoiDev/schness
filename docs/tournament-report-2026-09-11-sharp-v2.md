# AI tournament report — run 2 (Sharp v2)

Date: 2026-09-11  
Games: 1,040  
Run 2: [GitHub Actions 34487140120](https://github.com/KakkoiDev/schness/actions/runs/34487140120)  
Baseline: [run 1, 34467850233](https://github.com/KakkoiDev/schness/actions/runs/34467850233)

## Executive conclusion

Sharp v2's repetition-aware tie-break made the tournament modestly more decisive. Threefold draws fell from 467 to 430 (-37 games, -3.6 percentage points), while total draws fell from 508 to 480 (-28, -2.7 points). The 28 additional decisive games split evenly between White and Black.

Against Learning and Steady, Sharp's wins rose from 483 to 504, losses rose from 28 to 30, and score rose from 77.34% to 78.49%. Therefore repetition aversion reduced dull draws and improved practical results, but it does **not** meet the strict claim “without increasing Sharp losses”: losses increased by two. That difference is small enough to be sampling noise, even with the same seeded schedule. Sharp v2 is retained as the practical default, but is not yet proven categorically stronger.

Sharp–Sharp remains draw-heavy: 89.9% draws in run 1 versus 87.5% in run 2. This is a modest improvement, not a solved problem.

## Artifact verification

The run completed successfully at commit `567a20c82be6ce97f6d49e902545c1bf7f871281`. The single artifact, `schness-tournament-2`, contained `manifest.json`, `summary.csv`, `games.jsonl`, and `ANALYZE.md`. Its downloaded SHA-256 matched GitHub's digest:

`a33041f60daf06a940e83c57e3b23efc6af6acc55b642ab1f30538e832a40797`

The schema-2 manifest identifies Sharp v2, declares all 1,040 games, records every matchup, and embeds the rules and all AI profiles. Every individual game also records both engines' exact profiles.

## Rules used

- The game starts on an empty 4×4 board.
- White places its king on rank 1; Black then places its king on rank 4.
- A turn either moves a deployed piece or drops a reserve piece.
- A drop may not give check; a normal move may.
- A captured rook, bishop, or knight returns to its original owner's reserve.
- Ordinary king safety and checkmate apply.
- Stalemate and threefold repetition are draws.
- The experiment stops unresolved games at 200 plies and records a ply-limit draw.

## AI profiles

- **Learning v1:** depth-2 alpha-beta; shallow search; seeded random choice among equal scores.
- **Steady v1:** depth-3 alpha-beta; medium search; seeded random choice among equal scores.
- **Sharp v2:** depth-4 alpha-beta; deep search; among equally scored moves, prefers a resulting position seen fewer times. It still accepts repetition when that scores better than losing.

Learning and Steady were unchanged controls. Run 1 used Sharp v1 at the same depth and evaluation, without the repetition-aware equal-score tie-break.

## Overall comparison

| Outcome | Run 1 | Run 2 | Change |
|---|---:|---:|---:|
| White wins | 276 (26.5%) | 290 (27.9%) | +14 |
| Black wins | 256 (24.6%) | 270 (26.0%) | +14 |
| Threefold draws | 467 (44.9%) | 430 (41.3%) | -37 |
| Ply-limit draws | 41 (3.9%) | 50 (4.8%) | +9 |
| All draws | 508 (48.8%) | 480 (46.2%) | -28 |
| Decisive games | 532 (51.2%) | 560 (53.8%) | +28 |
| Mean length | 66.78 plies | 69.19 plies | +2.41 |
| Median length | 53 plies | 54 plies | +1 |

Some avoided repetitions became longer 200-ply draws, particularly in Sharp–Steady games. Repetition aversion moves the boundary in the desired direction, but does not solve every conversion problem.

## Results by opponent strength

Sharp's score counts a win as 1 and a draw as 0.5.

| Sharp matchup | Run 1 W-L-D | Run 2 W-L-D | Run 1 score | Run 2 score |
|---|---:|---:|---:|---:|
| Black vs Learning | 111-3-94 | 123-3-82 | 76.0% | 78.8% |
| White vs Learning | 148-1-59 | 155-1-52 | 85.3% | 87.0% |
| White vs Steady | 106-17-85 | 109-18-81 | 71.4% | 71.9% |
| Black vs Steady | 118-7-83 | 117-8-83 | 76.7% | 76.2% |
| **Combined vs lower levels** | **483-28-321** | **504-30-298** | **77.34%** | **78.49%** |

The strongest improvement came against Learning. Results against Steady were nearly flat: one color improved slightly and the other declined slightly.

## Sharp versus Sharp

| Outcome | Run 1 | Run 2 |
|---|---:|---:|
| White wins | 12 | 15 |
| Black wins | 9 | 11 |
| Threefold draws | 186 | 182 |
| Ply-limit draws | 1 | 0 |
| All draws | 187 (89.9%) | 182 (87.5%) |
| Decisive games | 21 | 26 |
| Mean length | 53.34 | 55.99 |

The five additional decisive games are useful evidence, but 87.5% identical-engine draws is still too high to infer that optimal Schness is normally decisive.

## Paired-game changes

The two runs used the same indexed schedule and seed. Outcomes were unchanged in 950 of 1,040 games. The largest changed categories were:

- Threefold to Black win: 28
- Threefold to White win: 17
- Black win to threefold: 10
- Threefold to ply-limit: 9
- Black win to ply-limit: 7
- White win to threefold: 5

This supports the mechanism: v2 often escaped a repeated position into a win, but sometimes disrupted an existing win or merely delayed a draw.

## Game length

| Result class | Run 1 mean / median | Run 2 mean / median |
|---|---:|---:|
| Decisive | 62.7 / 54 | 64.7 / 54 |
| Threefold | 59.7 / 49 | 59.9 / 49 |
| Ply-limit | 200 / 200 | 200 / 200 |

Run 2 is slightly longer overall. The extra time is concentrated in decisive and ply-limit games, not in threefold draws.

## Color effects

Run 2 produced 290 White wins and 270 Black wins, a small 20-game White edge across 1,040 games. The additional decisive games relative to run 1 were exactly balanced: +14 White wins and +14 Black wins. There is no evidence that repetition aversion introduced a new color bias.

## King starts

Against Learning and Steady, Sharp's score by its own starting square was:

| Sharp color/start | Run 1 | Run 2 |
|---|---:|---:|
| White a1 | 79.8% | 81.7% |
| White b1 | 77.9% | 77.9% |
| White c1 | 77.4% | 78.8% |
| White d1 | 78.4% | 79.3% |
| Black a4 | 80.3% | 79.3% |
| Black b4 | 78.4% | 77.9% |
| Black c4 | 72.1% | 74.5% |
| Black d4 | 74.5% | 78.4% |

Pooling those games, corner starts had a modest advantage. In Sharp–Sharp, however, corner and inner starts were essentially even for White, while Black inner starts were somewhat worse. The data still does not support “always place the king in a corner” as a universal rule. It is a useful prior against weaker opponents, not a proven theorem.

## Mating patterns

| Mating piece | Run 1 | Run 2 |
|---|---:|---:|
| Rook | 412 (77.4%) | 437 (78.0%) |
| Knight | 81 (15.2%) | 84 (15.0%) |
| Bishop | 39 (7.3%) | 39 (7.0%) |

Rooks remain the decisive mating piece. Almost all of the 28 additional mates were rook mates (+25). Common final moves included rook captures on the back rank and rook drops or moves on edge files. Knights are important tactical finishers; bishops rarely deliver mate directly.

## Decision and next experiment

Retain Sharp v2. It reduces repetition and raises Sharp's combined score without changing the evaluation or sacrificing a draw for a known loss. Do not change the game rules based on this run.

Do not yet claim that v2 is strictly stronger: Sharp losses rose from 28 to 30. The next controlled experiment should run several independent seeds and add direct Sharp v1 versus Sharp v2 matchups with colors and all king starts reversed. A later engine change should target long non-repeating 200-ply draws separately from immediate repetition.
