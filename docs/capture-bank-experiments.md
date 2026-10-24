# Capture-to-bank: ownership-changing Schness

2026-10-24. Eight opt-in variants implement the user's shogi-inspired capture rule and corrected
capacity range. This changes capture ownership only, not movement, board geometry or king rules.
It is not full shogi.

## Exact rules

- Captured non-kings join the capturer's bank if it has a free slot. Dropping switches the piece
  to the dropping player's color. Recapture may change sides again; original allegiance is not retained.
- If the bank is full, the piece returns to the side it belonged to immediately before capture.
  No discard choice or piece destruction. Capacity counts all pieces held, not board pieces.
- Capacities **3, 4, 5 and 6** are separate presets, each crossed with quiet/checking drops.
  Three and six are the requested endpoints; four/five explore the intermediate settings.
- General product rule: for a team starting with N non-kings, capacity may range from N to 2N.
  Today's engine is still fixed at N=3; larger armies remain a separate proposal. No extra pieces
  are added merely to fill a bank. Six non-kings plus two uncapturable kings are conserved.
- Six slots equal unlimited capacity with today's set. A real six-slot bank cannot overflow:
  at least one non-king must remain on the board to make a capture.
- Duplicates are allowed and shown with a count badge. Identical copies generate one legal drop
  action per type/destination, avoiding a search tie-breaking bias. Drops consume exactly one copy.
- Capacity is validated and included in ruleset identity, hashes, replay and tournament metadata.

Classic retains return-to-owner captures. No promotion, pawn, queen, expanded army or dynamic
board changes are included. Online play remains canonical; these presets are opt-in Bot Arena.

## Research

Ten presets: eight candidates plus canonical quiet and unrestricted-checking controls. Three fresh
seeds 20261030, 20261031, 20261101; 80 games per seed/preset = **2,400 pilot games**. Five balanced
AI matchups and sixteen king-start pairs remain unchanged. Apply the same combined screening
gate as waves 2/3 and expand each qualifying candidate to 3 × 1,040 games. Full schedules include
pilot prefixes; never pool stages. At most two jobs run concurrently. Unit and full browser
verification gates research; partial datasets upload on failures and complete batches archive
as releases. The nominal date-like seeds are identifiers, not scheduled future dates.

Measure more than wins: ownership changes, bank occupancy, capacity overflows (expected impossible at six), duplicate piece
use, material snowball, comeback frequency, draws/repetitions, normal-play length and equal-engine
color balance. Capture presets use a documented capture-material-v1 evaluation that values every reserve piece
at full base material, retaining the deployed activity bonus. Existing controls retain their
historical evaluation. Fixed-depth bots are not otherwise tuned for this format; apparent balance is provisional.
