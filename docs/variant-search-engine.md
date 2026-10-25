# Variant-aware search engine

The pure `src/search.js` module owns two-player zero-sum alpha-beta search. It knows no board
size, chess pieces, drops, kings or win condition. `src/bot.js` supplies the Schness adapter.
This is an extensibility and correctness change; playing strength has not been demonstrated
to improve. The ongoing balance and army experiments use their original frozen Sharp v2 code.

## Adapter contract

`createSearchEngine(adapter)` accepts:

- `actions(position)`: all legal actions. Include compound-turn/wait states if the rules use them.
- `apply(position, action)`: immutable next state, including variant rights and repetition.
- `turn(position)`: identity of the player choosing at this state. Consecutive same-player states
  are supported; only the two-player zero-sum assumption is built into minimax.
- `terminal(position, perspective, remainingDepth)`: null if unfinished, otherwise a numeric
  score from that player's perspective. Adjudicate every no-action state explicitly. Wins should
  dominate heuristic values. Each variant decides what constitutes a win, loss or draw.
- `evaluate(position, perspective)`: nonterminal positional value. It must reflect the actual
  objective: a check-counting variant needs progress toward its check target, for example.
- `key(position)`: full search identity. Include every fact affecting legality, evaluation and
  terminal results, including repetition history when that can change outcomes.
- Optional `order(position, actions)` for move ordering and `repetitions(position)` for tie breaks.

Alternative objectives can replace terminal/evaluation callbacks without editing the search.
The engine does not invent movement rules or automatically learn a new objective. New pieces
still require rules, attack generation, notation/UI assets and meaningful evaluation.

## Strength and budgets

Existing `chooseAction(position, {depth: 4})` continues to work. `analyzeAction` returns the action,
score, visited nodes, completed depth and whether the search stopped at a budget. For example:

    analyzeAction(position, {strength: 40, maxNodes: 10000})

Integer level (`strength`) 0–100 maps directly to requested depth 0–100 with a default safety budget of 262144 nodes. Level 0 selects a legal ordered action without evaluating successors. One depth unit is one action by either player, including extra turns. Explicit depth and node
options override the mapped values. Strength is not Elo, and different variants have different
branching factors. Use fixed node budgets for reproducible research. Optional maxMillis is a
wall-clock responsiveness cap, unsuitable as the sole budget for comparisons across machines.
The move worker accepts these same options; existing UI difficulty presets still select their
usual fixed depths. This does not add a new strength slider to settings.

Bounded search uses iterative deepening and returns the last fully completed depth. If the
budget expires before any depth completes, return a legal fallback and report completedDepth=0
and score=null. Never label a partially searched root as a completed result. Node counts are
bounded, but a single rules callback can itself be expensive; wall-clock caps cannot interrupt
synchronous callbacks mid-call. Random tie-breaking remains seedable.

## Correctness and versioning

The Schness adapter's transposition key includes the whole repetition map, not only the board.
Two identical boards can have different future draw outcomes. This may reduce cache hits and
change choices; fixed-depth runtime can increase. Current preset metadata identifies Sharp
v4 and Learning/Steady v3. Historical Sharp v2 datasets keep their original versions and frozen
source. Do not pool engine versions into a balance claim.

Tests cover alternate win/loss objectives, terminal roots, exact node caps, legal fallback,
completed iterative depths, validated strength settings and Schness immutability. Browser worker
requests at phone/desktop widths verify both old depth and new bounded-strength payloads.
For further strength improvement, benchmark tactical correctness and nodes per second, then
head-to-head at matched budgets on fresh openings. Faster code and deeper defaults alone are
not evidence of a stronger engine.

## General game contract and analysis

The shared engine targets deterministic, two-player, zero-sum games with perfect information.
It does not assume a grid, chess, alternating turns or a particular player identity. Stochastic,
hidden-information, simultaneous-action and multiplayer games need different search support.
Adapters must be pure, provide complete state identities, and adjudicate all terminal states.
Search can explore a new objective immediately, but good heuristic weights require calibration.

`choose` also returns `pv` (the chosen continuation) and `variations`; `multiPv: 3` requests up to
three ranked root alternatives. Scores share the root player's perspective. Only completed
iterations are exposed; a budget fallback has no evaluated continuation. These are predicted
best-play lines, not an enumeration of all possible futures or a proof of optimal play.

