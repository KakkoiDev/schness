# Native Rust engine research — 27 October 2026

The Rust research backend implements rules and search behind the portable protocol. It is not promoted to the browser app. The win-rate goal remains unmet; these results do not demonstrate an improvement over JavaScript.

## Completed equal-budget screens

Pinned Fairy package1.1.12 commitb2e693ef,1thread16MiBhashNNUEoff100ms; candidate100ms, requested20plies/q4/checks/evasion2/LMR, quiet-drop reductions off. Shared4x4six-slot capture bank, quiet drops/no cooldown, not Classic. Same16starts/seed20262001, bothfixedcolors32games each. Native runs alternate colors per start. All played positions have JS/Fairy legal parity and native screens additionally check Rust legal/result parity. Full history is supplied; JS host adjudicates repetition and200actionceiling. IPC included in native actual times. Candidate ties are deterministic; seeds are schedule labels rather than independent native tie randomizations.

| Version | Color | W/L/D | Raw wins | Half-draw score | Candidate mean ms | Fairy mean ms | Completed depth min/median/max | Draw reasons |
|---|---|---|---:|---:|---:|---:|---|---|
| rust-r1 | white | 0/15/1 | 0.000% | 3.125% | 100.80 | 88.18 | 2/4/7 | {'threefold-repetition': 1} |
| rust-r1 | black | 0/16/0 | 0.000% | 0.000% | 100.82 | 88.40 | 2/4/7 | {} |

rust-r1-fairy-screen-2026-10-27: fingerprint `e752618f13a3f8f62fa05485cdd4fb87a42647e16b9b25a4829ee1b171c52e08`, full archive/readables in `research/data/rust-r1-fairy-screen-2026-10-27/`.
| rust-r2 | white | 0/14/2 | 0.000% | 6.250% | 101.01 | 87.20 | 3/4/7 | {'threefold-repetition': 2} |
| rust-r2 | black | 0/16/0 | 0.000% | 0.000% | 100.88 | 89.18 | 3/5/7 | {} |

rust-r2-fairy-screen-2026-10-27: fingerprint `b287e59df454c8812f20b97451724e578e19274a5e526ba219d265504b74602c`, full archive/readables in `research/data/rust-r2-fairy-screen-2026-10-27/`.
| rust-r3 | white | 0/16/0 | 0.000% | 0.000% | 100.81 | 90.73 | 3/5/9 | {} |
| rust-r3 | black | 1/13/2 | 6.250% | 12.500% | 100.38 | 90.98 | 3/5/20 | {'threefold-repetition': 2} |

rust-r3-fairy-screen-2026-10-27: fingerprint `b2b845d474eee586c3fb505883af7be07c3cd149715902f6e859e8c27a7f573d`, full archive/readables in `research/data/rust-r3-fairy-screen-2026-10-27/`.
| js-rust-baseline | white | 1/14/1 | 6.250% | 9.375% | 99.55 | 90.43 | 3/6/9 | {'threefold-repetition': 1} |
| js-rust-baseline | black | 1/13/2 | 6.250% | 12.500% | 99.51 | 92.84 | 4/6/9 | {'threefold-repetition': 2} |

js-rust-baseline-fairy-screen-2026-10-27: fingerprint `5547c6ec0c883abcc1adab491b10f85ee4fa45cdafdcd1bc351a45b51509ea61`, full archive/readables in `research/data/js-rust-baseline-fairy-screen-2026-10-27/`.

Rust r1:0/31/1; r2:0/30/2; r3:1/29/2 (3.125% raw,6.25% half-draw score). JavaScript baseline:2/27/3 (6.25% raw,10.9375% half-draw score). No192-game confirmation launched. One or a few completed nominal20 searches do not establish practical or exhaustive depth20. Selective depths of different engines are not equivalent. A32-game correlated schedule cannot prove a small regression or intrinsic variant/color balance. Strength was tested only on this shared variant, despite correctness coverage across36presets.

## Implementation and validation

Rust r1 is a correctness-first port; r2 removes allocation-heavy attack scans and needless history clones in ordering; r3 uses typed actions and reversible state in the hot path. Common material-policy search does not update unused research counters; it preserves all fields relevant to legality/evaluation/repetition and restores exact private state. Public transitions retain full counters.

366 JavaScript unit tests passed;3 Rust tests cover142frozen rule snapshots,32,000 generated attack queries, and restoration for every legal action in the frozen rule corpus. External verification checked1,555generated rule positions/all36presets,36depth3 exact reference score comparisons,8invalid-request/recovery cases,174portable contract cases. Release build succeeded with locked dependencies; compiler recorded in toolchain.txt. Tests are conformance evidence, not a strength guarantee.

