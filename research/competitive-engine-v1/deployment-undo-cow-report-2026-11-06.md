# Deployment history copy-on-write misses the timing gate

The isolated candidate saves the old private deployment array and copies it only when a move first deploys that piece kind. Public transitions, rule rights, repetition keys, and evaluation remain unchanged.

All 142 portable rule snapshots and 2,044 legal successors matched immutable transitions and restored state and deployment array references. A directed four-ply first/duplicate deployment stack passed in both colors. All 174 portable cases and eight targeted tests covering 19 mates passed. All 32 fresh paths, 256 query records and reported continuations replayed; complete fixed-depth results were identical.

Fixed-depth aggregate time was 368.822 ms control and 351.903 ms candidate, a 4.59% saving against the preregistered 5% gate. Mean completed depth at 100 ms was 6.453125 control and 6.5 candidate. The fixed-depth gate failed. Close without tuning or a rerun. No games ran and no production or benchmark settings changed.