Optional `noisyActions(position, legalActions)` and `inDanger(position)` enable bounded tactical
extensions with `quiescenceDepth: 1..8`. Danger searches every legal reply instead of allowing a
static stand-pat score. Extensions share the normal node/time budget, stop at their explicit
limit and never alter legal rules. At the extension limit even a dangerous state is evaluated
statically. Defaults remain zero; Schness supplies capture and check callbacks but does not yet
turn extensions on in its production profiles. No new strength version or Elo claim is made.

Regression coverage includes a separate take-away game, altered victory objectives, extra turns,
a tactical horizon trap, forced quiet evasions, legal ranked continuations, cached/uncached
agreement and exact budget accounting. Tic-tac-toe is checked against an independent exhaustive
minimax oracle on all 5,478 reachable positions.

The worker keeps its existing `{action, request}` response. Send `analyze: true` to also receive
`analysis`, including requested/completed depth, budget status and ranked continuations. It accepts
`multiPv` and `quiescenceDepth`; invalid options return an error with the original request ID.


## Efficient play search

Single-line search (`multiPv: 1`) shares alpha across root alternatives; multi-line analysis retains
exact alternative scores. Ambiguous bound-equalities are fully re-searched before randomized or
repetition tie selection. `actionKey(action)` is an optional adapter callback for cached move
ordering; otherwise JSON action identity is used. Supply a stable key for non-JSON actions.

Terminal callbacks receive an optional fourth argument `facts`; evaluation receives it as a third
argument. `facts.actions()` lazily supplies and reuses this node's legal action list. Treat it as
read-only. Existing adapters with fewer parameters remain compatible. The default adapter path uses immutable positions and transitions. Optional reversible
adapters follow the ownership and undo contract below.

Score bounds are cached only at equal remaining depth, while best-action hints can order later
iterations at other depths. Each table defaults to 50,000 entries, configurable with
`maxTableEntries`; `useCache: false` disables both. Completed results expose `stats` counters.
See [the measured optimization report](search-performance-report-2026-10-25.md).

## Reversible adapters and exact search accelerators

An adapter may supply `make(position, action)` and `unmake(position, undo)` together. Search
clones the root once with `structuredClone`, or calls optional `prepare(position, options)` to
obtain an owned working state. `prepare` must not return the caller's mutable state. The action
must be legal for the current state. `make` must either succeed completely or leave it unchanged
on error. Every successful make is paired with unmake in `finally`, including budget exhaustion,
PVS re-searches and adapter failures. Undo must restore all board, bank, rule-right and history
state. Callbacks cannot retain references to mutable positions or mutate cached action arrays.
`useMutable: false` selects the original immutable path for comparisons.

Schness keeps a private working position and updates material, piece masks and the current
position key. Repetition counts are updated and undone in place. Bounded path interning assigns
unique IDs to ordered extensions of the exact root history; it uses no probabilistic hash and
never merges different histories. It may miss equivalent histories reached in a different order.
`hintKey(position)` may omit history because it is used only for best-move ordering; score keys
must still distinguish history. Neither cache is shared between searches.

`scoreStep` declares the exact score lattice (Schness uses integer scores and step 1). It enables
principal variation search and aspiration windows on iterative single-line play. Do not declare
it for arbitrary fractional evaluations. `principalVariation: false` and `aspiration: false`
disable these independently. Aspiration failures widen the window and eventually re-search a
full window; incomplete retries never replace the last completed result. Multi-PV bypasses
aspiration windows so alternative root scores stay exact. `aspirationWindow` defaults to 50.

Optional `isTactical(position, action)` identifies captures to prioritize ahead of quiet killer
and history moves. `useHistory: false` disables those learned ordering hints. The bounded history
table affects move order only. No branch is discarded merely for looking unpromising. Diagnostics
add `pvsResearches`, `aspirationResearches` and `historyHits`.

Production profiles now identify Sharp v5 and Learning/Steady v4. Quiescence stays opt-in; old
frozen research runtimes and datasets are unchanged. See the performance-v3 report for measurements.
