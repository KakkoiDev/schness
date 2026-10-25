# Sharp v7 depth four vs frozen Sharp v2 — full shared-preset bench

Status: complete (6912/6912). Source fingerprint: b964f7a4c0cde7738e449eeef1976fc3cad98176608f976483df527b236f3097.

Two separate fixed-color schedules; six seeds and 16 king starts per variant per color.
Both engines search four individual actions, with seeded tie selection and repetition aversion.
No time/node cap, checking extension or late-move reduction. Standard 200-total-ply ceiling.
Both engines use the same legal rules; each saved transition is cross-checked against frozen v2.

| Variant | New engine color | Games | New wins | v2 wins | Draws | New score | Draw reasons |
|---|---|---:|---:|---:|---:|---:|---|
| canonical | white | 96 | 5 | 1 | 90 | 52.1% | threefold-repetition: 90 |
| canonical | black | 96 | 2 | 8 | 86 | 46.9% | threefold-repetition: 82, ply-limit: 4 |
| permanent-loss-quiet | white | 96 | 6 | 0 | 90 | 53.1% | threefold-repetition: 66, ply-limit: 18, stalemate: 6 |
| permanent-loss-quiet | black | 96 | 2 | 2 | 92 | 50.0% | threefold-repetition: 69, ply-limit: 17, stalemate: 6 |
| permanent-loss-checking | white | 96 | 72 | 13 | 11 | 80.7% | threefold-repetition: 9, ply-limit: 2 |
| permanent-loss-checking | black | 96 | 13 | 73 | 10 | 18.8% | threefold-repetition: 8, ply-limit: 2 |
| capture-bank-3-quiet | white | 96 | 43 | 25 | 28 | 59.4% | threefold-repetition: 28 |
| capture-bank-3-quiet | black | 96 | 28 | 46 | 22 | 40.6% | threefold-repetition: 22 |
| capture-bank-3-checking | white | 96 | 88 | 8 | 0 | 91.7% | — |
| capture-bank-3-checking | black | 96 | 9 | 87 | 0 | 9.4% | — |
| capture-bank-4-quiet | white | 96 | 61 | 22 | 13 | 70.3% | threefold-repetition: 13 |
| capture-bank-4-quiet | black | 96 | 32 | 56 | 8 | 37.5% | threefold-repetition: 8 |
| capture-bank-4-checking | white | 96 | 71 | 9 | 16 | 82.3% | threefold-repetition: 16 |
| capture-bank-4-checking | black | 96 | 9 | 74 | 13 | 16.1% | threefold-repetition: 13 |
| capture-bank-5-quiet | white | 96 | 61 | 22 | 13 | 70.3% | threefold-repetition: 13 |
| capture-bank-5-quiet | black | 96 | 33 | 55 | 8 | 38.5% | threefold-repetition: 8 |
| capture-bank-5-checking | white | 96 | 71 | 12 | 13 | 80.7% | threefold-repetition: 13 |
| capture-bank-5-checking | black | 96 | 9 | 74 | 13 | 16.1% | threefold-repetition: 13 |
| capture-bank-6-quiet | white | 96 | 61 | 22 | 13 | 70.3% | threefold-repetition: 13 |
| capture-bank-6-quiet | black | 96 | 33 | 55 | 8 | 38.5% | threefold-repetition: 8 |
| capture-bank-6-checking | white | 96 | 71 | 12 | 13 | 80.7% | threefold-repetition: 13 |
| capture-bank-6-checking | black | 96 | 10 | 74 | 12 | 16.7% | threefold-repetition: 12 |
| home-half-check | white | 96 | 36 | 1 | 59 | 68.2% | threefold-repetition: 59 |
| home-half-check | black | 96 | 3 | 37 | 56 | 32.3% | threefold-repetition: 56 |
| distant-check | white | 96 | 11 | 34 | 51 | 38.0% | threefold-repetition: 51 |
| distant-check | black | 96 | 32 | 10 | 54 | 61.5% | threefold-repetition: 54 |
| supported-check | white | 96 | 82 | 6 | 8 | 89.6% | threefold-repetition: 8 |
| supported-check | black | 96 | 0 | 90 | 6 | 3.1% | threefold-repetition: 6 |
| countercheck-only | white | 96 | 3 | 6 | 87 | 48.4% | threefold-repetition: 87 |
| countercheck-only | black | 96 | 0 | 5 | 91 | 47.4% | threefold-repetition: 91 |
| knight-check | white | 96 | 10 | 12 | 74 | 49.0% | threefold-repetition: 74 |
| knight-check | black | 96 | 16 | 5 | 75 | 55.7% | threefold-repetition: 75 |
| bishop-check | white | 96 | 11 | 13 | 72 | 49.0% | threefold-repetition: 72 |
| bishop-check | black | 96 | 18 | 7 | 71 | 55.7% | threefold-repetition: 69, ply-limit: 2 |
| rook-check | white | 96 | 46 | 0 | 50 | 74.0% | threefold-repetition: 50 |
| rook-check | black | 96 | 1 | 37 | 58 | 31.3% | threefold-repetition: 58 |
| unrestricted | white | 96 | 91 | 5 | 0 | 94.8% | — |
| unrestricted | black | 96 | 6 | 87 | 3 | 7.8% | threefold-repetition: 3 |
| protected-recurring | white | 96 | 24 | 40 | 32 | 41.7% | threefold-repetition: 32 |
| protected-recurring | black | 96 | 40 | 24 | 32 | 58.3% | threefold-repetition: 32 |
| protected-opening | white | 96 | 13 | 50 | 33 | 30.7% | threefold-repetition: 33 |
| protected-opening | black | 96 | 49 | 14 | 33 | 68.2% | threefold-repetition: 33 |
| first-turn-quiet | white | 96 | 60 | 18 | 18 | 71.9% | threefold-repetition: 18 |
| first-turn-quiet | black | 96 | 17 | 56 | 23 | 29.7% | threefold-repetition: 23 |
| protected-first-turn | white | 96 | 38 | 20 | 38 | 59.4% | threefold-repetition: 38 |
| protected-first-turn | black | 96 | 27 | 40 | 29 | 43.2% | threefold-repetition: 29 |
| mutual-one | white | 96 | 57 | 16 | 23 | 71.4% | threefold-repetition: 23 |
| mutual-one | black | 96 | 22 | 56 | 18 | 32.3% | threefold-repetition: 18 |
| mutual-two | white | 96 | 28 | 26 | 42 | 51.0% | threefold-repetition: 42 |
| mutual-two | black | 96 | 24 | 23 | 49 | 50.5% | threefold-repetition: 49 |
| limited-check | white | 96 | 8 | 10 | 78 | 49.0% | threefold-repetition: 77, ply-limit: 1 |
| limited-check | black | 96 | 8 | 11 | 77 | 48.4% | threefold-repetition: 76, ply-limit: 1 |
| cooldown | white | 96 | 36 | 14 | 46 | 61.5% | threefold-repetition: 46 |
| cooldown | black | 96 | 18 | 37 | 41 | 40.1% | threefold-repetition: 41 |
| no-drop-mate | white | 96 | 81 | 8 | 7 | 88.0% | threefold-repetition: 7 |
| no-drop-mate | black | 96 | 9 | 77 | 10 | 14.6% | threefold-repetition: 10 |
| grace | white | 96 | 43 | 12 | 41 | 66.1% | threefold-repetition: 41 |
| grace | black | 96 | 16 | 36 | 44 | 39.6% | threefold-repetition: 44 |
| quiet-return | white | 96 | 7 | 20 | 69 | 43.2% | threefold-repetition: 69 |
| quiet-return | black | 96 | 24 | 6 | 66 | 59.4% | threefold-repetition: 65, ply-limit: 1 |
| setup-white-quiet | white | 96 | 14 | 5 | 77 | 54.7% | threefold-repetition: 77 |
| setup-white-quiet | black | 96 | 7 | 5 | 84 | 51.0% | threefold-repetition: 84 |
| setup-white-checking | white | 96 | 27 | 15 | 54 | 56.3% | threefold-repetition: 54 |
| setup-white-checking | black | 96 | 24 | 19 | 53 | 52.6% | threefold-repetition: 53 |
| setup-black-quiet | white | 96 | 7 | 20 | 69 | 43.2% | threefold-repetition: 68, ply-limit: 1 |
| setup-black-quiet | black | 96 | 29 | 6 | 61 | 62.0% | threefold-repetition: 61 |
| setup-black-checking | white | 96 | 16 | 39 | 41 | 38.0% | threefold-repetition: 41 |
| setup-black-checking | black | 96 | 54 | 16 | 26 | 69.8% | threefold-repetition: 26 |
| hidden-quiet | white | 96 | 13 | 3 | 80 | 55.2% | threefold-repetition: 79, ply-limit: 1 |
| hidden-quiet | black | 96 | 6 | 14 | 76 | 45.8% | threefold-repetition: 76 |
| hidden-checking | white | 96 | 37 | 9 | 50 | 64.6% | threefold-repetition: 50 |
| hidden-checking | black | 96 | 6 | 35 | 55 | 34.9% | threefold-repetition: 55 |

