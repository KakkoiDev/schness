# Deployment variant screening — 2026-10-23

Question: can a development window preserve the tactics of checking drops without the
94.1% White win rate of unrestricted checking drops?

## Presets

All presets retain canonical capture ownership, king safety, repetition, engine profiles,
seed 20260910 and the balanced 80-game schedule (five matchups × 16 king starts).

| ID | Changes |
|---|---|
| canonical | Quiet drops; contemporaneous control. |
| unrestricted | Checking drops; rejected-variant control. |
| protected-recurring | No checking drop against an opponent with only their king on board, including after captures. |
| protected-opening | No checking drop until the opponent first deploys a non-king. Protection never returns. |
| grace | Checking drops begin after both players complete three turns following king placement. |
| quiet-return | Same grace period; each rook, bishop and knight may check on its first deployment only. Return drops stay quiet. |
| setup-white-quiet | Alternate all six non-king drops without check, moves or captures; White starts play; later drops stay quiet. |
| setup-white-checking | Same setup; White starts play; later checking drops allowed. |
| setup-black-quiet | Same setup; Black starts play; later drops stay quiet. |
| setup-black-checking | Same setup; Black starts play; later checking drops allowed. |

A setup with no legal placement is a `setup-blocked` draw. It is reported separately and
automatically prevents promotion. Search chooses setup placements with the same AI as normal
play; no random setup generator or specially tuned setup evaluator is used. This is a test of
these rules **with existing bots**, not a proof about optimal human play.

In Black-first setups Black takes the last placement and the first normal turn. Transcript
entries record actual movers and phases; consumers must not infer mover from ply parity.
Normal-play length excludes both king placement and the six setup placements.

## Execution and screening gate

`Variant research suite` runs unit tests and desktop/mobile browser tests before launching all
ten presets as independent Actions jobs. Each first runs one 80-game set. A candidate expands
automatically to thirteen sets (1,040 games) only if the pilot has:

- at least 16 decisive games;
- White between 40% and 60% of decisive games;
- no blocked setups;
- median normal-play length at least 20 plies;
- at least 40 distinct complete action sequences.

These are operational screening thresholds, not significance tests or proof of viability.
A draw-heavy or borderline pilot may need a separate follow-up even if not promoted. Controls
run only their 80-game pilots; their historical 1,040-game datasets remain available. Full runs
reuse the pilot schedule prefix, so never pool pilot and full as independent samples.

Each preset produces complete rules, seed, AI profiles, transcripts, summary CSV and metrics.
The final job preserves all results in one permanent GitHub Release. Failed jobs retain any
partial output as artifacts. No results or recommendations are claimed until the jobs finish.
