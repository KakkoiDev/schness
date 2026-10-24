# Pushing Schness further: proposals for larger experiments

2026-10-24. These are proposals, not implemented rules. Prefer individual experiments before
combining mechanics; preserve Classic and show every recipe before acceptance.

| Idea | Concrete first experiment | Main question | Change size |
|---|---|---|---|
| Army market | 6×6, 24 equal points, maximum two copies; queens and existing pieces | Can unequal armies compete fairly when captures return? | Large; see army-builder-proposal.md |
| Open draft | Players alternate choosing from a shared piece pool; snake order W–B–B–W | Does denying pieces create interesting pregame decisions? | Large: draft phase and AI |
| Sealed army choice | Both spend the same budget privately, then reveal simultaneously | Does surprise add variety without first-picker advantage? | Large: hidden choices and AI |
| Deployment zones | Quiet drops limited to own half, then own two ranks as separate presets | Does territory matter more when reserves cannot appear anywhere? | Medium: all-drop restrictions, UI and AI |
| Supply squares | Three neutral supply squares; a drop must touch a friendly piece or controlled supply square | Can players build and disrupt deployment networks? | Large: new terrain and state |
| Reserve recovery delay | Captured piece unavailable for one or two of its owner's turns | Does a temporary material advantage reduce recycling loops? | Medium: timers in hashes, replays and AI |
| Exhausting drops | Each individual piece may return twice, then leaves the game on its next capture | Do finite reserves make endings decisive? | Large: stable piece identities and counters |
| Deployment energy | Start with 2 energy, gain 1 each turn, drops cost 1/2/3 by piece | Is saving resources a meaningful choice rather than a forced pass? | Large: economy, pass legality and AI |
| King of the centre | On 6×6, hold any central 2×2 square with king through opponent's reply | Can an alternate win condition break passive repetition? | Medium: victory timing and AI evaluation |
| Escape king | Reach the opponent's home rank safely and survive one reply | Does king activity create a second strategic axis? | Medium: victory condition and AI |
| Three checks | Third delivered check wins, including legal checking drops | Does a check race produce richer play or a stronger first-move problem? | Medium: counters and AI |
| Stalemate wins | Player delivering stalemate wins instead of drawing | Can confinement become a useful alternate finish? | Small engine change; substantial evaluation change |
| No immediate recapture | A piece that just captured cannot itself be captured on the next ply | Does protection encourage attacks or produce unstoppable threats? | Medium: transient rights and king-safety definition |
| Simultaneous orders | Both choose one action secretly; reveal and resolve with explicit collision rules | Does prediction replace opening initiative? | Very large: new game model, not a normal-turn preset |
| Fog of war | Reveal only squares attacked by own pieces; replace check with king capture | Is hidden movement enjoyable on a replenishing board? | Very large: information security, new win rule and AI |
| Rotating terrain | Every four rounds rotate two marked blockers; never move occupied squares | Does changing geometry create tactics without arbitrary losses? | Very large: terrain legality and scheduling |
| Fairy catalogue | Add archbishop, chancellor, camel one at a time on 6×6 | Which movement patterns work with repeated deployment? | Large: movement, art, editor, AI and compatibility |

## Recommended next order

1. Finish the already launched drop-rule waves and inspect equal-engine games.
2. Compare deployment zones and one-turn reserve recovery; both preserve Schness's core loop.
3. Generalize geometry, then test 5×5 and 6×6 with existing armies before buying extra pieces.
4. Add queens, duplicate queens and the army budget; then fairy pieces independently.
5. Explore alternate victory conditions before committing to simultaneous turns or fog of war.

Every experiment needs full rules in the game specification, replayable state, mirrored colors,
fixed search budgets, complete datasets and an explicit baseline. Novelty alone is not evidence
of depth: watch for forced openings, dominant army choices, repetitive reserve loops and mobile
search stalls. Keep colorful sandbox recipes available even when they are unsuitable as a default.
