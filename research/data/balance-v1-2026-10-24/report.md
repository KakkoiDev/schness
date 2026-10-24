# Balance-v1 Sharp vs Sharp — completed

4128/4128 games. Depth 4, 200 total plies including king placement.
Source SHA-256: 65ea73a47c22786807eddf4edafd32a9763351214ff2f0990e2ef94418015ba8

Target: ≥80% decisive games and White winning 45–55% of decisive games. A screening hit is not proof of balance.
Each recipe uses the same 16 king placements across six seeds; seeds repeat openings and are not independent starting positions. Confirm candidates on fresh seeds and deeper search.
Cooling reserves retain full base material value in the heuristic, matching the transfer-bank control; legal mobility reflects readiness.
Only completed recipes should be compared. Draws include repetition, stalemate and the ply ceiling.

| Recipe | Games | White wins | Black wins | Draws | Decisive | White share of decisive | Hit |
|---|---:|---:|---:|---:|---:|---:|---|
| bank-4-delay-1 | 96 | 44 | 36 | 16 | 83.3% | 55.0% | yes |
| bank-5-delay-1 | 96 | 44 | 36 | 16 | 83.3% | 55.0% | yes |
| bank-6-delay-1 | 96 | 44 | 36 | 16 | 83.3% | 55.0% | yes |
| bank-4-mirrored-rook | 96 | 93 | 3 | 0 | 100.0% | 96.9% | — |
| bank-4-mirrored-knight | 96 | 95 | 1 | 0 | 100.0% | 99.0% | — |
| bank-4-mirrored-bishop | 96 | 78 | 16 | 2 | 97.9% | 83.0% | — |
| bank-3-delay-2 | 96 | 52 | 37 | 7 | 92.7% | 58.4% | — |
| bank-4-quiet | 96 | 64 | 22 | 10 | 89.6% | 74.4% | — |
| bank-4-delay-2 | 96 | 60 | 26 | 10 | 89.6% | 69.8% | — |
| bank-5-quiet | 96 | 64 | 22 | 10 | 89.6% | 74.4% | — |
| bank-5-delay-2 | 96 | 60 | 26 | 10 | 89.6% | 69.8% | — |
| bank-6-quiet | 96 | 64 | 22 | 10 | 89.6% | 74.4% | — |
| bank-6-delay-2 | 96 | 60 | 26 | 10 | 89.6% | 69.8% | — |
| bank-4-quiet-earlyQuiet | 96 | 64 | 22 | 10 | 89.6% | 74.4% | — |
| bank-5-mutual-2-check-cooldown | 96 | 25 | 60 | 11 | 88.5% | 29.4% | — |
| bank-6-mutual-2-check-cooldown | 96 | 25 | 60 | 11 | 88.5% | 29.4% | — |
| bank-4-quiet-whiteHome | 96 | 52 | 30 | 14 | 85.4% | 63.4% | — |
| bank-4-mutual-2-check-cooldown | 96 | 23 | 58 | 15 | 84.4% | 28.4% | — |
| bank-4-mutual-2 | 96 | 21 | 59 | 16 | 83.3% | 26.3% | — |
| bank-5-mutual-2 | 96 | 20 | 60 | 16 | 83.3% | 25.0% | — |
| bank-6-mutual-2 | 96 | 20 | 60 | 16 | 83.3% | 25.0% | — |
| bank-4-mutual-2-earlyQuiet | 96 | 21 | 59 | 16 | 83.3% | 26.3% | — |
| bank-3-delay-weighted | 96 | 44 | 34 | 18 | 81.3% | 56.4% | — |
| bank-3-mutual-2-check-cooldown | 96 | 24 | 54 | 18 | 81.3% | 30.8% | — |
| bank-4-delay-weighted | 96 | 47 | 31 | 18 | 81.3% | 60.3% | — |
| bank-5-delay-weighted | 96 | 47 | 31 | 18 | 81.3% | 60.3% | — |
| bank-6-delay-weighted | 96 | 47 | 31 | 18 | 81.3% | 60.3% | — |
| bank-4-mutual-2-whiteHome | 96 | 20 | 58 | 18 | 81.3% | 25.6% | — |
| bank-4-mutual-3-whiteHome | 96 | 22 | 53 | 21 | 78.1% | 29.3% | — |
| bank-3-mutual-3-check-cooldown | 96 | 37 | 37 | 22 | 77.1% | 50.0% | — |
| bank-5-mutual-3-check-cooldown | 96 | 41 | 33 | 22 | 77.1% | 55.4% | — |
| bank-6-mutual-3-check-cooldown | 96 | 41 | 33 | 22 | 77.1% | 55.4% | — |
| bank-4-mutual-3 | 96 | 34 | 39 | 23 | 76.0% | 46.6% | — |
| bank-6-mutual-3 | 96 | 42 | 31 | 23 | 76.0% | 57.5% | — |
| bank-4-mutual-3-earlyQuiet | 96 | 34 | 39 | 23 | 76.0% | 46.6% | — |
| bank-3-quiet | 96 | 53 | 18 | 25 | 74.0% | 74.6% | — |
| bank-4-mutual-3-check-cooldown | 96 | 36 | 35 | 25 | 74.0% | 50.7% | — |
| bank-3-mutual-2 | 96 | 19 | 50 | 27 | 71.9% | 27.5% | — |
| bank-3-mutual-3 | 96 | 34 | 35 | 27 | 71.9% | 49.3% | — |
| bank-5-mutual-3 | 96 | 37 | 31 | 28 | 70.8% | 54.4% | — |
| bank-3-delay-1 | 96 | 26 | 40 | 30 | 68.8% | 39.4% | — |
| mutual-two | 96 | 24 | 20 | 52 | 45.8% | 54.5% | — |
| canonical | 96 | 8 | 3 | 85 | 11.5% | 72.7% | — |

