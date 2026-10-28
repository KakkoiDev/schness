# Competitive Schness research — 26 October 2026

Goal requested by the user: remove implicit thinking caps, support a requested depth of
20, and improve Schness until a complete match records at least 51% wins against the
pinned Fairy-Stockfish opponent. This is ongoing research, not an achieved result.

## Engine changes

- Numeric levels 0–100 retain their requested depth and no longer inject a 262,144-node
  budget. Explicit caller time/node budgets remain supported. A cache-size bound limits
  retained memory, not the amount of thinking.
- `analyzeAction(p, {profile:'competitive'})` requests depth 20 with iterative deepening,
  tactical quiescence (captures, checks and evasions), optional late-move reductions,
  king-confinement/exposed-material evaluation, and repetition-safe transpositions.
- Competitive transpositions use the multiset of history extensions relative to the
  fixed root history. Different traversal orders can share entries only when the full
  repetition counts agree. The exact reference profile and its evaluator are preserved.
- Competitive ordering prioritizes captures and checks, then central/safe deployment.
  This ordering was added after the first frozen screen; it is not attributed to r1.
- Iteration telemetry exposes only fully completed depths. Requested depth is measured
  in individual player actions (plies), not pairs of moves. Quiescence can extend a line
  past its nominal depth; reductions can search alternatives less deeply.
- An exact completed winning search can stop early when requested; selective reductions
  disable that proof shortcut. A winning selective score is not a mate certificate.
- The browser worker accepts the competitive profile. Existing app/tournament presets
  retain their reference behavior until the candidate is validated.

These weights and reductions are research choices. No claim of stronger play follows
from adding features; complete games, tactical oracles and holdout schedules decide.

## Validation

The first 347-test full suite passed, including the existing exact minimax/transposition,
small-game exhaustive, legal-generation and restoration checks. New checks cover uncapped
numeric levels, explicit budgets, finished-depth telemetry, repetition-sensitive cached
versus uncached/mutable versus immutable competitive results, color symmetry, all 15
independent mate fixtures, and benchmark freezing/licensed opponent sources.

## Match contract

Opponent: the existing pinned `fairy-stockfish-nnue.wasm@1.1.12`, reported commit
`b2e693ef`, one thread, 16 MiB hash, NNUE off, 100 ms requested per decision. No opponent
settings are weakened relative to the previous 0/192 match. Complete UCI history is
supplied and every played position must have identical legal moves in both engines.

Rules: 4×4, six-slot capture bank, captured pieces change owner, quiet drops, no capture
cooldown. This is the supported common ruleset, **not Classic Schness** or orthodox chess.

Schness can use uncapped time or an explicitly recorded calibration budget. Report actual
milliseconds, candidate color, raw wins/losses/draws, draw reasons and completed depth.
An unequal-time success does not establish equal-time superiority. Never compare nominal
Fairy selective depth with an exhaustive Schness horizon as though they were equivalent.
Concurrent jobs can affect timings; record that contention rather than pooling timings.

Screen on 16 starts with both colors (32 games). A screen crossing 51% is a candidate
for a separately frozen 192-game confirmation, not a reason to stop on a favorable partial
score. The 192 games repeat the 16 starts with six tie seeds; they are not 192 independent
positions and do not prove optimal play, Elo, or superiority on every rule combination.
Hold the source, settings, opponent and entire schedule fixed within each attempt.
Preserve all failed attempts and checkpoints. Report wins divided by **all** games, not
wins among decisive games or score including half draws. At least 98/192 wins meet the
numerical confirmation target; there is no guaranteed termination or guaranteed success.

## Runs started

- `competitive-r1-fairy-screen-2026-10-26`: startup failure, 0 games. Browser/Node fetch
  blocks port 4190 (reserved service). Failure/progress and frozen runtime retained.
