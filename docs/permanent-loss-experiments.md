# Permanent captures / one-use reserves

2026-10-24. Two opt-in presets implement the user's request: a captured non-king leaves the game
permanently. Neither player's bank receives it. Starting reserves remain available until deployed;
a piece can be held indefinitely, but cannot be recovered after capture. Kings remain uncapturable.
Classic return-to-owner and capture-to-capturer presets keep their existing behavior.

Separate quiet-drop and checking-drop versions isolate capture removal from the drop-check rule.
There is no new setup, promotion, pawn, queen, capacity limit, capture ownership or victory rule.
The current stalemate/repetition rules and 200-ply tournament ceiling stay unchanged. Do not add
an insufficient-material adjudication only to this experiment: king-only/low-material games may
reach repetition or the ceiling and should be reported explicitly, not interpreted as lively play.

Material conservation changes deliberately: total non-kings can only decrease. Missing pieces
are determined by the replay and position; no additional capture ledger affects move legality or
hashes. Unused reserves still count in search: finite-material-v1 values their full base material,
retaining the existing deployed activity bonus. Game and aggregate manifests record this policy.
Old controls retain their historical evaluation, so engine adaptation must be disclosed in comparisons.

## Wave 5 schedule

Four presets: canonical quiet, unrestricted checking, permanent-loss-quiet and
permanent-loss-checking. Seeds 20261102–04; 80 games per seed/preset = **960 pilot games**. These
seed identifiers do not schedule a future date. Five AI matchups and all sixteen king starts are
retained. Existing combined gate: >=48 decisive games, White decisive share 40–60%, median normal
play >=20 plies, >=120 distinct transcripts, no blocked setup. Eligible new variants expand to
three 1,040-game schedules. Full includes pilot prefixes; never pool stages. Verification gates
games; max two research jobs concurrently, partial artifacts on failure, release archive on success.

## Analysis questions

- Are permanent captures reducing repetition or merely replacing it with bare-king endings?
- Does retaining reserves indefinitely dominate early deployment?
- Do exchanges produce meaningful simplification, forced wins, or stalemate traps?
- How much does the first material loss predict the final result? Can a player recover?
- Compare quiet/checking drops, equal-engine subsets, colors and king starts independently.
- Report total material remaining, capture count/timing, unused reserves, king-only frequency,
  termination reason, length and diversity alongside win percentages.

These are screening experiments, not proof of optimal play or an automatic default-rule change.