All four runners inactive before frozen resume validation; every replay/source hash validated. All archive part/whole hashes, every archived file byte, and32bundledgames perrun verified. R1 initial socket-permission failure is retained separately; it produced no games, and the identical frozen runtime was resumed with required local access.

The previous uncapped JS probe was stopped by explicit user request after6+hours,0/2games. Partial data/runtime/logs/stop+interruption records preserved in research/data/competitive-r2-user-stopped-2026-10-27. No unfinished game was counted as a loss. Do not restart it.

## Performance diagnostics and limitations

On18selected old-loss positions at fixeddepth5/q4/evasion2 without reductions: allocation cleanup preserved278,421nodes and all scores while elapsed changed8184ms to2531ms(~3.2x). Typed reversible search preserved the same nodes/scores and changed2571ms to1364ms(~1.9x) in a separate paired diagnostic. These selected samples include process IPC and occasional concurrent benchmark contention; they are not strength holdouts. Full inputs are retained in r6-earlier-reduction-ablation.json; full result/binary hashes are in rust-allocation-ablation.json and rust-reversible-ablation.json.

A JavaScript diagnostic completed the same requested-depth cases in900ms/181,166nodes with matching scores; algorithms/order/cache behavior differ, so this is not an isolated language speed comparison. At the r3 freeze, the native prototype lacked JavaScript transposition/evaluation caches, PVS/aspiration, killer/history ordering and repetition-aversion ties. Those fields were inert in that frozen harness. The later parity follow-ups below close those gaps; validation remains required and separately validated before calling the migration equivalent or replacing the app engine. See engine-rust/README.md.

Next work: port bounded repetition-safe search caches and ordering with exhaustive/cancellation/restoration tests, then repeat fixed-budget paired comparisons against JavaScript and pinned Fairy. Do not compensate by silently raising native time, weakening Fairy or pooling successful partial scores. Fresh confirmation required for any strength claim.

## Static evaluation cache follow-up

Ported optional bounded per-search static evaluation caching (default off). Terminal/repetition adjudication precedes lookup; no search bounds/results reused. Five Rust tests pass, including cache capacity/eviction, repetition bypass prevention, sampled cache-on/off score/node/action equivalence and cancellation; external1555positions/36searches/174portable cases also pass. On18selected fixeddepth5/q4/evasion2/noLMR diagnostics, cache off/on preserved every score, action and node count:250026 versus144210 evaluations,105816 hits,1348ms versus1197ms in one ordered run. This is selected timing evidence, not a randomized performance study or win-rate evidence. No new match launched. Full binary hashes/inputs/results in rust-evaluation-cache-ablation.json and bench-rust-evaluation-cache.js. Remaining search feature gaps still require work.

## Root ordering follow-up

Ported completed-iteration root ordering, preserving every root action before Multi-PV truncation. Six Rust tests pass, including cache checks and root-order off/on exact scores and Multi-PV score sets across sampled rule fixtures; external1555positions/36exactsearches/8recovery/174portable cases pass. On18selected depth5 iterative/q4/evasion2/cacheEval/non-LMR diagnostic pairs all final scores match:342976 versus247592 cumulative nodes,1701 versus1069ms in one ordered run. Ties may choose different actions. Data/source/binaryhashes are in rust-root-ordering-ablation.json. This is search-cost evidence on selected inputs, not win-rate evidence; no new match launched.

## Search parity fixes and r4 retest

Closed known native search gaps: same-depth repetition-safe transposition bounds, bounded hints, killer/history ordering, principal-variation search, aspiration windows, root repetition-aversion tie re-search, and exposed-piece ordering penalty. Static cache remains optional; quiescence caching remains off/unimplemented, native ties deterministic. Profile defaults for iterative budgets/proven-win/repetition preference now match JavaScript; this defaults-only adjustment occurred after r4 freeze and does not change its explicit settings. Eight Rust tests,366JS tests,1555generated rule positions,36reference plus36nonreduced competitive score comparisons,8invalid-recovery checks and174portable cases pass. These are sampled correctness checks, not proof of universal parity.

Selected18depth5 iterative/q4/evasion2/noLMR positions: all final scores match oldRust/newRust/JS; nodes342976/125899/125809 and elapsed1690/630/544ms. Timings include IPC and concurrent screen contention, not isolated language superiority. Full inputs/source/binaryhashes rust-search-parity-ablation.json. Native still did not beat JS elapsed time here.

Frozen r4 screen at100ms each,32same starts/colors/seed20262001:2W28L2D=6.25%raw,9.375%halfdraw;White2/13/1,Black0/15/1. Bothdraws threefold. Candidate meanWhite101.46ms/Black101.49ms versusFairy91.25/90.73ms; requested20,completedWhite3/6/11,Black3/6/9. Previous Rustr3 raw3.125%,JavaScriptbaseline6.25% (2/27/3); descriptive small correlated sample does not establish a strength gain or equivalence. Paired outcomes in js-rust-r4-paired.json. No confirmation or app promotion.

