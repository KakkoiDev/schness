# Checking drops × capture cooldown

User-authorized 2026-10-25: four-slot capture bank, cooldown 0 or 1, crossed with three
drop policies: quiet, checking including immediate drop-mate, checking without immediate
drop-mate. Six recipes × six fresh seeds 20261701–20261706 × 16 king starts = 576 games.
Research Sharp vs Research Sharp, depth 4, 200 total plies including king placement.

All start with king plus rook/bishop/knight per player. Initial reserves are ready. Captures
transfer ownership up to four bank slots; overflow returns to the captured side. Both
captured and returned pieces use the selected cooldown. New arrivals do not tick on arrival;
existing timers tick after owner actions. No cooldown means usable on the next own turn.

Checking drops may check any king. In unrestricted recipes they can immediately checkmate.
In no-drop-mate recipes a checking drop is forbidden if the checked opponent has no legal
reply under that same ruleset. Normal board moves may checkmate. Legal replies include
king-safe moves, captures and ready drops, including counterchecks subject to the same
drop-mate restriction. Recursive reply validation terminates because each nested checking
drop consumes one reserve without capturing. A cooling piece cannot defend until ready;
forced waiting is unavailable in check. Stalemate and threefold repetition remain draws.

The source fork is isolated from production and prior frozen batches. Bot/search/evaluation
is byte-identical to variant-options-v1; the adapter adds a composable noDropMate rule and
records a new engine identity variant-objective-search-v2. No check-count/center objectives
or progress bonuses are active in this batch. Hashes include the policy and cooldown.
Do not pool with previous Sharp v2/v3, objective-v1 or mixed-level datasets.

Prepare, then execute the printed frozen runtime command:

    node research/drop-policy-cooldown-v1/run.js --output output/local-experiments/drop-policy-cooldown-v1-2026-10-25 --workers 8

After completion and confirming the runner exited, validate with the frozen --resume command,
generate report/rates with report.js, archive complete replay bundles/runtime/manifest using
scripts/archive-local-experiments.py, verify SHA-256 parts and archive hash, and commit all
data plus readable reports/progress and findings to GitHub. No automatic merge or adoption.

Prior datasets already tested quiet/no-cooldown and unrestricted checking/no-cooldown, but
with different seeds and engine snapshots. This fresh matched matrix measures both factors
together. Six seeds repeat 16 starts, so 96 games per recipe are a screen, not independent
position samples or proof of balance. Target >=80% decisive, White 45–55% of decisive games.