- `competitive-r1-fairy-screen02-2026-10-26`: 32-game screen, 1,000 ms Schness versus
  100 ms Fairy, depth request 20, quiescence 4, reductions enabled. Source fingerprint
  `d9f1d05fd8ca8faa2051036fc1a3b324648f25d69c2a4051712c6ebe91f6f67f`.
  Completed result: 11 wins, 19 losses, 2 draws (34.375% raw wins). White 9/6/1;
  Black 2/13/1. The numerical target was missed; no confirmation is attributed to r1.
  This predates the conservative proof-shortcut fix and stronger ordering. Its early
  winning scores are selective, not proofs; actual wins require terminal checkmate.
- `competitive-r2-fairy-uncapped-probe02-2026-10-26`: two-game feasibility probe, depth
  request 20, no node/time cap, quiescence 4, reductions enabled. Source fingerprint
  `5329707cdf29acd13b1859a2f9c11d8dff784f0e68c5c4166c97007d0f3ebdf6`.
  Completed iterations are in run.log. Do not relabel a partial search as depth 20.

- `competitive-r3-fairy-screen-2026-10-26`: queued after r1; stronger ordering and corrected
  proof shortcut, 10,000 ms Schness versus unchanged 100 ms Fairy, fresh tie seed, 32 games.
  Fingerprint `eea7cc1186c818ab49d335c334d1b045fa79f10c756666fa9c16d116e131395c`.
  This intentionally permits 100× the opponent's requested time and is not an equal-time test.
  The queue prepares a fresh-seed 192-game confirmation from that same frozen runtime only
  if the full screen wins >=51%. If the screen/confirmation misses, it requests further
  engine analysis rather than silently changing the runtime or opponent. The uncapped probe
  runs separately; timing results have CPU contention.

Two intermediate prepared directories without runner/progress files were never launched;
they have no game results. Current and frozen runtimes must not be interchanged.

## Commands

Prepare a frozen schedule with `scripts/run-competitive-fairy.js --output RUN` and optional
`--depth 20 --seeds 6 --starts 16 --candidate-millis 10000 --quiescence 4 --port 4193`.
Omit `--candidate-millis` for uncapped time. `--reductions false` disables selective
reductions; `--checks false` restricts quiet quiescence to captures. Every schedule is
both colors. Run `RUN/runtime/scripts/run-competitive-fairy.js --resume RUN` with a local
browser server permitted. Resume verifies source hashes and every existing replay.

Generate readable results with `research/competitive-engine-v1/report.js RUN`.
Archive completed attempts with `scripts/archive-local-experiments.py RUN research/data/NAME`.
Publish every full runtime, replay bundle, checksum and readable report on the research
branch, preserving the opponent source and GPL license. Do not modify older archives.


## Completed r3 and next r4 — 26 October, 12:42 UTC

The r3 screen completed all 32 games: 14 wins, 17 losses, 1 draw; **43.75% raw wins**.
White: 10/5/1, Black: 4/12/0 (wins/losses/draws). The draw reached the 200-action ceiling.
Candidate mean decision time was 9,999.54ms for each color; Fairy means were 96.19ms
against candidate White and 96.24ms against candidate Black. Candidate median completed
depth was 9 for both colors (White range 6–14, Black 7–14). This missed the target and
no r3 confirmation was launched. Full source/replay validation and archive hash checks
passed after the runner and queue exited. Data: research/data/competitive-r3-fairy-screen-2026-10-26.

R4 tests an explicit `reduceQuietDrops:true` option. Late quiet drops can be searched
one ply less initially, just as late quiet board moves already were. An improvement
must be searched again at full depth. Captures, check evasions and moves giving check
retain their existing safeguards. This remains selective: a reduced fail-low can miss
a defense, so scores are not exact minimax/mate proofs. The reference/default behavior
is unchanged and reductions can be disabled. Worker and frozen runner forward the flag;
the campaign queue preserves it in any confirmation schedule.

The fixed-depth-6, quiescence-2 ablation on four saved Black-loss opening positions
used 243,151 versus 518,677 nodes (53% fewer) and all searches completed their requested
horizon. This sample is selected and scores changed; it is evidence of reduced work,
not improved playing strength. Full inputs, source hashes, legal PVs and measurements
are in drop-reduction-ablation.json. All 348 unit tests passed.

