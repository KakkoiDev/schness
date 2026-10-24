# Designer handoff: Classic Schness first

Prepared 2026-10-24. This is the brief for the designer AI. Design and prototype first; no theme
implementation or rules changes are authorized by this handoff alone.

## Assignment

Improve the UX and UI of **Classic Schness** into a clean, coherent, highly usable chess product.
The user wants Classic improved first. Establish a reusable visual system that can later support
other styles, including cyberpunk neo-purple with lightning move effects. Future styling should
change the presentation without requiring a redesign of the play flow or game components.

Use Lichess as a reference for clarity, legibility and putting the game first—not as a layout or
branding template to copy. Preserve Schness's identity and the importance of its reserve pieces.
Give a concrete design recommendation, explain the tradeoffs, and provide reviewable screens.

## Product and rules you must understand

Classic uses a **4×4 board**, not an 8×8 chessboard. Each player has one king and a rook, bishop
and knight. White places a king on their home rank, Black follows, and White takes the first
normal turn. On a turn, move a board piece or deploy one reserve piece onto an empty square.
A drop cannot immediately check the enemy king. Captured non-kings return to the side they
belonged to; they are not lost and do not join the capturer in Classic. Win by checkmate.
There are no pawns, queens, promotion or castling in Classic.

The reserve is a primary interaction surface, not a decorative captured-piece list. New players
must understand what can be selected, where it can go, whose turn it is, and why a drop is illegal.
Do not imply that the game has ordinary chess capture rules.

Experiments now include checking-drop policies and capture-to-capturer banks of 3–6 pieces.
They are opt-in Bot Arena variants on work-in-progress branches. Larger boards, point-budget
armies, duplicate queens and fairy pieces are proposals. Do not present them as shipped Classic
features or let a long list of research rules dominate the normal play entry point.

## Priority order

1. Make starting and playing Classic clear on desktop and phone.
2. Make moves and reserve deployment equally discoverable and comfortable.
3. Clarify game state, review state and online connection state.
4. Unify navigation, settings, typography, spacing and controls across pages.
5. Specify a presentation system that later themes can reuse.

Treat lab discovery, army building and cyberpunk effects as future extensions. A polished Classic
experience is the deliverable; speculative screens must be clearly marked as concepts.

## Review the current product before proposing changes

Read `CLAUDE.md`, `DECISIONS.md`, and the latest relevant entries in `DEVLOG.md`. Inspect the
working UI and relevant files; distinguish observed usability problems from hypotheses.

| Surface | Starting points | What to evaluate |
|---|---|---|
| Home / quick bot game | `index.html`, `src/lobby.js`, `src/lobby-board.js` | Clear first action, desktop playable preview versus mobile entry, competing links |
| Main game / online | `game.html`, `src/main.js` | Board prominence, turn/clock/reserves, invitation and reconnect states |
| Bot Arena | `watch.html`, `src/watch-ui.js` | Human seat versus watch, difficulty, variants, review, editor, advanced-control density |
| Puzzles | `puzzles.html`, `src/puzzle-ui.js` | Goal, attempt, hint, solution, next puzzle |
| Library / replay | `library.html`, `src/library-ui.js` | Finding a game, understanding result, replay versus live state |
| Shared presentation | `styles.css`, `ui.css`, `src/board-ui.js`, `src/theme.js`, `src/settings.js`, `src/i18n.js` | Existing tokens, shared components, theme and language behavior |

The app is static HTML/CSS/ES modules with a shared board and reserve renderer. Existing design
uses Basecoat components and semantic tokens, with tests for contrast, tokens, accessibility and
responsive layout. Build on this system unless a specific problem justifies a change; do not
propose a framework migration as a design prerequisite. Existing decisions can be challenged,
but name the evidence and migration cost rather than silently contradicting them.

## Core design questions to resolve

- What is the clearest primary route from arrival to a playable Classic game? Compare the current
  desktop immediate-play approach with the phone entry flow before changing either.
- Which controls belong beside the board, which belong in a contextual menu, and which belong
  in settings? Keep frequently needed actions reachable without hiding their meaning.
- How do reserve pieces communicate availability, selection, legal destinations and empty slots?
  Support tap-select/tap-place as well as dragging. Include cancel and selection recovery.
- How do we show a forbidden checking drop helpfully? Offer a concrete explanation without
  flooding every turn with instructions or relying on a red flash alone.
- How does a new player learn the three distinctive rules: tiny board, quiet drops, captures return?
  Use short contextual teaching and a replayable rules tutorial. Assess onboarding interruption.
- How does the interface make king placement, active turn, thinking, check, mate, draw and review
  unmistakable? Keep the board position visible when explaining a result.
- How should Classic and experiments coexist? Recommend progressive disclosure for a future
  Lab entry while keeping the existing opt-in arena functions discoverable.

## Required design states

Produce a state map and mockups/prototype coverage for:

- Home and start flow; first-time and returning players.
- King placement for both sides, normal play, opponent/bot thinking.
- Reserve selected, board piece selected, legal targets, cancelled selection and illegal drop.
- Check, checkmate, draw and postgame actions.
- Live game versus replay, return to live, and resuming play from an allowed position.
- Online invite creation, waiting, joining, reconnecting, expired invite and recoverable failure.
- Settings, rules/tutorial and a clear way to return to the game.

Prioritize detailed screens for home, active game with reserve selected, a game result and
settings. Other states may use annotated variations of shared components. Include desktop and
phone versions; do not deliver only a desktop hero image.

