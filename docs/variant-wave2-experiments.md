# Variant experiments, wave 2 — 2026-10-24

Question: can symmetrical development restrictions repair checking-drop initiative without
sacrificing variety? This follows the Black advantage under lone-king protection.

## Fourteen presets

| Preset | Rule |
|---|---|
| canonical | Quiet-drop control. |
| unrestricted | Unrestricted checking-drop control. |
| protected-recurring | Previous recurring lone-king-protection control. |
| first-turn-quiet | Each player's first turn after king placement forbids checking drops. Later checking drops allowed. King placement does not consume that turn. |
| protected-first-turn | Same quiet first turn for each side, plus recurring lone-king protection. |
| mutual-one | Checking drops unlock permanently once both players have deployed at least one non-king. |
| mutual-two | Checking drops unlock permanently once both have deployed two distinct non-kings. |
| limited-check | Each player may give check by dropping at most once in the whole game. |
| cooldown | A checking drop must be followed on that player's next turn by a normal move or quiet drop. A normal checking move is allowed. |
| no-drop-mate | Drops may check but cannot immediately checkmate. Ordinary move mates remain legal. |
| hidden-quiet | Independent private home-rank armies, simultaneous reveal, White starts; later drops quiet. |
| hidden-checking | Same private setup, later checking drops allowed. |
| grace | Repeat borderline three-turn-grace preset with fresh seeds. |
| setup-white-checking | Repeat borderline alternating quiet setup, White first, checking drops allowed afterward. |

Mutual deployment gates use historical first deployment, not current board count, so captures do
not relock checking drops. The limited-check budget and cooldown are separate per player. Their
state and deployment/turn gates survive cloning and enter position identity where relevant.
No-drop-mate tests legal defensive replies, including reserve defenses; checking-drop reply
validation terminates because each nested drop reduces reserves.

## Private setup policy

Kings retain the sixteen public starting-square pairs. Each player's rook, bishop and knight
fill the three remaining squares of their own home rank. Both arrangements are chosen before
reveal, from independent seeded uniform samples of arrangements that do not check the opposing
king. Neither choice reads the opponent's non-king arrangement. This is **not** a strategic
hidden-information AI: the experiment measures play after these random private setups.

A combined reveal is serialized as six precommitted quiet drops solely for engine replay, with
`simultaneousReveal` markers and the entire committed arrangement, policy and derived seeds saved
in each game. Neither side chooses a placement after seeing the other army. The normal-play
phase starts with White. This differs from the earlier AI-chosen alternating full-board setup
in both placement policy and home-rank restriction; results cannot isolate secrecy alone.

## Run plan

The Actions workflow `Variant research suite v2` first runs the unit and desktop/mobile browser
suites. Fourteen variant jobs each run 80 games under **each of three fresh seeds**:
20261024, 20261025 and 20261026. That is 42 pilots / 3,360 games, with equal coverage of the five
AI matchups and sixteen king-start pairs. Results are combined across the three pilots for
screening, rather than selecting whichever seed looks favorable.

A non-control candidate expands to three 1,040-game runs (one per seed) if its combined pilots
have at least 48 decisive games, White share of decisive outcomes between 40% and 60%, no blocked
setup, median normal-play length at least 20 plies and at least 120 distinct transcripts.
The expanded schedule contains each pilot prefix; never pool pilot and full as independent data.
These are screening thresholds, not proof that a variant is viable or unviable.

Each variant preserves seed-specific complete bundles plus a combined summary. A final release
archives all results. Jobs upload partial output on failure; failures must be reported rather
than interpreted as unfavorable game results. The existing 200-total-ply ceiling includes setup.

No player-facing default is changed by these experiments. Variant selection and the design
concepts requested subsequently are separate product work.