Active r4 screen: competitive-r4-fairy-screen-2026-10-26, source fingerprint
`02737370b4a7b2043905f9c2bd973df2117783600bcf1507fe6d7b0107fafa19`.
Same 16 starts, both colors, screen tie seed 20261801 and 10,000ms versus unchanged
100ms Fairy, depth request20, quiescence4 with checks, LMR including quiet drops. The
queue will run competitive-r4-fairy-confirmation-2026-10-26 with six fresh seeds starting
20261901 only after a complete >=51% screen. Source fingerprint must remain identical.
No winning claim is made. The older uncapped r2 probe continues separately; its latest
completed first-move iteration was depth11 at 493,116,169 cumulative nodes. Depth20 has
not completed, and ongoing CPU contention limits timing comparisons.

## 27 October: r4 result and r5 horizon-evasion experiment

R4 completed 9 wins/20 losses/3 repetition draws (28.125% raw wins), White
7/7/2 and Black 2/13/1. Median completed depth10 did not yield a successful
screen. Full verified archive is committed; no confirmation was launched.

R5 adds an explicit `quiescenceEvasionDepth` allowance (0–8, default0). At the
ordinary quiescence boundary a checked position may search all legal evasions
for at most this many additional actions. No stand-pat cutoff is allowed during
that extension; node/time budgets still apply. At the final allowance boundary
static evaluation remains a deliberate finite-horizon approximation. This is
not an exhaustive mate proof or a demonstrated strength improvement.

The generic checked-horizon trap test now chooses the safe line, and an endless
check fixture confirms bounded termination/cancellation. All350 unit tests passed;
focused benchmark/worker/search tests passed after freezing-option edits. In20
selected first detected losing-mate positions from r4, depth4/q2 withoutLMR,
allowance2 used29078 versus26469 nodes, changed8 scores and2 actions, with all
40 analyses complete. Full inputs/PVs/source hashes are in
`horizon-evasion-ablation.json`; selected diagnostics are not a holdout.

R5 screen uses allowance2, q4/checks, existing board-move LMR, quiet-drop reduction
disabled, requested20, 10000ms candidate versus unchanged100ms Fairy,32 games,
same16starts/seed20261801/bothcolors. Frozen fingerprint
`924de3af2687a1964338a946c006f8a0f3fa5fd36f26de6be9e4accb8842002f`.
Confirmation forwards the exact allowance and other flags and runs only after a
complete successful screen. Reference/app defaults remain unchanged. The old
uncapped probe is separate, and concurrentCPU affects timings.

## r5 complete; r6 evaluation-cache experiment

R5 completed13W/15L/4D (40.625% raw wins,46.875% half-draw score), White10/5/1
and Black3/10/3. All four draws were repetition. Median completed depth9;
White range6–13,Black6–20. A few nominal20 searches do not establish exhaustive20
or practical20 on every position. Mean candidate9999.58ms White/9947.22ms Black,
Fairy94.15/97.26ms. No confirmation launched. Full source/replay/archive hashes
verified; archive whole6e5bfd659f0071b184bb09de5e543a5073ba6f66a48431e4f5ac01de7e5a01c7.

Two optional caches were tested, both defaultfalse. `cacheQuiescence` uses a
separate bounded table keyed by exact adapter history plus remaining q and evasion
allowances. Fifteen selected r5 losing positions at depth5/q4/evasion2 withoutLMR
completed with identical scores,122691 versus119202nodes, but600ms versus895ms;
this overhead outweighed savings, so it is OFF in r6.

