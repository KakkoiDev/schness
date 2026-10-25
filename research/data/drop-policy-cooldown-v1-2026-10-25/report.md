# Drop-policy/cooldown-v1 Research Sharp vs Research Sharp — completed

576/576 games. Research objective-search v2, depth 4, 200 total plies including king placement. Do not pool with Sharp v2/v3 datasets.
Source SHA-256: 5fb199c5bb2144e3531047f6e9430d15294f6d355627ce8d24d25f4c4710f3d2

Target: ≥80% decisive games and White winning 45–55% of decisive games. A screening hit is not proof of balance.
Each recipe uses the same 16 king placements across six seeds; seeds repeat openings and are not independent starting positions. Confirm candidates on fresh seeds and deeper search.
Cooling reserves retain full base material value in the heuristic, matching the transfer-bank control; legal mobility reflects readiness.
Only completed recipes should be compared. Draws include repetition, stalemate and the ply ceiling. Same history-aware search and material/mobility evaluation across six recipes; no additional objectives. These are screening results, not solved variants.

| Recipe | Games | White wins | Black wins | Draws | Decisive | White share of decisive | Hit |
|---|---:|---:|---:|---:|---:|---:|---|
| quiet-delay-1 | 96 | 43 | 39 | 14 | 85.4% | 52.4% | yes |
| quiet-delay-0 | 96 | 57 | 28 | 11 | 88.5% | 67.1% | — |
| no-drop-mate-delay-0 | 96 | 80 | 2 | 14 | 85.4% | 97.6% | — |
| no-drop-mate-delay-1 | 96 | 74 | 8 | 14 | 85.4% | 90.2% | — |
| checking-delay-1 | 96 | 72 | 8 | 16 | 83.3% | 90.0% | — |
| checking-delay-0 | 96 | 68 | 10 | 18 | 81.3% | 87.2% | — |

## Outcomes by reason

- **quiet-delay-0:** {"outcomes":{"white":57,"black":28,"threefold-repetition":11},"victories":{"checkmate":85},"matingDrops":0,"checkingDrops":0}
- **checking-delay-0:** {"outcomes":{"threefold-repetition":18,"white":68,"black":10},"victories":{"checkmate":78},"matingDrops":26,"checkingDrops":379}
- **no-drop-mate-delay-0:** {"outcomes":{"white":80,"threefold-repetition":14,"black":2},"victories":{"checkmate":82},"matingDrops":0,"checkingDrops":366}
- **quiet-delay-1:** {"outcomes":{"threefold-repetition":10,"white":43,"black":39,"stalemate":4},"victories":{"checkmate":82},"matingDrops":0,"checkingDrops":0}
- **checking-delay-1:** {"outcomes":{"black":8,"white":72,"threefold-repetition":14,"stalemate":2},"victories":{"checkmate":80},"matingDrops":24,"checkingDrops":380}
- **no-drop-mate-delay-1:** {"outcomes":{"white":74,"threefold-repetition":14,"black":8},"victories":{"checkmate":82},"matingDrops":0,"checkingDrops":360}

## Exact rules

- **quiet-delay-0:** Four-slot capture bank; overflow returns to captured side. Captured and returned pieces wait 0 owner turns, excluding arrival turn; initial reserves ready. Drops cannot check. Ordinary checkmate, stalemate and threefold repetition; forced wait only outside check without other legal actions and with cooling reserves.
- **checking-delay-0:** Four-slot capture bank; overflow returns to captured side. Captured and returned pieces wait 0 owner turns, excluding arrival turn; initial reserves ready. Drops may check and immediately checkmate. Ordinary checkmate, stalemate and threefold repetition; forced wait only outside check without other legal actions and with cooling reserves.
- **no-drop-mate-delay-0:** Four-slot capture bank; overflow returns to captured side. Captured and returned pieces wait 0 owner turns, excluding arrival turn; initial reserves ready. Drops may check but may not immediately checkmate; opponent must have a legal reply under this same ruleset. Normal board moves may mate. Ordinary checkmate, stalemate and threefold repetition; forced wait only outside check without other legal actions and with cooling reserves.
- **quiet-delay-1:** Four-slot capture bank; overflow returns to captured side. Captured and returned pieces wait 1 owner turns, excluding arrival turn; initial reserves ready. Drops cannot check. Ordinary checkmate, stalemate and threefold repetition; forced wait only outside check without other legal actions and with cooling reserves.
- **checking-delay-1:** Four-slot capture bank; overflow returns to captured side. Captured and returned pieces wait 1 owner turns, excluding arrival turn; initial reserves ready. Drops may check and immediately checkmate. Ordinary checkmate, stalemate and threefold repetition; forced wait only outside check without other legal actions and with cooling reserves.
- **no-drop-mate-delay-1:** Four-slot capture bank; overflow returns to captured side. Captured and returned pieces wait 1 owner turns, excluding arrival turn; initial reserves ready. Drops may check but may not immediately checkmate; opponent must have a legal reply under this same ruleset. Normal board moves may mate. Ordinary checkmate, stalemate and threefold repetition; forced wait only outside check without other legal actions and with cooling reserves.