Score counts a win as 1 and a draw as ½. A score of at least 50% is an observed benchmark result, not proof of universal non-inferiority. Seeds repeat the same 16 starts; no Elo or independent-game confidence interval is claimed. Ceiling draws are artificial. Color-specific counts are kept separate; mixed engine games do not measure intrinsic variant color balance.

This covers all 36 shared production presets. Historical custom-army, capture-delay, objective and charge-bank datasets use distinct frozen rules/engine adapters and are not silently relabelled or pooled into this Sharp v2 comparison. Timing is recorded under parallel load and is not an isolated performance benchmark.

## Descriptive suite summary

This sums this fixed 36-preset schedule only; it is not a variant color-balance claim or a pooled result with other engine versions.

| Candidate color | Games | v7 wins | v2 wins | Draws | v7 score | Draw reasons |
|---|---:|---:|---:|---:|---:|---|
| white | 3456 | 1409 | 548 | 1499 | 62.46% | threefold-repetition: 1470, ply-limit: 23, stalemate: 6 |
| black | 3456 | 636 | 1357 | 1463 | 39.57% | threefold-repetition: 1430, ply-limit: 27, stalemate: 6 |

Across this equally weighted preset schedule: 2045 v7 wins, 1905 v2 wins and 2962 draws; v7 score 51.01%.

After both colors, v7 has a positive raw win-minus-loss difference in 23 presets, a negative difference in 11 and a tie in two. Classic totals are 7 v7 wins, 9 v2 wins and 176 draws (49.48%). These small per-preset differences and correlated starts do not prove universal non-inferiority. The result supports a modest descriptive suite advantage, not a claim that every optimization improves every rule set. No new experiments were launched.