`cacheEvaluation` requires the adapter to provide an explicitly history-independent
`evaluationKey`. Schness keys the complete rules/board/banks/turn/phase state;
terminal and repetition adjudication still precede evaluation lookup. The cache
is per-search and bounded, and does not reuse game results or search bounds.
Fifteen matched completed diagnostic pairs had identical scores/nodes,106548
versus67689 evaluator calls,570ms versus475ms (~17%less). These selected timings
include CPU contention and are not strength evidence. Full inputs/options/PVs/
source hashes are in `evaluation-cache-ablation.json` and
`quiescence-cache-ablation.json`. All353 unit tests passed, including cached/
uncached equivalence, bounded tables, restoration and explicit key validation.

R6 enables only static-evaluation caching on r5 settings, still10000ms versus
unchanged100ms Fairy,32games/same16starts/seed20261801/bothcolors/requested20.
Fingerprint`ab36feae4b2a2d9ca7442fd26c35b12169eea8af128fd156438cf9adf55b0a14`.
Confirmation forwards exact cache/extension/reduction flags. No promotion or
strength claim until completed evidence; production/reference defaults unchanged.


## JavaScript100ms improvement loop

Rust development is paused at user request. The loop now checks every five minutes and prioritizes JS at explicit100ms versus unchanged Fairy100ms. Work is separated into reserve-aware exchange ordering, staged move selection, history/PV-aware reductions, and reserve/king-threat evaluation. Each needs correctness tests, bounded diagnostics, then frozen paired equal-time strength comparisons; no automatic promotion.

Initial opt-in `stagedMoveSelection` lazily performs the secondary hint/tactical/killer/history ranking, preserving eager adapter base ordering. Nested-search rank storage is private per node. Exact traversal/cancellation tests pass. Fifteen selected fixeddepth5 positions preserve scores/actions/91058nodes in all four ABBA trials: lazy395ms/sort355ms/sort340ms/lazy335ms. This is mixed timing evidence with warmup effects, not a demonstrated gain; no new match is justified yet. Initial development caught generator-length/root-facts errors before successful tests; neither affected frozen experiments. Full inputs/results/source hashes retained in js-staged-moves-ablation.json. Base ordering remains eager; further staged work should avoid that cost rather than claim a complete staged generator.


Staged-group follow-up defers independent adapter base scoring until each hint/tactical/killer/history rank group is consumed, rather than scoring every action first. Nonindependent adapters retain the prior path. All15 selected fixeddepth5 scores/actions/91058nodes match; ABBA388/373/342/326ms remains mixed/warmup-sensitive,notstrength evidence. Corpus in js-staged-groups-ablation.json. No match launched; reserve-aware exchange ordering remains next.


## Reserve-aware exchange ordering, JS experiment

Optional exchangeOrdering estimates material from alternating king-safe captures on the landing square, allowing either side to decline recapture. Captures account for reserve ownership and capacity overflow; drops account for reserve material. It omits drops elsewhere, repetition, and variant extra-turn rights, so it is never pruning/adjudication/proof. Four focused tests cover accounting, pinned recaptures, declining exchanges, drop exposure, restoration and nonselective score equality. All373JS tests pass. Initial suite failures exposed the new frozen dependency and module-decision record; both fixed before launch.

Fifteen selected fixeddepth5 ABBAexchange/eager/eager/exchange pairs all scores match:87883/91058/91058/87883nodes,464/351/360/407ms. Fewer nodes but slower evaluation of ordering; no strength claim. Fullinputs/results/hashdata js-exchange-ordering-ablation.json. A frozen32-game equal100ms screen isolates exchangeOrdering:true with stagedMoveSelection:false, otherwise matching precedingJSbaseline settings/starts/colors/seed20262001. Fingerprint0ba6c42beae72cd74304ff5b6bb8f212688c1d7e62effe5df2c0faab634181be. Complete results required; no partialclaim/promotion.


## Completed JS exchange screen and reduction-guard follow-up

Exchange screen final1W29L2D3.125%raw6.25%halfdraw,W1/14/1B0/15/1,boththreefold. MeanJS99.56/99.50msFairy92.23/91.35ms;requested20completedmedian6W3–9B3–9. BelowprecedingJS2/27/3=6.25%;no promotion/confirmation. Runnerinactivebeforefrozenresumeverifiedallsources/replays. Wholearchive370e982fa928c9ca3b79fdd7ac4db9e433455f9af0badb433cc5c2ea3bef8090,allparts/whole/everyfilebytes32gamesverified. Pairedoutcomesretained.