## Exact rules

- **canonical:** Canonical quiet drops.
- **mutual-two:** Checking drops unlock permanently after both players have deployed two distinct non-kings.
- **bank-3-quiet:** Capture-to-bank capacity 3; overflow returns to captured owner. Quiet drops only. 
- **bank-3-mutual-2:** Capture-to-bank capacity 3; overflow returns to captured owner. Checking drops unlock once both deploy 2 distinct types. 
- **bank-3-mutual-3:** Capture-to-bank capacity 3; overflow returns to captured owner. Checking drops unlock once both deploy 3 distinct types. 
- **bank-3-delay-1:** Capture-to-bank capacity 3; overflow returns to captured owner. Quiet drops only. New captures cool down 1 owner turns; existing reserve copies tick after own actions; no tick on new arrivals that turn. Forced wait only if no legal move and not in check. 
- **bank-3-delay-2:** Capture-to-bank capacity 3; overflow returns to captured owner. Quiet drops only. New captures cool down 2 owner turns; existing reserve copies tick after own actions; no tick on new arrivals that turn. Forced wait only if no legal move and not in check. 
- **bank-3-delay-weighted:** Capture-to-bank capacity 3; overflow returns to captured owner. Quiet drops only. New captures cool down bishop/knight 3, rook 4 owner turns; existing reserve copies tick after own actions; no tick on new arrivals that turn. Forced wait only if no legal move and not in check. 
- **bank-3-mutual-2-check-cooldown:** Capture-to-bank capacity 3; overflow returns to captured owner. Checking drops unlock once both deploy 2 distinct types. No checking drop immediately after own checking drop. 
- **bank-3-mutual-3-check-cooldown:** Capture-to-bank capacity 3; overflow returns to captured owner. Checking drops unlock once both deploy 3 distinct types. No checking drop immediately after own checking drop. 
- **bank-4-quiet:** Capture-to-bank capacity 4; overflow returns to captured owner. Quiet drops only. 
- **bank-4-mutual-2:** Capture-to-bank capacity 4; overflow returns to captured owner. Checking drops unlock once both deploy 2 distinct types. 
- **bank-4-mutual-3:** Capture-to-bank capacity 4; overflow returns to captured owner. Checking drops unlock once both deploy 3 distinct types. 
- **bank-4-delay-1:** Capture-to-bank capacity 4; overflow returns to captured owner. Quiet drops only. New captures cool down 1 owner turns; existing reserve copies tick after own actions; no tick on new arrivals that turn. Forced wait only if no legal move and not in check. 
- **bank-4-delay-2:** Capture-to-bank capacity 4; overflow returns to captured owner. Quiet drops only. New captures cool down 2 owner turns; existing reserve copies tick after own actions; no tick on new arrivals that turn. Forced wait only if no legal move and not in check. 
- **bank-4-delay-weighted:** Capture-to-bank capacity 4; overflow returns to captured owner. Quiet drops only. New captures cool down bishop/knight 3, rook 4 owner turns; existing reserve copies tick after own actions; no tick on new arrivals that turn. Forced wait only if no legal move and not in check. 
- **bank-4-mutual-2-check-cooldown:** Capture-to-bank capacity 4; overflow returns to captured owner. Checking drops unlock once both deploy 2 distinct types. No checking drop immediately after own checking drop. 
- **bank-4-mutual-3-check-cooldown:** Capture-to-bank capacity 4; overflow returns to captured owner. Checking drops unlock once both deploy 3 distinct types. No checking drop immediately after own checking drop. 
- **bank-5-quiet:** Capture-to-bank capacity 5; overflow returns to captured owner. Quiet drops only. 
- **bank-5-mutual-2:** Capture-to-bank capacity 5; overflow returns to captured owner. Checking drops unlock once both deploy 2 distinct types. 
- **bank-5-mutual-3:** Capture-to-bank capacity 5; overflow returns to captured owner. Checking drops unlock once both deploy 3 distinct types. 
- **bank-5-delay-1:** Capture-to-bank capacity 5; overflow returns to captured owner. Quiet drops only. New captures cool down 1 owner turns; existing reserve copies tick after own actions; no tick on new arrivals that turn. Forced wait only if no legal move and not in check. 
- **bank-5-delay-2:** Capture-to-bank capacity 5; overflow returns to captured owner. Quiet drops only. New captures cool down 2 owner turns; existing reserve copies tick after own actions; no tick on new arrivals that turn. Forced wait only if no legal move and not in check. 
- **bank-5-delay-weighted:** Capture-to-bank capacity 5; overflow returns to captured owner. Quiet drops only. New captures cool down bishop/knight 3, rook 4 owner turns; existing reserve copies tick after own actions; no tick on new arrivals that turn. Forced wait only if no legal move and not in check. 
- **bank-5-mutual-2-check-cooldown:** Capture-to-bank capacity 5; overflow returns to captured owner. Checking drops unlock once both deploy 2 distinct types. No checking drop immediately after own checking drop. 
- **bank-5-mutual-3-check-cooldown:** Capture-to-bank capacity 5; overflow returns to captured owner. Checking drops unlock once both deploy 3 distinct types. No checking drop immediately after own checking drop. 
- **bank-6-quiet:** Capture-to-bank capacity 6; overflow returns to captured owner. Quiet drops only. 
- **bank-6-mutual-2:** Capture-to-bank capacity 6; overflow returns to captured owner. Checking drops unlock once both deploy 2 distinct types. 
- **bank-6-mutual-3:** Capture-to-bank capacity 6; overflow returns to captured owner. Checking drops unlock once both deploy 3 distinct types. 
- **bank-6-delay-1:** Capture-to-bank capacity 6; overflow returns to captured owner. Quiet drops only. New captures cool down 1 owner turns; existing reserve copies tick after own actions; no tick on new arrivals that turn. Forced wait only if no legal move and not in check. 
- **bank-6-delay-2:** Capture-to-bank capacity 6; overflow returns to captured owner. Quiet drops only. New captures cool down 2 owner turns; existing reserve copies tick after own actions; no tick on new arrivals that turn. Forced wait only if no legal move and not in check. 
- **bank-6-delay-weighted:** Capture-to-bank capacity 6; overflow returns to captured owner. Quiet drops only. New captures cool down bishop/knight 3, rook 4 owner turns; existing reserve copies tick after own actions; no tick on new arrivals that turn. Forced wait only if no legal move and not in check. 
- **bank-6-mutual-2-check-cooldown:** Capture-to-bank capacity 6; overflow returns to captured owner. Checking drops unlock once both deploy 2 distinct types. No checking drop immediately after own checking drop. 
- **bank-6-mutual-3-check-cooldown:** Capture-to-bank capacity 6; overflow returns to captured owner. Checking drops unlock once both deploy 3 distinct types. No checking drop immediately after own checking drop. 
- **bank-4-quiet-earlyQuiet:** Capture-to-bank capacity 4; overflow returns to captured owner. Quiet drops only. Neither player can give any check on their first normal turn. 
- **bank-4-quiet-whiteHome:** Capture-to-bank capacity 4; overflow returns to captured owner. Quiet drops only. White first deployment restricted to own half; king moves remain legal. 
- **bank-4-mutual-2-earlyQuiet:** Capture-to-bank capacity 4; overflow returns to captured owner. Checking drops unlock once both deploy 2 distinct types. Neither player can give any check on their first normal turn. 
- **bank-4-mutual-2-whiteHome:** Capture-to-bank capacity 4; overflow returns to captured owner. Checking drops unlock once both deploy 2 distinct types. White first deployment restricted to own half; king moves remain legal. 
- **bank-4-mutual-3-earlyQuiet:** Capture-to-bank capacity 4; overflow returns to captured owner. Checking drops unlock once both deploy 3 distinct types. Neither player can give any check on their first normal turn. 
- **bank-4-mutual-3-whiteHome:** Capture-to-bank capacity 4; overflow returns to captured owner. Checking drops unlock once both deploy 3 distinct types. White first deployment restricted to own half; king moves remain legal. 
- **bank-4-mirrored-rook:** Capture-to-bank capacity 4; overflow returns to captured owner. Quiet drops only. Both must open by dropping a rook; Black mirrors White by 180 degrees, no check on either king. 
- **bank-4-mirrored-bishop:** Capture-to-bank capacity 4; overflow returns to captured owner. Quiet drops only. Both must open by dropping a bishop; Black mirrors White by 180 degrees, no check on either king. 
- **bank-4-mirrored-knight:** Capture-to-bank capacity 4; overflow returns to captured owner. Quiet drops only. Both must open by dropping a knight; Black mirrors White by 180 degrees, no check on either king. 

