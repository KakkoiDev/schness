# Piece countdowns: deployment readiness

2026-10-24. Proposal, not implemented or included in the running local batch. The user suggested
waiting a number of turns based on piece value, with an option to reset that countdown on capture.

## Recommended first interpretation

Countdown controls **reserve deployment**, not movement of already deployed pieces. Tick once
at the end of that piece owner's completed normal turn. King placement and setup do not tick.
A piece showing zero may be dropped on the next turn. The timer never advances on the opponent's
turn, on elapsed real time, during review, or merely by selecting a piece.

Start with current 4×4 material: knight 3, bishop 3, rook 5. These are initial delay hypotheses,
not calibrated Schness values. The mandatory king is exempt and moves normally. Pawns (delay 1),
queens (9) and fairy pieces belong to the proposed larger-army system, not this first experiment.
Keep deployment delay configurable separately from any army purchase price: a price of 5 does
not prove a five-turn wait is balanced on a tiny board.

Example: knight starts at 3. After your first completed normal turn it is 2, after your second 1,
after your third 0. It can be deployed on your fourth normal turn. With all starting reserves on
cooldown, early turns therefore use king moves. Test whether this creates repetitive forced openings.

## Two capture policies to compare

1. **Reset on capture:** captured piece returns to its current owner's reserve at its full delay.
   A knight returns at 3, then needs three of its owner's completed turns before deployment.
2. **Initial unlock only:** capture returns it at 0. Once a piece has first become ready, later
   captures do not delay its return. Since only zero-timer pieces deploy, there is no nonzero
   deployed countdown to preserve in this version.

Use existing return-to-owner captures first. Capture-to-capturer plus countdown is a later
combination: specify whether a stolen piece resets for the new owner and preserve its identity.
Permanent-loss captures have no returning piece to reset, so the reset toggle has no effect there.
Do not present that combination as a separate experiment with a meaningful reset distinction.

## No-move and terminal positions: decide before implementation

Keep checkmate: no legal defense to check loses immediately. A cooling piece is not an available
defense. A wait must never let a player ignore check.

Recommended narrow wait rule: when not in check, with no legal board move or ready drop, but at
least one cooling reserve piece, allow **Wait** as the sole action and decrement your timers.
When there is no cooling reserve and no move, normal stalemate applies. Do not allow voluntary
passes while another action is legal in the first pilot; that changes tempo and deserves its own
variant. A wait action must be recorded, hashed and replayed. Count it in the 200-ply ceiling and
report it separately from actual moves and drops.

Compare ordinary stalemate instead of waiting as a separate preset only if desired. Otherwise
cooldown can manufacture draws before reserves ever unlock. Both approaches are coherent, but
silently inheriting today's stalemate rule would obscure that choice.

## UX

Show each reserve piece with a numeric remaining-turn badge and an explicit readiness state.
Ready pieces retain ordinary tap/drop behavior; cooling pieces explain when they unlock. Display
whose turns are counted and whether capture resets them in the game recipe. Do not reuse the
existing duplicate-count ×2 badge for readiness; multiplicity and cooldown are different facts.
Use text/shape as well as color, announce meaningful unlocks accessibly, and respect reduced motion.
The active player must be able to inspect an unavailable piece without losing current selection.

## Engine work needed

Timer state affects legality and repetition and belongs in position identity, cloning, saved
snapshots, search, replay and worker communication. Update legal action generation, terminal
adjudication, notation/history and all consumers for the new wait action. Verify king-placement
boundaries, own-turn ticking, capture timing, zero readiness and undo/replay exactly.

Classic's unique piece types could use per-owner/type timers. Duplicate armies or captured
ownership require per-instance rights: two rooks with timers 0 and 4 cannot be treated as one
interchangeable reserve type. A drop must identify which available copy is consumed, and
interchangeable equal-timer copies should not inflate legal actions. Do not generalize timers
across piece type and accidentally unlock all copies when one becomes ready.

## Pilot plan

Start with quiet drops and existing three-piece armies, compare reset versus initial-unlock-only.
Use modest 1/1/2 delays as an additional scale control against the literal 3/3/5 schedule, plus
canonical without timers. Keep the same engine/search budget, balanced colors, king starts and
fresh seeds; disclose any readiness-aware evaluation changes. Freeze exact source separately
from the existing 36-preset local run. Add checking drops only after the timing rules work.

Measure waiting frequency, forced king openings, time to first deployment, reserve hoarding,
capture recovery tempo, checkmate versus stalemate/repetition/ceiling draws, equal-engine color
balance and game diversity. Do not judge it only by fewer captures or longer games.
