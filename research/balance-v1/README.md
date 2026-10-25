# Balance-v1: Sharp vs Sharp screening

Research-only fork of the existing pure rules/search/tournament modules. It is intentionally
outside src/, is not imported by the app, and has no user-facing controls. Baseline controls
are checked against the original engine. Shared files were copied from the local research
checkout on 2026-10-24; every actual batch snapshots and SHA-256 fingerprints its own source.
Do not infer the executed runtime from a Git HEAD alone.

## Target and schedule

Target: at least 80% decisive games, with White winning 45–55% of decisive games.
All games use Sharp v2, depth 4, 200 total plies including king/setup placements.
Six seeds 20261301–20261306 × all 16 king starts = 96 games per recipe. The seeds repeat
starting positions; this is screening, not independent statistical proof of balance.
No mixed AI strengths, time controls, AI training or automatic rule adoption.

The main batch `balance-v1-2026-10-24` freezes **43 recipes / 4,128 games**:
- Classic and mutual-two controls.
- Four capture capacities (3, 4, 5, 6) × quiet/mutual-two/mutual-three checking policy.
- Four capacities × capture delay 1, 2, or weighted bishop/knight 3 and rook 4.
- Four capacities × mutual-two/mutual-three with checking-drop cooldown.
- Bank 4 × quiet/mutual-two/mutual-three with either an early ban on all checks, or White's
  first deployment restricted to its own half.
- Bank 4 quiet × mandatory mirrored rook, bishop, or knight opening pair.

The later supplement `home-setup-v1-2026-10-24` freezes **2 recipes / 192 games**:
Both sides alternate quiet placements of their rook, bishop and knight on their own king home
row, with no moves/captures during setup. White starts normal play after all reserves deploy.
Test checking drops forbidden versus allowed after setup, with normal return-to-owner captures.
A greedy blocked setup is recorded as setup-blocked, never silently resampled. It counts against
decisiveness. Unlike hidden setup, these are visible alternating AI-selected placements.
This supplement was requested after the main batch started; do not rewrite the main manifest.

## Precise semantics

Capture-bank capacity counts all held pieces, including cooling copies. Overflow returns to
captured owner, and also receives the selected delay. Initial pieces are ready. A newly captured
piece receives its full delay; it is not ticked on that capture turn. Existing held timers tick
at the end of their owner's completed turn only. A ready copy is selected before ticking when
multiple copies exist. Duplicate ready copies do not multiply legal actions. Timers are hashed
with their piece types, so swapping indistinguishable bank order preserves identity.

A player outside check with no legal move/drop and a cooling reserve must Wait, consuming a
ply and ticking timers. No voluntary wait, and no waiting out checkmate. The transcript records
Wait as `--`. Full material value is retained for cooling reserves in search, matching the
capture-bank control; legal mobility reflects readiness. Test a different readiness valuation
only as a separately versioned engine experiment.

Mutual thresholds count distinct types deployed over the game, not simultaneous board count.
Checking cooldown forbids a checking drop immediately after your own checking drop. Early quiet
forbids any check on each player's first normal turn. White-home restricts White's first drop,
even if White first makes king moves. The mirrored opening pair consumes each player's first
normal turn; Black must place the same type at White's square rotated 180 degrees. White's legal
choices guarantee the pair can complete without checking either king. Normal play then starts
with White. These definitions are included in each manifest.

## Commands

Prepare (does not run):

    node research/balance-v1/run.js --output output/local-experiments/NEW-NAME --workers 8

Run or resume using the frozen script path printed by prepare. Do not resume using the mutable
research script. To prepare only the home-row supplement, pass:

    --variants home-setup-quiet,home-setup-checking

Report and archive after completion:

    node research/balance-v1/report.js output/local-experiments/RUN
    python3 scripts/archive-local-experiments.py output/local-experiments/RUN research/data/RUN

The archive contains manifest, progress, frozen runtime, per-seed replay bundles and reports.
The JSONL bundles contain all per-game data; individual JSON checkpoints are deliberately not
duplicated. Verify archive.json part hashes, concatenate parts in numeric order, verify the
whole archive SHA-256, then extract. Parts are capped at 1 MiB for GitHub connector uploads.
Archive compressed replay data in Git, not only a summary or an expiring CI artifact.
The 32-game max-four-ply smoke archive tests execution only; it is not balance evidence.

Follow-up: screen hits need fresh seeds, more repetitions and deeper search. Do not pool these
results with the previous 36-preset batch, whose engine snapshots and schedules differ.
