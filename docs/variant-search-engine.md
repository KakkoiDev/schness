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

Strength 0–100 maps monotonically to depth 1–6 and node budget 256–262144. Explicit depth and node
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
change choices; fixed-depth runtime can increase. Current metadata therefore identifies Sharp
v3 and Learning/Steady v2. Historical Sharp v2 datasets keep their original versions and frozen
source. Do not pool engine versions into a balance claim.

Tests cover alternate win/loss objectives, terminal roots, exact node caps, legal fallback,
completed iterative depths, validated strength settings and Schness immutability. Browser worker
requests at phone/desktop widths verify both old depth and new bounded-strength payloads.
For further strength improvement, benchmark tactical correctness and nodes per second, then
head-to-head at matched budgets on fresh openings. Faster code and deeper defaults alone are
not evidence of a stronger engine.
