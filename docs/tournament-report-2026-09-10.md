# AI tournament report — run 1

This report analyzes [AI tournament run 1](https://github.com/KakkoiDev/schness/actions/runs/34467850233),
generated from commit `4f45fb19e6f99b14379535fcf87be28316da9e89` on 2026-09-10.
The downloadable `schness-tournament-1` artifact contains the complete source data.

## Experiment

- 1,040 reproducible games
- 13 repetitions of the complete 80-game research set
- all 16 combinations of White and Black king starting squares
- matchups: Sharp–Sharp, Sharp–Steady, Steady–Sharp, Sharp–Learning, and Learning–Sharp
- 200-ply maximum per game

The results describe these bot implementations and this fixed experiment. Correlations below are
evidence for follow-up tests, not solved Schness strategy.

## Overall results

| Result | Games | Rate |
| --- | ---: | ---: |
| White checkmate | 276 | 26.5% |
| Black checkmate | 256 | 24.6% |
| Threefold-repetition draw | 467 | 44.9% |
| 200-ply-limit draw | 41 | 3.9% |

White won 20 more games than Black, a 1.9 percentage-point difference across the whole dataset.
This is a small aggregate first-player advantage, but the mixed-strength matchups make it unsuitable
as a clean estimate of the color advantage. A color-balanced Sharp–Sharp experiment is more useful:
White won 12, Black won 9, and 187 of 208 games were drawn.

## Results by bot strength

Score rate awards one point for a win and half a point for a draw.

| Matchup | Sharp wins | Sharp losses | Draws | Sharp win rate | Sharp score rate |
| --- | ---: | ---: | ---: | ---: | ---: |
| Sharp White vs Learning Black | 148 | 1 | 59 | 71.2% | 85.3% |
| Learning White vs Sharp Black | 111 | 3 | 94 | 53.4% | 76.0% |
| Sharp White vs Steady Black | 106 | 17 | 85 | 51.0% | 71.4% |
| Steady White vs Sharp Black | 118 | 7 | 83 | 56.7% | 76.7% |

Sharp clearly outperformed both lower levels in either color. Steady narrowed the gap relative to
Learning, especially when Sharp played White. Sharp–Sharp produced 89.9% draws, which suggests that
the strongest bot's main limitation is converting balanced positions or deliberately escaping
repetition—not merely avoiding defeat.

## Game length

| Measure | Plies |
| --- | ---: |
| Mean | 66.8 |
| Median | 53 |
| First quartile | 32 |
| Third quartile | 86 |
| Minimum | 12 |
| Maximum | 200 |

White wins averaged 58.7 plies and Black wins averaged 67.0. Forty-one games reached the explicit
200-ply limit. The long tail means that median length better represents an ordinary game than the
mean.

## How games ended

Of the 532 checkmates, the mating move was delivered by:

| Piece | Share of checkmates |
| --- | ---: |
| Rook | 77.4% |
| Knight | 15.2% |
| Bishop | 7.3% |

The rook is the dominant finisher. The transcripts repeatedly show a rook checking along a rank or
file after the other pieces and board edge have restricted the king's escape squares. This does not
prove that deploying a rook first is optimal: first-deployment choices are heavily confounded with
bot strength and position.

## Is a corner king best?

The tournament does **not** support a universal corner-king rule.

- In Sharp–Sharp, White scored 50.0% from corner starts and 51.4% from inner starts. Black scored
  50.0% from corner starts and 48.6% from inner starts.
- Against Steady, Sharp White scored 75.0% from corner starts versus 67.8% from inner starts.
- With colors reversed, Sharp Black scored 74.5% from corner starts versus 78.8% from inner starts.
- Against Learning, the direction also changed with color: Sharp White did better from inner starts,
  while Sharp Black did better from corner starts.

Corner safety therefore appears conditional on color, opposing king placement, and the opponent's
policy. A corner reduces approach directions, but also reduces the king's escape squares. The data
does not justify always choosing a corner.

## Practical lessons and next experiments

1. **Plan around rook geometry.** Most mates are rook mates, so control of escape squares and safe
   rook activation deserve more weight than material counting alone.
2. **Do not treat captured material as permanently won.** A capture may improve the opponent's next
   deployment; evaluate the resulting reserve and drop threats.
3. **Avoid automatic repetition.** Nearly half the games drew by repetition, and Sharp–Sharp drew
   almost 90%. Add repetition-aware evaluation or controlled contempt, then rerun the same suite.
4. **Retest king placement with controlled strength.** Run larger Sharp–Sharp samples with varied
   deterministic seeds, then compare each exact pair of starting squares instead of pooling all
   corners and inner squares.
5. **Analyze mating nets, not only final moves.** Extract the final 6–10 plies of each decisive game
   and cluster them by rook line, supporting piece, king confinement, and whether the mating piece
   came from the reserve.

## Reproduction data

The workflow artifact includes:

- `manifest.json` — experiment metadata and total outcomes
- `summary.csv` — results grouped by levels and king starts
- `games.jsonl` — complete action-by-action transcripts and final positions
- `ANALYZE.md` — dataset field guide

The artifact expires according to GitHub's retention policy. The workflow and seed keep the
experiment reproducible even after the original ZIP expires.
