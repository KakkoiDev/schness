# Deployment variant results — 2026-10-23

## Recommendation

**Full quiet setup with White moving first is the strongest candidate for human playtesting.**
It produced 283 White wins, 278 Black wins and 479 draws in 1,040 games. It also produced
1,017 distinct transcripts, compared with 897 in the historical canonical tournament.
It does not fix canonical draw rates: 46.1% versus 46.2%. Keep the default unchanged while testing
whether players enjoy the added setup decisions.

**Recurring lone-king protection is the strongest candidate if the goal is fewer draws**, but
needs further color-balance work. It reduced draws to 20.5% and median normal play to 23 plies,
with Black winning 56.1% of decisive games. Equal-engine games show a larger imbalance:
Sharp–Sharp had 52 White wins, 91 Black wins and 65 draws. Do not promote it to the standard rule.

Quiet return drops are less compelling: the rules require memory of previous deployment, draws
remain at 39.7%, and Sharp–Sharp favors Black 42 wins to 14, with 152 draws.

## Provenance and verification

- [Successful suite run](https://github.com/KakkoiDev/schness/actions/runs/39946077456).
- [Permanent archive](https://github.com/KakkoiDev/schness/releases/tag/research-variants-39946077456).
- Source commit: `aec019f0f59c003c9fb341d4c2c1fc4b2c390863`.
- ZIP SHA-256: `87b10dee4c3a41a017838460e3092ab4f85837c4bc85e71e89d758cd2e80b120`, matching GitHub's release digest.
- 236 unit tests and desktop/mobile browser tests passed in Actions before tournaments began.
- All 3,920 stored game records were replayed through validating engine actions. Every position
  key, recorded mover/phase, final position, result, index and ruleset was checked. No discrepancies.
- Ten 80-game pilots and three 1,040-game expansions completed. The expansions contain their
  pilot schedule prefixes: there are **3,680 distinct scheduled variant/game pairs**, not 3,920
  independent observations. Tables below keep pilot and full runs separate.

All runs use seed 20260910, five balanced AI matchups, all sixteen king starts, the existing
Learning/Steady/Sharp v2 profiles and a 200-total-ply ceiling. Setup uses the same search/evaluation
as normal play. The ceiling includes setup turns, so setup variants have fewer available normal
turns before the cap. Normal-play medians exclude king placement and setup. No setup was blocked
in the observed games; that does not prove every possible setup can finish.

## Ten pilot experiments

Each row contains 80 games. White share is the percentage of **decisive** games won by White.
The gate was specified before results: at least 16 decisive games, White share 40–60%, no blocked
setup, median normal play at least 20 plies and at least 40 distinct transcripts. Controls were
never eligible for automatic expansion.

| Variant | White | Black | Draws | White share | Median normal plies | Expanded |
|---|---:|---:|---:|---:|---:|---|
| canonical | 22 | 16 | 42 | 57.9% | 54 | Control |
| grace | 37 | 23 | 20 | 61.7% | 26.5 | No |
| protected-opening | 25 | 42 | 13 | 37.3% | 27 | No |
| protected-recurring | 27 | 39 | 14 | 40.9% | 27 | Yes |
| quiet-return | 22 | 23 | 35 | 48.9% | 55 | Yes |
| setup-black-checking | 20 | 40 | 20 | 33.3% | 13.5 | No |
| setup-black-quiet | 19 | 29 | 32 | 39.6% | 30 | No |
| setup-white-checking | 33 | 21 | 26 | 61.1% | 21.5 | No |
| setup-white-quiet | 27 | 21 | 32 | 56.2% | 38.5 | Yes |
| unrestricted | 76 | 3 | 1 | 96.2% | 7 | Control |

The annotation-requested comparison is explicit: opening-only protection produced 25 White wins,
42 Black wins and 13 draws; recurring protection produced 27, 39 and 14. Only the recurring rule
passed the pilot gate. Since these are small paired pilots, this does **not** establish that
recurring protection is statistically superior. Opening-only protection was not expanded.

Grace (61.7% White share), setup-white-checking (61.1%) and setup-black-quiet (39.6%) narrowly
missed the gate. They remain plausible follow-ups with new seeds. Black-first checking setup was
more clearly problematic in this screen: 66.7% of decisive games went to Black and median normal
play was 13.5 plies. This result revises the prior hypothesis that full setup with checking drops
would necessarily be the strongest candidate.

## Full experiments and canonical reference

The canonical reference is the historical 1,040-game Sharp v2 tournament, whose profiles, seed,
king-start coverage and schedule match these runs. Lengths below are **normal-play** plies;
canonical's historical 54-total-ply median becomes 52 after excluding its two king placements.

| Variant | White | Black | Draws | Draw rate | White share of decisive | Median normal plies | Distinct transcripts |
|---|---:|---:|---:|---:|---:|---:|---:|
| Historical canonical | 290 | 270 | 480 | 46.2% | 51.8% | 52 | 897 |
| protected-recurring | 363 | 464 | 213 | 20.5% | 43.9% | 23 | 503 |
| quiet-return | 288 | 339 | 413 | 39.7% | 45.9% | 51 | 871 |
| setup-white-quiet | 283 | 278 | 479 | 46.1% | 50.4% | 38 | 1017 |

Transcript diversity includes setup decisions. Higher setup diversity does not by itself prove
more varied middlegames. Games share a deterministic schedule and shallow-search bots; these
figures describe this benchmark and should not be treated as independent human observations.

## Equal-engine color balance

| Full variant | White wins | Black wins | Draws |
|---|---:|---:|---:|
| protected-recurring | 52 | 91 | 65 |
| quiet-return | 14 | 42 | 152 |
| setup-white-quiet | 13 | 18 | 177 |

Setup-white-quiet is balanced overall, but equal-engine games remain extremely draw-heavy:
177/208 (85.1%). Recurring protection improves equal-engine decisiveness but gives Black 91 of
143 decisive games (63.6%). Aggregate color balance alone would hide this issue.

## Checking drops and mating patterns

| Full variant | Checking drops | White / Black checking drops | Games with checking drops | Drop mates | Rook / bishop / knight mates |
|---|---:|---:|---:|---:|---|
| protected-recurring | 8511 | 2662 / 5849 | 1040 | 551 | 498 / 86 / 243 |
| quiet-return | 1198 | 561 / 637 | 806 | 40 | 486 / 29 / 112 |
| setup-white-quiet | 0 | 0 / 0 | 0 | 0 | 428 / 45 / 88 |

Recurring protection still makes checking drops central: all 1,040 games contain one and 551 of
827 mates (66.6%) are immediate checking drops. Black makes 68.7% of all checking drops. That is
consistent with the color imbalance, but this correlation does not prove its causal mechanism.

All sixteen king-start cells were checked. In setup-white-quiet, White wins range from 11 to 23
and Black wins from 11 to 24 per 65-game cell. Recurring protection has substantial start
sensitivity (White 13–36, Black 15–41). Detailed cells and matchup counts are preserved in
[the verified metrics](deployment-variant-results.json).

## Next decision

1. Human-playtest full quiet setup with White moving first; retain canonical as the default.
2. If fewer draws matter most, investigate recurring protection with stronger search and new
   seeds, paying particular attention to Sharp–Sharp's Black advantage.
3. Treat grace and White-first checking setup as borderline pilot candidates, not failures proven
   by 80 games. Confirm them with independent seeds before any final rejection.
4. Keep quiet-return as a research control unless its added memory burden has a clear play benefit.
