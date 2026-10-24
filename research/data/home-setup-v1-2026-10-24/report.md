# Balance-v1 Sharp vs Sharp — completed

192/192 games. Depth 4, 200 total plies including king placement.
Source SHA-256: 2f3ca2210e3bbd758edcb437346b823483b66f8026ab295741e74608f3aa795d

Target: ≥80% decisive games and White winning 45–55% of decisive games. A screening hit is not proof of balance.
Each recipe uses the same 16 king placements across six seeds; seeds repeat openings and are not independent starting positions. Confirm candidates on fresh seeds and deeper search.
Cooling reserves retain full base material value in the heuristic, matching the transfer-bank control; legal mobility reflects readiness.
Only completed recipes should be compared. Draws include repetition, stalemate and the ply ceiling.

| Recipe | Games | White wins | Black wins | Draws | Decisive | White share of decisive | Hit |
|---|---:|---:|---:|---:|---:|---:|---|
| home-setup-checking | 96 | 6 | 2 | 88 | 8.3% | 75.0% | — |
| home-setup-quiet | 96 | 0 | 0 | 96 | 0.0% | — | — |

## Exact rules

- **home-setup-quiet:** Alternate all three reserve placements on each player's king home row, no moves/captures/checking drops during setup. White begins normal play after all six placements. Captures return to owner. Later checking drops forbidden. Blocked placement is a setup-blocked draw.
- **home-setup-checking:** Alternate all three reserve placements on each player's king home row, no moves/captures/checking drops during setup. White begins normal play after all six placements. Captures return to owner. Later checking drops allowed. Blocked placement is a setup-blocked draw.
