# AI tournament report — checking-drops variant

Date: 2026-10-23  
Games: 1,040  
Variant run: [GitHub Actions 39895779482](https://github.com/KakkoiDev/schness/actions/runs/39895779482)  
Permanent data: [Tournament 3](https://github.com/KakkoiDev/schness/releases/tag/tournament-run-3)  
Canonical control: [Sharp v2 tournament report](tournament-report-2026-09-11-sharp-v2.md)

## Executive conclusion

**Reject checking drops as the default Schness rule.** The variant is dramatically more decisive,
but for the wrong reason: it gives White an overwhelming first-move initiative. White won 979 of
1,040 games (94.1%), including 197 of 208 Sharp–Sharp games. Bot strength stopped predicting the
winner: Steady as White beat Sharp as Black 204 times, while Sharp as White beat Steady as Black in
all 208 games.

Formal draws nearly disappeared (46.2% to 1.3%) and median length fell from 54 to 9 plies. That is
not evidence of richer play. The variant produced only 359 distinct complete action sequences,
versus 897 under the canonical rule. Every game contained a checking drop; White gave one on ply 3
in all 1,040 games and another on ply 5 in all 1,040. The rule creates a forcing tempo chain before
Black can deploy normally.

Keep canonical quiet drops. If checking drops are studied again, the follow-up must compensate the
second player before another full tournament—for example, forbid checking drops until both players
have completed one non-king deployment, or give Black a setup resource. This dataset is useful as a
rejected-variant control, not as a candidate ruleset.

## Artifact verification

The single workflow artifact `schness-tournament-3` downloaded with SHA-256
`7a0648af747b8c32079711147914de8564a8edb683232c301a148f5f993bc90d`, matching GitHub's digest.
It contains `manifest.json`, `summary.csv`, `games.jsonl`, and `ANALYZE.md`.

The schema-3 manifest declares exactly 1,040 games and `ruleset.allowCheckingDrops: true`. Its rule
text explicitly says, “A drop may give check, just like a normal move.” All 1,040 game records also
carry the true flag, contiguous indexes 0–1,039, exact engine profiles, starting kings, results, and
complete transcripts. The permanent release ZIP is linked above.

The comparison is controlled where valid: both runs use 13 complete 80-game sets, the same five
matchups, king-start coverage, seed, Sharp v2, and Learning/Steady profiles. The rules differ, so
position keys and individual evaluations are intentionally not compared as interchangeable states.

## Rules and engines

The experimental rules match canonical Schness except that a reserve drop may immediately give
check. Captures still return non-kings to their original owner's reserve; normal king safety,
checkmate, stalemate, and threefold repetition apply; unresolved games stop at 200 plies.

- **Learning v1:** depth 2, seeded random choice among equally scored moves.
- **Steady v1:** depth 3, seeded random choice among equally scored moves.
- **Sharp v2:** depth 4, repetition-aware choice among equally scored moves.

## Overall comparison

| Outcome | Canonical Sharp v2 | Checking drops | Change |
|---|---:|---:|---:|
| White wins | 290 (27.9%) | 979 (94.1%) | +689 |
| Black wins | 270 (26.0%) | 47 (4.5%) | -223 |
| Threefold draws | 430 (41.3%) | 13 (1.3%) | -417 |
| Ply-limit draws | 50 (4.8%) | 1 (0.1%) | -49 |
| All draws | 480 (46.2%) | 14 (1.3%) | -466 |
| Decisive games | 560 (53.8%) | 1,026 (98.7%) | +466 |
| Mean length | 69.19 plies | 14.99 plies | -54.20 |
| Median length | 54 plies | 9 plies | -45 |
| Distinct action sequences | 897 | 359 | -538 |

The paired schedule reinforces the result: 399 canonical repetitions, 240 canonical Black wins,
and all 50 canonical ply-limit draws became White wins. Only 22 canonical Black wins remained Black
wins. The variant is less repetitive by termination reason, but much more convergent in actual play.

## Bot-strength-specific results

| White–Black | White wins | Black wins | Draws | Sharp's score |
|---|---:|---:|---:|---:|
| Sharp–Sharp | 197 | 10 | 1 | — |
| Sharp–Steady | 208 | 0 | 0 | 100.0% |
| Steady–Sharp | 204 | 0 | 4 | 1.0% |
| Sharp–Learning | 208 | 0 | 0 | 100.0% |
| Learning–Sharp | 162 | 37 | 9 | 20.0% |

Canonical Sharp scored 78.5% against lower levels across both colors. Under checking drops, its
White-side score became perfect, but as Black it fell to 20.0% against Learning and 1.0% against
Steady. Color overwhelms search depth, so the variant is not a meaningful strength benchmark.

## Color and king starts

White won 95.4% of decisive games. Sharp–Sharp, the cleanest equal-engine control, was even more
extreme: White won 94.7% of all games, Black 4.8%, with one draw. Canonical Sharp–Sharp was 7.2%
White wins, 5.3% Black wins, and 87.5% draws.

No king start repaired the imbalance. Across the 16 pairings, White won between 56 and 65 of each
65-game cell (86.2%–100%). Aggregated White wins by White king start were a1 243/260, b1 249/260,
c1 247/260, and d1 240/260. Black's best aggregate home square was a4, yet Black still won only
17/260 games there.

## Checking-drop frequency

- 4,144 checking drops: 3.98 per game.
- All 1,040 games contained at least one.
- White made 3,822 (92.2%); Black made 322 (7.8%).
- Every game began White's normal play with a checking drop on ply 3, and every game had another
  White checking drop on ply 5.
- By piece: bishop 1,416; rook 1,408; knight 1,320.
- 184 checking drops were immediate checkmates: bishop 88, rook 81, knight 15.

This is the core mechanism. White can deploy with tempo immediately after king placement, and the
forced reply prevents Black from developing comparable threats.

## Mating patterns

| Mating piece | Canonical | Checking drops |
|---|---:|---:|
| Rook | 437 (78.0%) | 847 (82.6%) |
| Bishop | 39 (7.0%) | 90 (8.8%) |
| Knight | 84 (15.0%) | 89 (8.7%) |

Rooks remain the main finisher. Checking-drop mates account for 184 of 1,026 checkmates (17.9%),
but the rule's larger effect is tempo: even when the final move is ordinary, the opening chain of
checking deployments created the winning attack.

## Decision

**Reject for standard play.** The experiment answers the viability question clearly: checking drops
make games shorter and formally decisive, but also severely unbalanced, less varied, and less useful
for comparing AI strength. Preserve the implementation only as an explicit research ruleset and
keep it out of public matchmaking and canonical datasets.

Any follow-up should be a smaller screening experiment with a second-player compensation rule. It
should advance to 1,040 games only if an 80-game pilot holds White below 60% of decisive games and
does not collapse median length or transcript diversity.
