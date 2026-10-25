# Variant options v1 — nine controlled recipes

Authorized 2026-10-25: test all seven proposed directions. All recipes inherit four-slot
capture-to-bank, quiet drops, initial R/B/N reserves ready, one owner-turn capture cooldown,
and overflow returned to the captured side. Initial kings use all 16 home-rank combinations.

| Recipe | Single change from control |
|---|---|
| control-delay-1-1 | None: captured and returned overflow copies both wait one owner turn |
| delay-1-0 | Overflow is immediately ready; only stolen pieces cool (two proposals coincide) |
| delay-1-2 | Overflow waits two owner turns; stolen pieces wait one |
| sliders-range-2 | Both rook/bishop movement and attack reach limited to two squares |
| three-check | Delivering three checks wins; checkmate still wins |
| five-check | Delivering five checks wins; checkmate still wins |
| center-hold | King holds the same central square through one opponent reply, then is safe |
| mandatory-captures | Must choose a king-safe capture when one exists |
| home-half-drops | All drops restricted to own half; board moves remain unrestricted |

Each checking action adds one to the mover's count, including discovered/double check once.
Quiet drops still cannot check. Center squares are b2/c2/b3/c3. A claim starts after an own
action leaves the king there safely; a checking reply cancels the claim. It can be renewed
on a later safe own action. A forced wait counts as a reply. Objective wins are adjudicated
immediately before repetition/stalemate checks; normal checkmate also remains a win.
Objective counters/claims/winner and exact rule options are part of position identity.

Timers tick only after later owner actions; new arrivals retain full delay. Forced wait is
allowed only when outside check with no other legal action and a cooling reserve. Mandatory
captures filter only after king safety: an illegal pinned capture never forces an action.
All material remains conserved; ownership changes on captures except overflow returns.

## AI and schedule

864 games: nine recipes × six fresh seeds 20261601–20261606 × 16 starts, Research Sharp vs
Research Sharp depth 4, 200 total plies including king placement, eight workers. The source
fork comes from the completed balance screen but has a new explicit engine identity:
`variant-objective-search-v1`. It uses repetition-history-aware transposition keys across
all recipes, and the same unchanged material/mobility evaluation plus these objective terms:
120 units per check-count difference; center variant adds 60 per king-distance advantage
and 250 per active hold claim. Terminal wins always dominate those bonuses. These weights
are uncalibrated, do not imply optimal play, and are frozen before data collection.

The included control is measured with this same engine. Never pool results with frozen
Sharp v2, production Sharp v3, all-level tests, or numeric strength settings. No tuning
during a run, automatic recipe expansion, official adoption or merge.

## Run and preserve

    node research/variant-options-v1/run.js --output output/local-experiments/variant-options-v1-2026-10-25 --workers 8

Prepare creates an immutable source snapshot and manifest; execute only its printed frozen
runtime resume command. After completion and confirming no active runner, resume again to
verify source hashes and every checkpoint/replay. Generate report/rates with report.js;
archive with scripts/archive-local-experiments.py. Commit compressed full replay bundles,
manifest/runtime, checksums, readable report/rates/progress and findings to GitHub.

Screening target: >=80% decisive games, White winning 45–55% of decisive games. Six seeds
repeat 16 starts; small correlated samples and objective heuristic assumptions limit claims.
Report raw W/B/draw counts, draw reasons, and checkmate versus objective victories. Further
confirmation needs separately specified stronger search/other engines and human play.