## Visual direction for Classic

Calm, readable and compact without feeling cramped. Board and pieces carry the visual weight.
Use restrained surfaces, clear type hierarchy, purposeful spacing, recognizable pieces and a
small number of action styles. The existing warm neutral / muted green direction is a useful
starting point; recommend refinements after reviewing it. Avoid ornamental cards around every
control, excessive shadows, decorative dashboard content or motion competing with the board.

Design both light and dark Classic. Side-to-move, selected/target/last-move/check indicators,
clocks and disabled controls must remain distinct in both. Do not use color as the sole signal.
A polished empty or waiting state matters as much as an attractive populated board.

## Customization architecture to specify, not build now

Keep these independent:

- **Rules:** Classic versus a specific experimental recipe.
- **Appearance:** Classic now; Cyberpunk or other visual themes later.
- **Color mode:** light, dark, system, where supported by a theme.
- **Board / pieces:** compatible palettes and piece sets, if customization is proposed.
- **Effects:** off / subtle / expressive, independently controlled from rules.

Specify semantic tokens for surfaces, text, borders, accent, focus, board squares, selection,
legal targets, last move, check and result states; plus type, spacing, component sizes, radii and
motion. Extend the existing token vocabulary deliberately. Avoid scattering theme-specific
colors or duplicating the page markup per theme. Preserve component geometry where practical;
identify any intentional theme-specific geometry rather than assuming a color swap is enough.

Future cyberpunk direction: near-black purple, violet/magenta accents and short lightning trails
on movement. This remains mockups only. Lightning must not obscure occupied squares, delay input,
encode essential information or interfere with live/replay state. Reduced-motion and effects-off
modes are first-class. Theme selection must never change game rules.

## Accessibility, responsiveness and localization

- Preserve keyboard board navigation, visible focus, usable dialog focus/escape behavior and
  screen-reader labels/status announcements. Specify the order of reserve and board interaction.
- Follow existing measured contrast constraints (text at least the project's 4.5:1 floor where
  applicable) and usable non-text state contrast. Measure both Classic color modes.
- Use at least 44×44 CSS-pixel touch targets for primary touch interactions, including reserves;
  allow sufficient separation and actual phone testing. Do not shrink targets merely to fit.
- Show 360px and 390px phone layouts, a short phone viewport, tablet and a normal desktop.
  Board, reserves, status and critical actions must fit without clipping or overlap. Long content
  should scroll intentionally; controls must not hide behind a fixed action bar or keyboard.
- English and Japanese are equally supported. Test longer labels, settings, tooltips, status,
  reserve counts and dialogs; avoid untranslated decorative text in the actual UI.
- Respect reduced motion and maintain usability with effects entirely disabled.

## Existing visual references: use critically

- `output/design/schness-classic-concept-v2.png`: corrected Classic concept with accurate 4×4
  mobile geometry. Use v2; the first draft has a three-row mobile-board error.
- `output/design/schness-cyberpunk-concept.png`: future appearance direction only.
- `output/design/README.md`: prompts, corrections and notes.

These generated concepts are inspiration, not approved layouts, shipped screens or authoritative
feature inventories. They include proposed actions such as Build an army. Reconcile any screen
with current rules and the Classic-first priority before carrying it into the design.

## Deliverables

1. A short UX audit: observed issue, user impact, evidence, priority and proposed remedy. Call out
   what already works. Separate observations from assumptions requiring user testing.
2. One recommended information architecture and primary play flow, with reasons for meaningful
   alternatives rejected. Show where settings and experiments live.
3. High-fidelity Classic light/dark desktop and mobile screens for the prioritized states, plus
   an annotated state/component map. Use exact 4×4 geometry everywhere.
4. An interactive prototype of start → king placement → move/drop → result and settings, if the
   available design tools support it. Label simulated actions and unsupported flows.
5. A component and token specification showing current Classic and a small future-theme example.
   No full cyberpunk implementation; a bounded preview is enough to demonstrate extensibility.
6. An implementation handoff: components to reuse/change, responsive behavior, interactions,
   accessibility semantics, assets, acceptance checks and a staged rollout plan.

Lead with a coherent recommendation, not dozens of unrelated visual options. Do not claim a
usability improvement was validated merely because a mockup looks cleaner. Identify the small
set of decisions the user needs to review before implementation.

## Acceptance criteria

A new player can find Classic, understand whose turn it is, move or deploy by touch, and recognize
that a captured piece returns. Important controls remain reachable on a short phone screen.
There is one coherent shared board/reserve language across play, puzzles, tutorial and replay.
The experience works in both Classic color modes and both languages, with keyboard and reduced
motion. Advanced experiments remain accessible without overwhelming the normal start flow.
The specification can add a future appearance through a defined token/component layer while
keeping the same game behavior. No speculative feature is presented as already available.

## Current engineering context

Repository: https://github.com/KakkoiDev/schness. Work-in-progress branches are stacked; check
current branch/PR state rather than assuming master contains everything:

- #110: opt-in variant selection and Random variant; previous design concepts and army proposal.
- #111: spatial / piece-specific checking-drop experiments and larger-variant proposals.
- #112: capture-to-bank with capacities 3–6, duplicate reserve badges and capture-aware search.

Research is separate from this design brief. Preserve Classic defaults and replay behavior.
Do not interrupt tournament runs or merge experimental rules into Classic as part of a redesign.
The immediate task is a design proposal/prototype for review, not production implementation.
