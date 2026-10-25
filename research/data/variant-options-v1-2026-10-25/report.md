# Variant-options-v1 Research Sharp vs Research Sharp — completed

864/864 games. Research objective-search v1, depth 4, 200 total plies including king placement. Do not pool with Sharp v2/v3 datasets.
Source SHA-256: 81aead8505cb836f29765f39cc86dac44c61cde5d7f04033145357810dbc595b

Target: ≥80% decisive games and White winning 45–55% of decisive games. A screening hit is not proof of balance.
Each recipe uses the same 16 king placements across six seeds; seeds repeat openings and are not independent starting positions. Confirm candidates on fresh seeds and deeper search.
Cooling reserves retain full base material value in the heuristic, matching the transfer-bank control; legal mobility reflects readiness.
Only completed recipes should be compared. Draws include repetition, stalemate and the ply ceiling. Objective-aware check progress and center control bonuses are uncalibrated; these are screening results, not an objective solution of the variants.

| Recipe | Games | White wins | Black wins | Draws | Decisive | White share of decisive | Hit |
|---|---:|---:|---:|---:|---:|---:|---|
| control-delay-1-1 | 96 | 40 | 41 | 15 | 84.4% | 49.4% | yes |
| delay-1-0 | 96 | 40 | 41 | 15 | 84.4% | 49.4% | yes |
| delay-1-2 | 96 | 40 | 41 | 15 | 84.4% | 49.4% | yes |
| five-check | 96 | 57 | 39 | 0 | 100.0% | 59.4% | — |
| center-hold | 96 | 96 | 0 | 0 | 100.0% | 100.0% | — |
| three-check | 96 | 59 | 35 | 2 | 97.9% | 62.8% | — |
| home-half-drops | 96 | 37 | 46 | 13 | 86.5% | 44.6% | — |
| sliders-range-2 | 96 | 49 | 28 | 19 | 80.2% | 63.6% | — |
| mandatory-captures | 96 | 12 | 3 | 81 | 15.6% | 80.0% | — |

## Outcomes by reason

- **control-delay-1-1:** {"outcomes":{"white":40,"black":41,"threefold-repetition":11,"stalemate":4},"victories":{"checkmate":81}}
- **delay-1-0:** {"outcomes":{"white":40,"black":41,"threefold-repetition":11,"stalemate":4},"victories":{"checkmate":81}}
- **delay-1-2:** {"outcomes":{"white":40,"black":41,"threefold-repetition":11,"stalemate":4},"victories":{"checkmate":81}}
- **sliders-range-2:** {"outcomes":{"black":28,"white":49,"threefold-repetition":17,"stalemate":2},"victories":{"checkmate":77}}
- **three-check:** {"outcomes":{"black":35,"white":59,"stalemate":2},"victories":{"3-check":88,"checkmate":6}}
- **five-check:** {"outcomes":{"white":57,"black":39},"victories":{"5-check":76,"checkmate":20}}
- **center-hold:** {"outcomes":{"white":96},"victories":{"center-hold":96}}
- **mandatory-captures:** {"outcomes":{"stalemate":28,"threefold-repetition":52,"white":12,"black":3,"ply-limit":1},"victories":{"checkmate":15}}
- **home-half-drops:** {"outcomes":{"black":46,"white":37,"threefold-repetition":13},"victories":{"checkmate":83}}

## Exact rules

- **control-delay-1-1:** Four-slot capture bank; overflow returns to captured side; quiet drops. Captures cool one owner turn; returned overflow cools 1 owner turns. Initial reserves ready. Full delay on arrival, ticking only after later owner actions. Normal checkmate objective and unrestricted board range.
- **delay-1-0:** Four-slot capture bank; overflow returns to captured side; quiet drops. Captures cool one owner turn; returned overflow cools 0 owner turns. Initial reserves ready. Full delay on arrival, ticking only after later owner actions. Normal checkmate objective and unrestricted board range.
- **delay-1-2:** Four-slot capture bank; overflow returns to captured side; quiet drops. Captures cool one owner turn; returned overflow cools 2 owner turns. Initial reserves ready. Full delay on arrival, ticking only after later owner actions. Normal checkmate objective and unrestricted board range.
- **sliders-range-2:** Four-slot capture bank; overflow returns to captured side; quiet drops. Captures cool one owner turn; returned overflow cools 1 owner turns. Initial reserves ready. Full delay on arrival, ticking only after later owner actions. Rook and bishop move AND attack range is capped at two squares.
- **three-check:** Four-slot capture bank; overflow returns to captured side; quiet drops. Captures cool one owner turn; returned overflow cools 1 owner turns. Initial reserves ready. Full delay on arrival, ticking only after later owner actions. Win after 3 checking actions; checkmate also wins.
- **five-check:** Four-slot capture bank; overflow returns to captured side; quiet drops. Captures cool one owner turn; returned overflow cools 1 owner turns. Initial reserves ready. Full delay on arrival, ticking only after later owner actions. Win after 5 checking actions; checkmate also wins.
- **center-hold:** Four-slot capture bank; overflow returns to captured side; quiet drops. Captures cool one owner turn; returned overflow cools 1 owner turns. Initial reserves ready. Full delay on arrival, ticking only after later owner actions. Win by holding the same central square with your king through one opponent reply without being in check. A checking reply cancels the claim; checkmate also wins.
- **mandatory-captures:** Four-slot capture bank; overflow returns to captured side; quiet drops. Captures cool one owner turn; returned overflow cools 1 owner turns. Initial reserves ready. Full delay on arrival, ticking only after later owner actions. A king-safe capture is compulsory whenever any exists.
- **home-half-drops:** Four-slot capture bank; overflow returns to captured side; quiet drops. Captures cool one owner turn; returned overflow cools 1 owner turns. Initial reserves ready. Full delay on arrival, ticking only after later owner actions. All drops restricted to own half; board moves unrestricted.

## Replay observations

All 96 center-hold games end after four total plies: two king placements, White's king
entry into the center, and Black's first reply. White wins every one by center hold. This
rule fails the color-balance screen and creates an immediate opening objective in this sample.

The three capture/return-delay recipes have identical outcomes (40/41/15). No actual overflow
return occurs in any of their 288 played games, although banks reach four held pieces. Thus
these games do not establish the effect of overflow readiness when overflow is exercised.
Delay 1/2 matches all 96 control action sequences; delay 1/0 matches 94/96, with two different
played sequences despite identical totals. Do not treat the three rows as independent hits.

Only the control/delay group meets both screening thresholds. Own-half drops is close to
the color boundary (37/83 = 44.58% White share) but fails the prespecified >=45% threshold.
No stronger-search confirmation, new experiments or official adoption follows automatically.
