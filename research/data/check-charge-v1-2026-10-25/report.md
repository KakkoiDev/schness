# Check-charge-v1 Research Sharp vs Research Sharp — completed

576/576 games. Research objective-search v3, depth 4, 200 total plies including king placement. Do not pool with Sharp v2/v3 datasets.
Source SHA-256: 7f08da9419c99ab6235406e95a2ba73dad5a46d853dfd8350faf45499df56fc6

Target: ≥80% decisive games and White winning 45–55% of decisive games. A screening hit is not proof of balance.
Each recipe uses the same 16 king placements across six seeds; seeds repeat openings and are not independent starting positions. Confirm candidates on fresh seeds and deeper search.
Cooling reserves retain full base material value in the heuristic, matching the transfer-bank control; legal mobility reflects readiness.
Only completed recipes should be compared. Draws include repetition, stalemate and the ply ceiling. Same history-aware search and material/mobility evaluation across six charge-bank recipes; no additional objectives. These are screening results, not solved variants.

| Recipe | Games | White wins | Black wins | Draws | Decisive | White share of decisive | Hit |
|---|---:|---:|---:|---:|---:|---:|---|
| charges-3-delay-1 | 96 | 46 | 46 | 4 | 95.8% | 50.0% | yes |
| charges-2-delay-1 | 96 | 47 | 44 | 5 | 94.8% | 51.6% | yes |
| charges-1-delay-1 | 96 | 29 | 57 | 10 | 89.6% | 33.7% | — |
| charges-3-delay-0 | 96 | 60 | 24 | 12 | 87.5% | 71.4% | — |
| charges-1-delay-0 | 96 | 20 | 63 | 13 | 86.5% | 24.1% | — |
| charges-2-delay-0 | 96 | 63 | 19 | 14 | 85.4% | 76.8% | — |

## Outcomes by reason

- **charges-1-delay-0:** {"outcomes":{"black":63,"threefold-repetition":13,"white":20},"victories":{"checkmate":83},"matingDrops":37,"checkingDrops":564}
- **charges-2-delay-0:** {"outcomes":{"white":63,"threefold-repetition":11,"stalemate":3,"black":19},"victories":{"checkmate":82},"matingDrops":44,"checkingDrops":398}
- **charges-3-delay-0:** {"outcomes":{"white":60,"threefold-repetition":9,"stalemate":3,"black":24},"victories":{"checkmate":84},"matingDrops":48,"checkingDrops":409}
- **charges-1-delay-1:** {"outcomes":{"black":57,"threefold-repetition":10,"white":29},"victories":{"checkmate":86},"matingDrops":31,"checkingDrops":547}
- **charges-2-delay-1:** {"outcomes":{"black":44,"white":47,"threefold-repetition":5},"victories":{"checkmate":91},"matingDrops":57,"checkingDrops":387}
- **charges-3-delay-1:** {"outcomes":{"black":46,"white":46,"threefold-repetition":4},"victories":{"checkmate":92},"matingDrops":58,"checkingDrops":391}

## Exact rules

- **charges-1-delay-0:** Four-slot capture bank, overflow returns to captured side. Capture/return cooldown 0 owner turns. Initial reserves ready. Checking-drop charges start at 0, cap 1; each non-checking-drop own play action restores one. Checking drop spends one with no same-turn recharge. King placement does not charge; board checks cost nothing. Drop-mate allowed when charged. Normal checkmate, stalemate and repetition rules.
- **charges-2-delay-0:** Four-slot capture bank, overflow returns to captured side. Capture/return cooldown 0 owner turns. Initial reserves ready. Checking-drop charges start at 0, cap 2; each non-checking-drop own play action restores one. Checking drop spends one with no same-turn recharge. King placement does not charge; board checks cost nothing. Drop-mate allowed when charged. Normal checkmate, stalemate and repetition rules.
- **charges-3-delay-0:** Four-slot capture bank, overflow returns to captured side. Capture/return cooldown 0 owner turns. Initial reserves ready. Checking-drop charges start at 0, cap 3; each non-checking-drop own play action restores one. Checking drop spends one with no same-turn recharge. King placement does not charge; board checks cost nothing. Drop-mate allowed when charged. Normal checkmate, stalemate and repetition rules.
- **charges-1-delay-1:** Four-slot capture bank, overflow returns to captured side. Capture/return cooldown 1 owner turns. Initial reserves ready. Checking-drop charges start at 0, cap 1; each non-checking-drop own play action restores one. Checking drop spends one with no same-turn recharge. King placement does not charge; board checks cost nothing. Drop-mate allowed when charged. Normal checkmate, stalemate and repetition rules.
- **charges-2-delay-1:** Four-slot capture bank, overflow returns to captured side. Capture/return cooldown 1 owner turns. Initial reserves ready. Checking-drop charges start at 0, cap 2; each non-checking-drop own play action restores one. Checking drop spends one with no same-turn recharge. King placement does not charge; board checks cost nothing. Drop-mate allowed when charged. Normal checkmate, stalemate and repetition rules.
- **charges-3-delay-1:** Four-slot capture bank, overflow returns to captured side. Capture/return cooldown 1 owner turns. Initial reserves ready. Checking-drop charges start at 0, cap 3; each non-checking-drop own play action restores one. Checking drop spends one with no same-turn recharge. King placement does not charge; board checks cost nothing. Drop-mate allowed when charged. Normal checkmate, stalemate and repetition rules.
