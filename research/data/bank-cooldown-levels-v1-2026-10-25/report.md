# Four-slot bank + one-turn capture cooldown — completed

864/864 games. Source SHA-256: 227dd933384f2098dab4a28cbfde1de3623d39081c4d7fdd13490ddfdaa78ec2

Frozen Learning v1 depth 2, Steady v1 depth 3 and Sharp v2 depth 4. All nine ordered pairings; fresh seeds and all 16 king placements per pairing. No numeric 0–100 profiles or production Sharp v3.
200 total plies maximum, including king placement. 96 games scheduled per pairing.

Only equal-level pairings assess color balance. Mixed-level color rates measure both engine strength and color; do not pool them into a balance claim. Six seeds repeat 16 starts, so games are not independent random positions. Screening targets remain >=80% decisive and White taking 45–55% of decisive games; no official adoption follows automatically.

| White AI | Black AI | Games | White wins | Black wins | Draws | Decisive | White share of wins | Mean plies | Equal-level hit |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| sharp | sharp | 96/96 | 45 | 39 | 12 | 87.5% | 53.6% | 55.6 | yes |
| steady | learning | 96/96 | 84 | 12 | 0 | 100.0% | 87.5% | 33.8 | — |
| learning | steady | 96/96 | 3 | 93 | 0 | 100.0% | 3.1% | 26.7 | — |
| learning | learning | 96/96 | 42 | 30 | 24 | 75.0% | 58.3% | 26.6 | — |
| sharp | steady | 96/96 | 75 | 16 | 5 | 94.8% | 82.4% | 41.7 | — |
| steady | sharp | 96/96 | 10 | 83 | 3 | 96.9% | 10.8% | 40.3 | — |
| sharp | learning | 96/96 | 79 | 3 | 14 | 85.4% | 96.3% | 30.0 | — |
| learning | sharp | 96/96 | 2 | 85 | 9 | 90.6% | 2.3% | 26.2 | — |
| steady | steady | 96/96 | 59 | 37 | 0 | 100.0% | 61.5% | 44.6 | — |

## Draw reasons

- sharp vs sharp: {"stalemate":3,"threefold-repetition":9}
- steady vs learning: {}
- learning vs steady: {}
- learning vs learning: {"threefold-repetition":24}
- sharp vs steady: {"threefold-repetition":5}
- steady vs sharp: {"threefold-repetition":3}
- sharp vs learning: {"threefold-repetition":14}
- learning vs sharp: {"threefold-repetition":9}
- steady vs steady: {}

## Rules

Capture-to-bank capacity 4; overflow returns to captured owner. Quiet drops only. New captures cool down 1 owner turns; existing reserve copies tick after own actions; no tick on new arrivals that turn. Forced wait only if no legal move and not in check. 