Runner inactive before frozen source/replay resume verification; full archive/runtimes/source/binary/GPL/replays andreadables in research/data/rust-r4-fairy-screen-2026-10-27,wholeSHA2560452bb558392243d41c935ae3ce7bae0aae7dc04bd9f540e83b21c107051deeb. Everypart/whole/archivedfile/32gamesverified. No experiment active.

## Canonical key allocation follow-up

Cache immutable rule JSON at parse time and count reserve piece kinds directly when constructing canonical keys. Rule configuration is private/immutable; dynamic rights and repetition remain in the key. EightRust tests and external1555rules/36reference/36competitive/8recovery/174portable cases pass. Eighteen selected nonreduced depth5 positions preserve125899nodes and every score/action versus frozenr4. ABBA repeated trials (new/old/old/new) total558/618/621/558ms, after initial561/620ms; JS initial535ms with125809nodes. No match ran concurrently. Full source/binary hashes, inputs and all repeated outputs in rust-key-allocation-ablation.json. This is a selected diagnostic allocation saving, not win-rate evidence; no new match launched.

## Borrowed mobility follow-up

Reused legal-action visitor for both-color mobility counts, avoiding full configuration/reserve clones and move-vector allocation. NineRust tests pass, including >2000both-color comparisons over frozen fixtures/children and unchangedstate; external1555rules/36reference/36competitive/8recovery/174portable cases pass. Combined key+mobility cleanups versus frozenr4 preserve125899nodes/allscore/action on18selecteddepth5 positions. ABBAnew/old/old/new515/615/616/517ms;initialnew522/old619/JS526ms(no concurrentmatch). Timing is selected diagnostic evidence,not language/strengthproof. Fullinputs/source/binaryhashes/repeatedoutputs rust-mobility-allocation-ablation.json. A fresh r5 equal100ms screen uses identical32starts/colors/seed; no partial strengthclaim.

## Completed r5 allocation screen

Complete32games:1W29L2D=3.125%raw,6.25%halfdraw;White1/14/1,Black0/15/1,boththreefold. Candidate meanWhite101.39/Black101.44ms versusFairy92.60/90.49ms,nominal100each. Requested20;completedWhite3/6/9,Black4/6/11 min/median/max. Previousr4 2/28/2=6.25%,JSbaseline2/27/3=6.25%;no demonstratedstrengthgain,no confirmation. Allocation savings on fixed-depth diagnostics did not translate into better results on this small correlated screen. Pairedr4/r5 outcomes retained separately;do notpoolversions. Runnerinactivebeforefrozenresumesource/replayvalidation;fullruntime/source/binary/GPL/replays/readables archived andallpart/whole/filebytes/32gamesverified. WholeSHA25620510a0d248c788d936f36a78dbd953880451e90506690b93320d497c170da0c. Noactiveexperiment. Nextworkshouldinspect earlier decisive tactical/evaluation differences instead of repeatedly screening allocation-only changes.

## Early-decision analysis after r5

Inspected ALL29losses, selecting the decision before the first qualifying observed score swing within the first12candidate decisions (or the first decision if no swing). Observed swings can reflect changing depth. Frozenr5 binary, nonreduced nominaldepth6/q4/evasion2,MultiPV3 versus forced played move at childdepth5, explicit200000nodes/1500ms perquery. Fifteenpairs completed comparable depths;14pairs are incomplete and their gaps are not compared. Three completed cases show heuristic gaps179/302/684; these are horizon-specific diagnostics,not proven losing moves or strength evidence. Fullinputs/trajectories/PVs/binaryhashes/caps/results rust-r5-early-swings.json.

On ALL15completed selected positions, matched nonreduced/reduced depth6 singlePV pairs all complete: 6scores and1action differ. Black start2 atply7 changes from king0→1 (nonreduced score-376) to bishop5→8 (reduced score-226); forced played action at nonreduced depth6 scores-555. This provides a concrete selective-search regression to investigate,not evidence that removing reductions globally improves play. Other two large-gap played decisions completed nominal7,so the depth6 comparison does not isolate their cause. Original reduction diagnostic summarizer had a protocol-ID collision,failed before publication,and was corrected/rerun;record preserved. No new engine modification or match launched.


Experimental `reducePrincipalVariation: false` restricts late-move reductions to null windows; default true preserves existing behavior. On all15 selected early-loss cases, all30 paired depth6 searches completed: four scores and one action changed. The Black start2 defense now matches the nonreduced depth6 action/score. This selected regression is tested; it does not establish universal equivalence or stronger play. Ten Rust tests and the external conformance batch pass. No new match launched or default promoted. Data: `rust-pv-reduction-ablation.json`.
