# Arena strength range — 2026-11-08

What each numeric `strength` (requested search depth) costs per move, to choose the arena's
difficulty range and defaults. `bench.mjs` runs `analyzeAction(position, {strength})` on the 32
saved Classic positions in `research/search-performance-v2/positions.json`, one pass, warmed,
default 262144-node cap, Node on an Apple-silicon Mac. `results.jsonl` is its output for 0–7; the
run was stopped during depth 8.

- Cost grows about 4–15× per level. Depth 7: median 1.27 s, p95 4.76 s, max 8.15 s, mean 163,838
  nodes (62% of the cap). Depths ≥8 were not measured; they are expected to hit the cap.
- `agreeWithD8` counts matches with a depth-8 search's move. It is not a strength measure, and it is
  not monotonic (depth 7 agrees less than 6). Playing strength needs bot-vs-bot games.
- One machine, one pass, no phone. A phone is likely several times slower.
