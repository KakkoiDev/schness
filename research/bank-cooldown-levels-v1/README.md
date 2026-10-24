# Four-slot capture bank / one-turn cooldown: all named AI levels

Follow-up authorized 2026-10-25. One recipe, all nine ordered pairings of Learning v1
(depth 2), Steady v1 (depth 3), Sharp v2 (depth 4). Six fresh seeds 20261501–20261506,
16 king starts per pairing: 864 games, 96 per pairing, capped at 200 total plies.
Equal-level pairings measure color balance; mixed-level games measure strength separation.
Do not pool mixed levels or this fresh batch with the earlier Sharp-only screen.
Numeric strength 0–100 and production Sharp v3 are outside this batch.

Core copied from the completed balance screen's frozen runtime. Rules, bot, profiles and
variant definitions remain byte-identical; tournament schedule expands five ordered
pairings to all nine. No evaluator tuning or new rules. Each run freezes its own runtime.

Quiet drops, three starting non-kings per side, capture transfers ownership up to four
bank slots, overflow returns to captured side, and captured copies wait one owner turn.
Initial reserves are ready. Capture turn does not tick new arrivals; existing reserves
tick after their owner's action. Forced wait only without another legal action and
outside check. Full reserve material valuation is unchanged.

Prepare (does not start):

    node research/bank-cooldown-levels-v1/run.js --output output/local-experiments/bank-cooldown-levels-v1-2026-10-25 --workers 8

Run using the printed frozen runtime resume command. After the runner exits, resume again
to validate sources and every replay. Generate reports with this directory's report.js,
archive with scripts/archive-local-experiments.py, and commit complete compressed bundles,
runtime, manifest, progress, readable reports and checksums to GitHub. No automatic merge.
