# Custom game builder

2026-10-24. Product proposal, not an implemented setup screen. Keep Classic Schness 4×4
as the default quick start. Custom games expose a reviewable recipe shared by both players.

## Setup flow

1. Choose Classic or Custom. Classic uses today's canonical rules and starting armies.
2. In Custom, choose the board, reserve rules, armies and clocks. Reveal advanced controls
   progressively; explain the selected rules in ordinary language.
3. Validate the combination, then show both players the same summary before acceptance.
4. If buying armies, run the purchase phase; reveal both armies together, then place kings
   and begin play using the selected deployment rules.

## Recipe sections

| Section | Choices to explore |
|---|---|
| Board | 4×4 default; proposed square sizes 4 through 10. Rectangular boards are a later extension. |
| Captures and bank | Return to owner, transfer to capturer, or permanent loss; capacity N through 2N, with an explicit overflow policy. |
| Armies | Standard, selected presets, seeded random, equal mirrored random, independently random, or player-selected unequal armies. |
| Army purchase | Shared piece pool and price list; equal budgets by default; optional explicit unequal budgets; duplicate limits and total-piece limits. |
| Deployment | Existing checking-drop and setup variants; proposed piece countdown and capture-reset policy. |
| Clock | No clock; equal clocks; explicitly unequal clocks; base time and increment per side. |
| Random rules | Select a pool of compatible variants and generate a visible, reproducible recipe before acceptance. |

N is each side's starting non-king army size. Unequal armies therefore need separate bank
capacities and an explicit interpretation of “double capacity” for each side. Changes to ownership
do not silently change those starting capacities during a game.

## Buying an army

Use simultaneous private purchases with public budgets, prices, allowed pieces and limits.
Each player locks their choice; neither sees the other army until both lock. Changes before
locking remain private. Define a purchase deadline and a visible fallback army for timeout or
disconnect before offering online play. Never silently use the game clock for shopping.

The king is mandatory, free and outside the purchase budget; kings cannot be bought or captured.
Allow two queens only when the selected pool, budget, duplicate cap and board capacity permit it.
Prices for this format require experiments; conventional chess values are starting hypotheses.
Larger boards, queens, pawns and fairy pieces are proposals, not currently playable options.

## Compatibility and fairness

- Validate board capacity and king-placement legality before starting. Fully deployed setup
  needs enough squares for both armies and a legal, complete deployment sequence.
- A reset-on-capture countdown is irrelevant to permanent-loss captures. Hide or explain the
  inactive setting rather than making duplicate random recipes.
- Capture-transfer plus countdown requires piece identity and a defined timer for the new owner.
- Show unequal army strength, unequal clocks and unequal budgets explicitly for both sides.
  A budget match is not evidence that different armies are balanced.
- Random choices must be drawn from validated combinations. Record the generator version,
  seed and resolved recipe; never regenerate rules when opening a replay.
- Specify when the clock starts, whose clock runs during deployment, and how forced countdown
  waits consume time. Shopping and king placement need their own clearly stated policy.

## Delivery order

First consolidate already implemented rules into a clean Classic-first setup and recipe summary.
Then add clocks and preset/random selection. Countdown needs new state and wait-action semantics;
board sizes and army purchase need generalized board geometry, piece identities, validation and
AI support. Test those foundations before exposing unsupported choices in the UI.

See `countdown-variant-proposal.md`, `army-builder-proposal.md` and the Classic designer handoff.