## Draw reasons

| Recipe | Repetition | Stalemate | Ply ceiling | Other |
|---|---:|---:|---:|---|
| canonical | 85 | 0 | 0 | {} |
| mutual-two | 51 | 0 | 1 | {} |
| bank-3-quiet | 25 | 0 | 0 | {} |
| bank-3-mutual-2 | 27 | 0 | 0 | {} |
| bank-3-mutual-3 | 27 | 0 | 0 | {} |
| bank-3-delay-1 | 25 | 5 | 0 | {} |
| bank-3-delay-2 | 7 | 0 | 0 | {} |
| bank-3-delay-weighted | 17 | 1 | 0 | {} |
| bank-3-mutual-2-check-cooldown | 18 | 0 | 0 | {} |
| bank-3-mutual-3-check-cooldown | 22 | 0 | 0 | {} |
| bank-4-quiet | 10 | 0 | 0 | {} |
| bank-4-mutual-2 | 16 | 0 | 0 | {} |
| bank-4-mutual-3 | 22 | 1 | 0 | {} |
| bank-4-delay-1 | 13 | 3 | 0 | {} |
| bank-4-delay-2 | 10 | 0 | 0 | {} |
| bank-4-delay-weighted | 18 | 0 | 0 | {} |
| bank-4-mutual-2-check-cooldown | 15 | 0 | 0 | {} |
| bank-4-mutual-3-check-cooldown | 25 | 0 | 0 | {} |
| bank-5-quiet | 10 | 0 | 0 | {} |
| bank-5-mutual-2 | 16 | 0 | 0 | {} |
| bank-5-mutual-3 | 27 | 1 | 0 | {} |
| bank-5-delay-1 | 13 | 3 | 0 | {} |
| bank-5-delay-2 | 10 | 0 | 0 | {} |
| bank-5-delay-weighted | 18 | 0 | 0 | {} |
| bank-5-mutual-2-check-cooldown | 11 | 0 | 0 | {} |
| bank-5-mutual-3-check-cooldown | 22 | 0 | 0 | {} |
| bank-6-quiet | 10 | 0 | 0 | {} |
| bank-6-mutual-2 | 16 | 0 | 0 | {} |
| bank-6-mutual-3 | 22 | 1 | 0 | {} |
| bank-6-delay-1 | 13 | 3 | 0 | {} |
| bank-6-delay-2 | 10 | 0 | 0 | {} |
| bank-6-delay-weighted | 18 | 0 | 0 | {} |
| bank-6-mutual-2-check-cooldown | 11 | 0 | 0 | {} |
| bank-6-mutual-3-check-cooldown | 22 | 0 | 0 | {} |
| bank-4-quiet-earlyQuiet | 10 | 0 | 0 | {} |
| bank-4-quiet-whiteHome | 14 | 0 | 0 | {} |
| bank-4-mutual-2-earlyQuiet | 16 | 0 | 0 | {} |
| bank-4-mutual-2-whiteHome | 18 | 0 | 0 | {} |
| bank-4-mutual-3-earlyQuiet | 22 | 1 | 0 | {} |
| bank-4-mutual-3-whiteHome | 21 | 0 | 0 | {} |
| bank-4-mirrored-rook | 0 | 0 | 0 | {} |
| bank-4-mirrored-bishop | 2 | 0 | 0 | {} |
| bank-4-mirrored-knight | 0 | 0 | 0 | {} |
