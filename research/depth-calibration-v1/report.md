# Depth calibration: Sharp v7 versus Sharp v2

Serial warmed measurement on 32 saved Classic positions, three repetitions. Each fixed depth is searched directly, with no time/node cap, tactical extension or reduction. Legal actions and all returned continuation lines were replay-checked. These are same-position measurements on this machine, not the earlier eight-game parallel averages.

| Engine | Depth (individual actions) | Mean ms/position, median complete pass |
|---|---:|---:|
| Sharp v2 | 4 | 70.86 |
| New v7 | 4 | 4.58 |
| New v7 | 5 | 24.93 |
| New v7 | 6 | 104.10 |

Fixed depth five is comfortably faster than old depth four; fixed depth six averages about 47% more time on this corpus. There is no integer depth that matches uniformly.

For each position, a second test gave v7 the median measured v2 depth-four time for that position. Mean budget: 70.86 ms; observed time: 71.46 ms including setup and deadline granularity. Requested depth 100 with iterative deepening completed depth five on 23/32 positions and depth six on 9/32, mean 5.281.

Recommendation: use a time budget for comparable responsiveness and retain the last completed depth. If a fixed depth is required, use five for a conservative latency choice, or six while accepting longer think time on some positions. A 70 ms cap is specific to this Classic corpus/machine; it is not a universal setting for all variants or browsers. This calibration does not measure playing strength.

Full raw searches and source fingerprints: results.json.gz; readable metrics: summary.json. Reproduce with node scripts/bench-depth-calibration.js.
