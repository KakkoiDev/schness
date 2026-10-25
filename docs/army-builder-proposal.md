# Schness Lab: boards, pieces and custom armies

Proposal — 2026-10-24. These are starting design values, not measured balance claims.

## Product shape

Keep **Classic Schness** as the fixed 4×4 game. Add **Schness Lab** with a board size from
4×4 through 10×10, a rules preset, a piece pool, and an equal army budget. Players can build
different armies under the same constraints. Random Lab chooses a complete validated recipe,
reveals it before play, and saves its seed. It never silently combines incompatible rules.

Three paths: Quick presets, Build an army, and Random Lab. A challenge shows the board, rules,
budget, duplicate limit and allowed pieces before the opponent accepts. Public rated play
should use a curated shared recipe; open-ended custom armies belong to casual challenges first.

## Boards and suggested budgets

| Board | Points per side | Maximum non-king army | Initial role |
|---|---:|---:|---|
| 4×4 | 11 | 3 | Existing rook/bishop/knight army; Classic control |
| 5×5 | 16 | 5 | Compact custom-army pilot |
| 6×6 | 24 | 7 | Main army-builder candidate; two queens possible |
| 7×7 | 32 | 9 | Experimental |
| 8×8 | 40 | 12 | Larger tactical sandbox |
| 9×9 | 48 | 14 | Experimental |
| 10×10 | 56 | 16 | Large-board sandbox; requires separate AI/performance validation |

A king is mandatory, free, and unique. The cap includes all owned non-kings, whether on board or
in reserve. Unspent points are allowed and award no score. Both players have identical budgets
and limits. Allow at most two copies of a non-king type initially. Budget and count caps are
both enforced. All listed budgets are hypotheses; do not imply equivalent balance across sizes.

## Piece catalogue and initial prices

| Piece | Movement | Initial points | Suggested default pool |
|---|---|---:|---|
| Rook | Any distance orthogonally | 5 | All sizes |
| Bishop | Any distance diagonally | 3 | All sizes |
| Knight | Jump (1,2) | 3 | All sizes |
| Queen | Rook + bishop | 9 | 5×5 and larger |
| Archbishop | Bishop + knight | 7 | 6×6 and larger |
| Chancellor | Rook + knight | 8 | 6×6 and larger |
| Camel | Jump (1,3) | 3 | 6×6 and larger |
| Amazon | Queen + knight | 12 | Optional high-power pool; 6×6 and larger |

The king moves one square in any direction and retains ordinary king-safety rules. No pawns,
castling, en passant or promotion in the first version: each would add another independent rule
system. Sandbox may override size suggestions, with the full recipe explicit.

Use distinctive silhouettes and a movement preview for fairy pieces. Selecting a piece displays
its name, points and legal movement diagram. Never make players infer movement from a symbol.
Prices are not copied as established Schness values: reserve returns, repeated deployment,
small boards, check rules and color flexibility change their strength substantially.

## Yes, two queens

On a 6×6 / 24-point board, a player could choose two queens (18 points), a knight (3) and a bishop
(3), for 24 points and four non-kings. An opponent could spend the same budget on two rooks (10),
a chancellor (8) and two knights (6): five non-kings, also 24 points. Neither is presumed balanced
until tested. This is the choice we want: concentrated power versus a more flexible army.

## Preserve Schness's defining capture rule

Captured pieces return to their **original owner's** reserve, including queens and fairy pieces.
They are not purchased again and do not transfer ownership. Points are only a pregame army-building
constraint; there is no income, kill reward or midgame shop. Returning high-power pieces may create
strong forcing loops, so test them against quiet-drop rules before enabling checking drops.

## Setup and rules

Start the army-builder pilots with king placement followed by quiet reserve deployment. Compare
alternating full setup separately. An unequal number of army pieces makes full setup require a
precise rule: alternate placements while both have reserves; once one finishes, the other completes
quiet placements without normal moves. Normal play begins only after both finish. Record setup
completion separately from game turns. Private setup needs disjoint allowed regions with enough
capacity for each army; do not force a seven-piece army onto a six-square home rank.

Controls should say the full rule: e.g. “6×6 · 24 points · Quiet drops · Return to owner.” Show
the actual random recipe before the first move. A new game can reroll; replays cannot.

## Implementation model

Replace the global size constant with per-position geometry. Square indexes, coordinates,
movement rays, home ranks, notation, pointer targets, keyboard navigation, editor tools,
accessibility labels and board CSS all derive from that geometry. Audit every literal 16/4,
including workers, validation, fixtures and serialized data. Validate bounds before allocating
boards or accepting remote state.

Introduce a versioned game specification containing board dimensions, piece catalogue version,
army lists, point-price version, drop/setup policies and resolved random seed. Identify owned
pieces by stable IDs so two queens are distinct pieces, while positions treat interchangeable
copies canonically for repetition where their legal rights are identical. Preserve ownership and
piece identity through capture, reserve return and replay. Budgets validate the army before play;
they do not alter legality during a game. Hash all rules and legal rights consistently, not UI
labels or mutable object-property order. Older records without specifications remain Classic 4×4.

Both peers must accept the same specification; incompatible clients stop before play. Replays,
research manifests and matchmaking labels carry the complete recipe. AI search must use time/node
budgets and validated board-specific profiles: depth four on 4×4 is not the same performance
commitment on 10×10. Large drop banks dramatically increase branching. Verify actual worker
latency and mobile responsiveness before making larger recipes public.

## Rollout and experiment plan

1. Generalize geometry with unchanged 4×4 behavior and replay compatibility tests.
2. Add 5×5 and 6×6 using the existing three pieces, to isolate board-size effects.
3. Add queens and duplicate armies under quiet drops. Screen two queens explicitly against
   mixed equal-budget armies and mirror matches in both colors.
4. Add archbishop, chancellor and camel one at a time; Amazon stays optional until screened.
5. Pilot army drafting on 6×6, then scale to 7–10 only after performance and game-length checks.

Measure color balance, matched-army balance, points efficiency, draw and repetition rates,
normal-play length, reserve churn, piece usage, duplicate-queen dominance, king-start effects,
opening diversity and search latency. Include equal-strength mirrored matchups. Army composition
is another experimental variable; do not vary board, budget, army and check rule simultaneously
and then attribute the outcome to only one of them.
