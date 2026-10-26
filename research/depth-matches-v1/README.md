# Depth-five/six and Fairy-Stockfish matches — 26 October 2026

Status: depth matches launched; Fairy match queued after both finish and replay verification succeeds. No playing-engine changes.

## Frozen schedules

- Sharp v7 depth 5 versus frozen Sharp v2 depth 4: 6,912 games.
- Sharp v7 depth 6 versus frozen Sharp v2 depth 4: 6,912 games.
- Each depth uses 36 shared production presets, six seeds, 16 king starts and two fixed candidate colors (3,456 games per color). Same seeds and starts as the earlier depth-four schedule permit descriptive comparison; samples are correlated, not independent draws. Frozen manifests retain inherited wording “fresh seeds”; seeds are reused across these schedules.
- Depth is individual actions, not full White/Black pairs. No node/time cap, quiescence or reductions. Repetition aversion, seeded tie selection, 200-total-action ceiling and checkpoint replays are retained. Candidate and baseline retain separate tie streams. Every depth run has an isolated frozen runtime and dataset. Core sources match the earlier v7 full benchmark.
- Both depth runs use four workers each. Thinking times are wall time under parallel load, not isolated hardware speed or equal-time strength. Depth-six openings can be substantially more expensive than the saved-position timing corpus.

## Fairy follow-up

192 serial browser games, 96 per v7 color, six candidate tie seeds repeating 16 starts. Both engines receive 100 ms per move. v7 requests depth 100 with iterative deepening and a high node cap; reported completed depth is recorded. Fairy uses one thread, 16 MiB hash, no NNUE, package fairy-stockfish-nnue.wasm@1.1.12 reporting b2e693ef. The full legal move history is sent each turn.

Shared rules: 4×4, king placements fixed by start index, rook/bishop/knight reserves, captured pieces change ownership, six-slot bank, quiet drops and no cooldown. This is not canonical Classic. The adapter checks complete root legal-move parity at every played position; host rules adjudicate terminal outcomes. No claim that this adapter supports all Schness variants. Fairy selective depths are not equivalent to v7 exhaustive horizons.

The queue waits for both depth matches, verifies completed frozen replays, then runs Fairy. Failed prerequisites stop the queue; rules or frozen sources must not be silently changed or relaunched. Full replays, UCI outputs and observed decision times are retained.

## Reporting

Keep each schedule separate. Report each variant and candidate color: games, raw candidate/opponent/draw counts, win rate over all games, score counting half a draw, draw reasons and actual mean milliseconds per AI decision. No Elo, proven non-inferiority or intrinsic color-balance claim follows from mixed-engine games. A game ceiling is an artificial draw.

Completion procedure: verify no active runner, resume from the frozen runtime to validate hashes/replays, generate report and rates, archive complete runtimes/manifests/replays and verify all part/whole SHA-256 hashes. Commit all data to GitHub preserving unrelated contents. No production depth default is changed.