Addedindependentoptionalguards reducePrincipalVariation:false (nullwindows only) andprotectHistoryMoves:true (killer/historyscore>=depthsquared). Defaultstrue/false preservepriorbehavior. Genericfinitehorizontraptestrecovershiddenmove;actualhistoryprotection/cancellation/restorationtests pass. All376JS tests pass. On15selectedearlylosscases,all60depth6/q4/evasion2 queriescomplete at explicit200000nodes1500ms:nonreduced/baselineLMR/PVguard/historyguard nodes237514/187247/222225/191504,elapsed1013/754/888/770ms. Score differencesfromnonreduced0/6/2/5;historyguards197eligiblereductions. Not universalexactness/strengthproof. Completeinputs/hashes/results js-reduction-guards-ablation.json. A fresh32game100mseach screenisolatesPVguardfalse,exchange/staged/historyguardoff,matchingbaselineotheroptions/start/color/seed. Fingerprint07abac00bf42cf62a1e8ab3f793c485062607f8ceaee5574eab146dffa4c5fe4. No partialclaim. Reserve/kingthreatevaluationstillpending.


## PV-guard result and optional reserve pressure

PVguard-r1 complete2W29L1D=6.25%raw7.8125%halfdraw,White1/14/1Black1/15/0,onlydrawthreefold. MeanJS99.51/99.48msFairy90.47/92.21ms,request20median6W3–9B3–9. Same rawrate asbaseline2/27/3,lowerhalfdrawscore;no improvement/promotion/confirmation. Afterinactivecheckownfrozenresumeverifiedsource/replays;fullarchivewhole9a9746d3f1b657e008ff61bd1b3aedccbbec463a0cbac7d8a0af5be0ad8ca4c1,2parts/whole/everyfilebytes32gamesverified. Pairedoutcomesretained.

Fourthdirection nowoptional reserveThreatEvaluation:false bydefault. It scores the best single legal reserve deployment by newly attacked enemy-king-ring squares (12each),legalcheck40,exposedlandingpenalty12,capped80perside. Existing legal policies enforce checkingdrop/cooldown;this is potential,notforcedmate or variantbalanceclaim. Mobility reuses generated legalsets whenenabled. Testscheckforbiddencheckingdrops,duplicatepieces,noreserve,color symmetry,bounds,restoration andall15independentmatefixtures. All379JS tests pass. Selected15depth5ABBAon/off/off/on:92542/91058/91058/92542nodes,445/346/350/389ms;changedheuristics/slower,notstrength. Fullinputs/results/hashes js-reserve-threats-ablation.json. Frozen32same starts/colors/seed20262001 at100mseach isolatesreserveThreatEvaluation:true,allnewordering/guardsoff. Fingerprint2122691ea504a98efc486f5e91bb27ca7f437d19e0efcc8afa349832d2c25397. Results pending/no partialclaim. Allfourideasimplementedexperimentally;strengthtesting/iteration remainsincomplete.


## Reserve result and remaining isolated screens

Reserve-r1 completed 2W30L0D (6.25% raw), White1/15/0 Black1/15/0. No improvement or confirmation. Full verified archive SHA256 281513eb8dbb72747d7c121793af24d7cf04e03849ec003ad225c383b25b1d29; all parts, file bytes and32 games checked. Paired baseline outcomes retained. History-only and staged-only32-game screens are frozen at equal100ms on identical starts/colors/seed20262001. An operational queue runs them sequentially without tuning or promotion; results pending.


## Completed isolated history and staged screens

