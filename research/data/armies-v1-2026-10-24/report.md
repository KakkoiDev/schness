# Symmetric armies · Classic Sharp vs Sharp — completed

1488/1488 games. Depth 4, 200 total plies including king placement.
Source SHA-256: e2cffc287a0d235fc9b02f1ca668bbfa4537b1b2ec41b2d99db978741e0c0c04

Target: ≥80% decisive games and White winning 45–55% of decisive games. A screening hit is not proof of balance.
Each recipe uses the same 16 king placements across three seeds; seeds repeat openings and are not independent starting positions. Confirm candidates on fresh seeds and deeper search.
Uses the frozen Sharp v2 Classic evaluation, unchanged. Only army composition changes; each side has the same army and king. Captures return to their current owner and all drops are quiet.
Only completed recipes should be compared. Draws include repetition, stalemate and the ply ceiling.

| Recipe | Games | White wins | Black wins | Draws | Decisive | White share of decisive | Hit |
|---|---:|---:|---:|---:|---:|---:|---|
| army-RRN | 48 | 19 | 4 | 25 | 47.9% | 82.6% | — |
| army-RBBB | 48 | 13 | 8 | 27 | 43.8% | 61.9% | — |
| army-RRBB | 48 | 12 | 6 | 30 | 37.5% | 66.7% | — |
| army-RBB | 48 | 14 | 3 | 31 | 35.4% | 82.4% | — |
| army-RNNN | 48 | 11 | 4 | 33 | 31.3% | 73.3% | — |
| army-RRNN | 48 | 10 | 5 | 33 | 31.3% | 66.7% | — |
| army-NNNN | 48 | 9 | 5 | 34 | 29.2% | 64.3% | — |
| army-RBBN | 48 | 11 | 3 | 34 | 29.2% | 78.6% | — |
| army-RRRB | 48 | 14 | 0 | 34 | 29.2% | 100.0% | — |
| army-RRBN | 48 | 7 | 6 | 35 | 27.1% | 53.8% | — |
| army-RBNN | 48 | 7 | 5 | 36 | 25.0% | 58.3% | — |
| army-RRRN | 48 | 11 | 0 | 37 | 22.9% | 100.0% | — |
| army-RN | 48 | 8 | 0 | 40 | 16.7% | 100.0% | — |
| army-RRB | 48 | 6 | 2 | 40 | 16.7% | 75.0% | — |
| army-RRR | 48 | 7 | 0 | 41 | 14.6% | 100.0% | — |
| army-BNNN | 48 | 6 | 1 | 41 | 14.6% | 85.7% | — |
| army-NNN | 48 | 4 | 1 | 43 | 10.4% | 80.0% | — |
| army-RNN | 48 | 3 | 2 | 43 | 10.4% | 60.0% | — |
| army-RB | 48 | 0 | 4 | 44 | 8.3% | 0.0% | — |
| army-RBN | 48 | 4 | 0 | 44 | 8.3% | 100.0% | — |
| army-RRRR | 48 | 4 | 0 | 44 | 8.3% | 100.0% | — |
| army-BBN | 48 | 1 | 2 | 45 | 6.3% | 33.3% | — |
| army-BNN | 48 | 2 | 0 | 46 | 4.2% | 100.0% | — |
| army-RR | 48 | 1 | 0 | 47 | 2.1% | 100.0% | — |
| army-BBNN | 48 | 1 | 0 | 47 | 2.1% | 100.0% | — |
| army-BBBN | 48 | 1 | 0 | 47 | 2.1% | 100.0% | — |
| army-NN | 48 | 0 | 0 | 48 | 0.0% | — | — |
| army-BN | 48 | 0 | 0 | 48 | 0.0% | — | — |
| army-BB | 48 | 0 | 0 | 48 | 0.0% | — | — |
| army-BBB | 48 | 0 | 0 | 48 | 0.0% | — | — |
| army-BBBB | 48 | 0 | 0 | 48 | 0.0% | — | — |

## Exact rules

- **army-NN:** Classic Schness 4×4, quiet drops, captures return to current owner. Both sides: king plus knight, knight. Starting reserves ready. No new piece movements or victory conditions. Frozen Sharp v2 depth 4.
- **army-BN:** Classic Schness 4×4, quiet drops, captures return to current owner. Both sides: king plus bishop, knight. Starting reserves ready. No new piece movements or victory conditions. Frozen Sharp v2 depth 4.
- **army-BB:** Classic Schness 4×4, quiet drops, captures return to current owner. Both sides: king plus bishop, bishop. Starting reserves ready. No new piece movements or victory conditions. Frozen Sharp v2 depth 4.
- **army-RN:** Classic Schness 4×4, quiet drops, captures return to current owner. Both sides: king plus rook, knight. Starting reserves ready. No new piece movements or victory conditions. Frozen Sharp v2 depth 4.
- **army-RB:** Classic Schness 4×4, quiet drops, captures return to current owner. Both sides: king plus rook, bishop. Starting reserves ready. No new piece movements or victory conditions. Frozen Sharp v2 depth 4.
- **army-RR:** Classic Schness 4×4, quiet drops, captures return to current owner. Both sides: king plus rook, rook. Starting reserves ready. No new piece movements or victory conditions. Frozen Sharp v2 depth 4.
- **army-NNN:** Classic Schness 4×4, quiet drops, captures return to current owner. Both sides: king plus knight, knight, knight. Starting reserves ready. No new piece movements or victory conditions. Frozen Sharp v2 depth 4.
- **army-BNN:** Classic Schness 4×4, quiet drops, captures return to current owner. Both sides: king plus bishop, knight, knight. Starting reserves ready. No new piece movements or victory conditions. Frozen Sharp v2 depth 4.
- **army-BBN:** Classic Schness 4×4, quiet drops, captures return to current owner. Both sides: king plus bishop, bishop, knight. Starting reserves ready. No new piece movements or victory conditions. Frozen Sharp v2 depth 4.
- **army-BBB:** Classic Schness 4×4, quiet drops, captures return to current owner. Both sides: king plus bishop, bishop, bishop. Starting reserves ready. No new piece movements or victory conditions. Frozen Sharp v2 depth 4.
- **army-RNN:** Classic Schness 4×4, quiet drops, captures return to current owner. Both sides: king plus rook, knight, knight. Starting reserves ready. No new piece movements or victory conditions. Frozen Sharp v2 depth 4.
- **army-RBN:** Classic Schness 4×4, quiet drops, captures return to current owner. Both sides: king plus rook, bishop, knight. Starting reserves ready. No new piece movements or victory conditions. Frozen Sharp v2 depth 4.
- **army-RBB:** Classic Schness 4×4, quiet drops, captures return to current owner. Both sides: king plus rook, bishop, bishop. Starting reserves ready. No new piece movements or victory conditions. Frozen Sharp v2 depth 4.
- **army-RRN:** Classic Schness 4×4, quiet drops, captures return to current owner. Both sides: king plus rook, rook, knight. Starting reserves ready. No new piece movements or victory conditions. Frozen Sharp v2 depth 4.
- **army-RRB:** Classic Schness 4×4, quiet drops, captures return to current owner. Both sides: king plus rook, rook, bishop. Starting reserves ready. No new piece movements or victory conditions. Frozen Sharp v2 depth 4.
- **army-RRR:** Classic Schness 4×4, quiet drops, captures return to current owner. Both sides: king plus rook, rook, rook. Starting reserves ready. No new piece movements or victory conditions. Frozen Sharp v2 depth 4.
- **army-NNNN:** Classic Schness 4×4, quiet drops, captures return to current owner. Both sides: king plus knight, knight, knight, knight. Starting reserves ready. No new piece movements or victory conditions. Frozen Sharp v2 depth 4.
- **army-BNNN:** Classic Schness 4×4, quiet drops, captures return to current owner. Both sides: king plus bishop, knight, knight, knight. Starting reserves ready. No new piece movements or victory conditions. Frozen Sharp v2 depth 4.
- **army-BBNN:** Classic Schness 4×4, quiet drops, captures return to current owner. Both sides: king plus bishop, bishop, knight, knight. Starting reserves ready. No new piece movements or victory conditions. Frozen Sharp v2 depth 4.
- **army-BBBN:** Classic Schness 4×4, quiet drops, captures return to current owner. Both sides: king plus bishop, bishop, bishop, knight. Starting reserves ready. No new piece movements or victory conditions. Frozen Sharp v2 depth 4.
- **army-BBBB:** Classic Schness 4×4, quiet drops, captures return to current owner. Both sides: king plus bishop, bishop, bishop, bishop. Starting reserves ready. No new piece movements or victory conditions. Frozen Sharp v2 depth 4.
- **army-RNNN:** Classic Schness 4×4, quiet drops, captures return to current owner. Both sides: king plus rook, knight, knight, knight. Starting reserves ready. No new piece movements or victory conditions. Frozen Sharp v2 depth 4.
- **army-RBNN:** Classic Schness 4×4, quiet drops, captures return to current owner. Both sides: king plus rook, bishop, knight, knight. Starting reserves ready. No new piece movements or victory conditions. Frozen Sharp v2 depth 4.
- **army-RBBN:** Classic Schness 4×4, quiet drops, captures return to current owner. Both sides: king plus rook, bishop, bishop, knight. Starting reserves ready. No new piece movements or victory conditions. Frozen Sharp v2 depth 4.
- **army-RBBB:** Classic Schness 4×4, quiet drops, captures return to current owner. Both sides: king plus rook, bishop, bishop, bishop. Starting reserves ready. No new piece movements or victory conditions. Frozen Sharp v2 depth 4.
- **army-RRNN:** Classic Schness 4×4, quiet drops, captures return to current owner. Both sides: king plus rook, rook, knight, knight. Starting reserves ready. No new piece movements or victory conditions. Frozen Sharp v2 depth 4.
- **army-RRBN:** Classic Schness 4×4, quiet drops, captures return to current owner. Both sides: king plus rook, rook, bishop, knight. Starting reserves ready. No new piece movements or victory conditions. Frozen Sharp v2 depth 4.
- **army-RRBB:** Classic Schness 4×4, quiet drops, captures return to current owner. Both sides: king plus rook, rook, bishop, bishop. Starting reserves ready. No new piece movements or victory conditions. Frozen Sharp v2 depth 4.
- **army-RRRN:** Classic Schness 4×4, quiet drops, captures return to current owner. Both sides: king plus rook, rook, rook, knight. Starting reserves ready. No new piece movements or victory conditions. Frozen Sharp v2 depth 4.
- **army-RRRB:** Classic Schness 4×4, quiet drops, captures return to current owner. Both sides: king plus rook, rook, rook, bishop. Starting reserves ready. No new piece movements or victory conditions. Frozen Sharp v2 depth 4.
- **army-RRRR:** Classic Schness 4×4, quiet drops, captures return to current owner. Both sides: king plus rook, rook, rook, rook. Starting reserves ready. No new piece movements or victory conditions. Frozen Sharp v2 depth 4.