History-only:3W28L1D,9.375%raw/10.9375%halfdraw, White1/15/0 Black2/13/1. Baseline White unchanged; Black gained one win. Staged-only:1W29L2D,3.125%raw/6.25%halfdraw, White0/15/1 Black1/14/1. All draws threefold. Equal100ms budgets, same starts/colors/seed. Requested20, completed median6 for both. Small descriptive outcomes do not establish strength; neither reaches confirmation gate. Both inactive before frozen source/replay validation. Full archive SHA256 history644e2f791e2bb4cb915cddf4ee648d353f983b8c0cb10a2de1060a065ee8dcf4; staged b79d6b81a4d1a258000a4648bdd9ead4906b3410ea116e5288300c1e1001da74. Every part/whole/file byte verified; paired outcomes preserved. No promotion. Next inspect early JS losing decisions and bounded search-cost diagnostics.


## Early JS loss and quiescence-cost diagnostics

All55 losses across baseline/history contribute one selected early decision each. Nonreduced depth6 best versus forced depth5 child at100000nodes/500ms completed40pairs;15incomplete excluded. Three comparable gaps >=200, all early bishop deployments, but played depth differs and finite horizons do not isolate a bug. Full inputs/PVs/source hashes in js-early-swings.json.

On those40selected cases, q4withchecks/q4captures-only/q2withchecks all120depth6searches completed. Nodes931524/787211/902026, qnodes765767/600293/704477; ordered elapsed3974/3526/3912ms. Capture-only saves15.5%nodes, changes horizon and may miss quiet-check tactics. Fifteen independent tactical mates and restoration pass,21focused search/benchmark tests pass. No strength claim. Isolated32game equal100ms capture-only q4 screen frozen on baseline starts/colors/seed20262001 with allnewoptionsoff; fingerprint2122691ea504a98efc486f5e91bb27ca7f437d19e0efcc8afa349832d2c25397. Fulldiagnostic script/data retained.


## Capture-only quiescence result

Complete2W29L1D (6.25%raw,7.8125%halfdraw), White1/15/0 Black1/14/1;drawthreefold. ActualJS99.53msboth,Fairy92.25/92.22ms. Request20,completedWhite3/7/10 Black4/7/9 min/median/max. Median depth rose from6to7 yet rawwins didnotimprove. Paired Whiteunchanged,Blackgained1/lost1. No confirmation/promotion. Runnerinactivebeforeownfrozenresumeverifiedallsources/replays. Archivewhole5ae2308b33aaa795e60c71a4bcfe8ff42bdccddc4bce0162aaa63ab5427c8ac2;allparts/whole/everyfilebytes/32bundledgamesverified. Retain fullfailedattempt;do notinterpretdepthaloneasstrength. Next diagnose three early bishop-deployment gaps at matched deeper horizons and profile remainingkey/evaluationcost,with boundedqueries.


## Deeper bishop diagnosis and CPU profile

Three selected deployment gaps were examined at depths6/7/8, nonreduced versus priorLMR/historysettings,500000nodes/1500ms perquery. All36best/forcedsearches completed. BaselineBlack13 nonreduced gaps206/210/82; historyBlack13 gaps302/0/64, playedbishopdrop is optimal atdepth7; historyBlack6 gaps602/587/735, alternative rookdrop15 remains preferred. Atdepth8 historyBlack13 LMRscore-458/bishop2 versus nonreduced-538/king3to2; finitehorizon/selectivity,notuniversalbug/mateproof. Do not blindlydisableLMR or penalizeallbishopdrops. Fullinputs/PVs/hashes in js-bishop-deployment-diagnosis.json.

Bounded CPU sample over40earlylosspositions completed all depth6queries. Top selfsamples advancePosition15.2%,generateLegalActions14.3%,positionKey10.3%,visit7.4%,ordered5.9%; evaluator positionalScore2.1%. Sampling/JIT/GC affect fractions. Fullrawcpuprofile plus summary/source/inputhashes retained. Next exact optimization should target measured transitions/keygeneration and verify all36variantstate/history semantics beforestrengthscreen. No enginechange/newmatch/strengthgain thisdiagnosticturn.


## Exact transition-mask and key-cost follow-up