## Draw reasons

| Recipe | Repetition | Stalemate | Ply ceiling | Other |
|---|---:|---:|---:|---|
| army-NN | 48 | 0 | 0 | {} |
| army-BN | 48 | 0 | 0 | {} |
| army-BB | 47 | 0 | 1 | {} |
| army-RN | 40 | 0 | 0 | {} |
| army-RB | 44 | 0 | 0 | {} |
| army-RR | 47 | 0 | 0 | {} |
| army-NNN | 43 | 0 | 0 | {} |
| army-BNN | 46 | 0 | 0 | {} |
| army-BBN | 45 | 0 | 0 | {} |
| army-BBB | 42 | 0 | 6 | {} |
| army-RNN | 43 | 0 | 0 | {} |
| army-RBN | 44 | 0 | 0 | {} |
| army-RBB | 31 | 0 | 0 | {} |
| army-RRN | 24 | 0 | 1 | {} |
| army-RRB | 40 | 0 | 0 | {} |
| army-RRR | 41 | 0 | 0 | {} |
| army-NNNN | 34 | 0 | 0 | {} |
| army-BNNN | 40 | 0 | 1 | {} |
| army-BBNN | 47 | 0 | 0 | {} |
| army-BBBN | 47 | 0 | 0 | {} |
| army-BBBB | 37 | 0 | 11 | {} |
| army-RNNN | 32 | 0 | 1 | {} |
| army-RBNN | 33 | 0 | 3 | {} |
| army-RBBN | 31 | 0 | 3 | {} |
| army-RBBB | 26 | 0 | 1 | {} |
| army-RRNN | 32 | 0 | 1 | {} |
| army-RRBN | 33 | 0 | 2 | {} |
| army-RRBB | 30 | 0 | 0 | {} |
| army-RRRN | 37 | 0 | 0 | {} |
| army-RRRB | 34 | 0 | 0 | {} |
| army-RRRR | 44 | 0 | 0 | {} |