Mutable search passes its already computed resulting masks to search-only transitions, avoiding duplicate checking-drop board reconstruction. Public calls retain fallback geometry. Primitive-valued normalized frozen rules serialize once in a WeakMap; nested extension values deliberately remain uncached. Bank keys count B/N/R while preserving ordering/capacity semantics and fall back for unknown pieces. All dynamic rights/history remain live.380unit tests and174portable cases passed; all36presets reversible test now exercises suppliedmasktransitions over10000actions and independent legacy snapshots. Nestedextension mutation/bankorder test retained.

Selected40depth6nonreduced ABBA masksonly new3966/old4020/old3984/new3978ms, no cleargain; combined new3924/old4042/old4032/new3882ms, all931524nodes/scores/actions match. Modest~3%timing,notstrength/languagespeedproof. Fullinputs/results/sourcehashes in js-transition-masks-ablation.json and js-key-transition-ablation.json. Isolated baselineoptions equal100ms32screen frozen, source7907d568d228ad8c022baf5c96926a85f54494211ebca71e24235a242f68a9f7. Complete results required; no playingclaim/defaultprofilepromotion.

Complete key/transition screen: 2W28L2D, 6.25% raw wins, 9.375% half-draw score. White0/14/2, Black2/14/0; both draws threefold. JS99.56/99.49ms, Fairy93.03/89.97ms; requested20, completed3/6/9 both colors. No raw-win improvement or confirmation. Runner inactive and own frozen source/replay verification completed. Archive whole996e592cdddeeaa86c488dfa43b5950e84fe9924c7a3ddd5098687ed911f49cb; every part, extracted file and32 bundled games verified.


## Exact direct drop-check geometry

Drop legality now tests resulting enemy attacks directly using added piece and occupancy masks. Existing sliding attacks may be blocked; missing/multiple enemy kings preserve first-king behavior. Multiple own kings retain full simulation. All checking-drop policies and no-drop-mate recursion remain unchanged.381unit tests/174portable cases/all15independentmates and4desktop/mobile worker checks pass. New288594random checks agree with simulated masks, including missing/multiple kings; all36legacy/reversible presets remain covered.

Forty selected depth6 cleanABBA3733/3959/3943/3726ms preserve931524nodes/scores/actions/restoration (~5.6%selectedtiming,notstrength). Initial overlapping-test timing3861/3933/3921/3712 retained separately, not used as clean measurement. Frozen directdrop-r1 equal100ms32game screen source2033d955b79b2e36adc3f58acbdb16f4f6c13cb44e72c172e2dedd73baf7a86b uses identical baseline starts/colors/seed/settings; no results or strength claim yet.

Directdrop-r1 complete2W28L2D (6.25%raw9.375%halfdraw),W1/13/2B1/15/0,boththreefold. JS99.56/99.52ms Fairy92.20/93.32ms;request20 completedW3/6/10 B4/6/9. Paired precedingkeytransition White gained1,Black gained1/lost2;aggregate rawwins unchanged. No confirmation/promotion. Runnerinactivebefore own frozen source/replay validation; allarchive parts/whole/everyfile bytes32games verified. Whole595b7a8518150cf516cd26321dbb563bb9fec4bdb7f6766bbe880d69c24ab46b.


Evaluation decomposition now covers55earlyloss roots/playedchildren plus6depth8PVleaves. Every nonterminal total matches current engine depth0competitive evaluation. In persistent historyBlack6 gap, best leaf board+reserve totals0 versus forced1020 (white-positive); exposed-material term108 versus-261 partly offsets it, giving totals148 versus883. This identifies a finite-horizon material outcome, not proof of miscalibration; do not blindly increase king pressure or bishop penalties. Other gaps have differing material/king/exposure contributions. Search/quiescence scores and static leaves are distinct. Full positions/components/hashes retained in js-evaluation-components.json; no engine changes, tuning or new match. Next compare actual first opponent replies to predicted continuation before choosing an evaluator change.
