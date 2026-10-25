# Schness visual concepts — 2026-10-24

Preview mockups only, generated with the built-in image-generation tool. They do not represent
implemented settings, clocks, ratings, navigation changes or legal game transcripts. The desktop
boards preserve Schness's 4×4 geometry. The classic mobile thumbnail has an illustrative geometry
error (three rows) and must not be used as a specification. Build from the actual four-row board
component when implementing. The user requested mockups before implementing the theme.

- `schness-cyberpunk-concept.png`: aubergine canvas, violet/magenta edge lighting, ivory/dark-violet
  pieces, restrained neon, desktop play view and mobile lobby, a lightning move-trail moment.
- `schness-classic-concept.png`: warm neutral surfaces, sage/cream squares, charcoal type and a
  restrained terracotta accent, desktop play view and mobile lobby, no glow or effects.

Recommended implementation after review: settings separate Appearance (Classic / Cyberpunk)
from Light / Dark and Move effects (Off / Subtle / Lightning). Use short single movement trails,
not strobes or persistent flashing. Respect reduced-motion automatically. Mount effects outside
the rebuilt board subtree, cancel stale effects and preserve piece readability. Both themes use
the same game logic and accessible controls.

## Final prompts

### Cyberpunk

Use case: ui-mockup. Create a polished high-fidelity product design concept sheet for SCHNESS, a compact chess-variant web app. Landscape wide 1536x1024. Two panels: a large desktop in-game interface on left ~70%, a narrow mobile lobby on right ~30%, aligned on a dark plum presentation canvas. Style: refined cyberpunk neo-purple, near-black aubergine background, violet and magenta rim lighting, a few icy lavender accents, restrained neon, premium readable typography, clean generous spacing. Main desktop has small SCHNESS wordmark top left, nav Play / Arena / Library / Puzzles, settings icon. Centered flat TOP-DOWN FOUR BY FOUR CHESSBOARD: exactly four rows and four columns = 16 squares, NOT eight by eight. Eight elegant recognizable chess piece silhouettes max, white ivory and deep violet. At least one rook and knight, two kings. Subtle luminous borders, alternating plum squares. One white knight moving with a short jagged violet lightning trail between two board squares, visually communicating motion while keeping board readable. Above/below board reserve trays with rook bishop knight icons, clear side-to-move status. Right of main board small panel 'Quiet first turn', dropdown 'Variant', compact move history and 'New game'. Below small theme setting chips 'Cyberpunk' selected, 'Classic' unselected, 'Move effects' switch. Mobile panel shows lobby title 'Small board. Big decisions.', a smaller accurate 4x4 board preview, large buttons 'Play', 'Random variant', 'Build an army', and a variant chip 'Classic 4×4'. No cityscape, no people, no hardware frames, no visual clutter, no pseudo-code. This is visual concept art, not a shipped app screenshot. Sharp flat UI and professionally art-directed glow, legible simple text. Preserve actual 4x4 board geometry everywhere.

### Classic

Use case: ui-mockup. Generate a high-fidelity polished LIGHT CLASSIC theme concept for SCHNESS, a compact chess variant website. Wide landscape concept sheet, large desktop play view left and a small mobile homepage on right. A clean calm chess website aesthetic: warm off-white canvas, restrained charcoal text, muted sage and cream board, thin gray rules, small terracotta accent, flat functional typography, generous whitespace, clean Staunton black/ivory pieces, no gradients or glow. Desktop wordmark SCHNESS, nav Play / Arena / Library / Puzzles, settings icon. The primary board must be EXACTLY FOUR ROWS BY FOUR COLUMNS = 16 squares (4x4), flat top down, with two kings and a few rook bishop knight pieces. Reserve trays above and below the board. Right rail has 'Classic Schness', variant dropdown 'Classic 4×4', a restrained move history, 'New game' button. Bottom appearance setting displays 'Classic' selected and 'Cyberpunk' unselected, with 'Move effects' turned off. Mobile homepage shows 'Small board. Big decisions.', accurate FOUR BY FOUR board preview, 'Play', 'Random variant', 'Build an army'. Lichess-like clarity and density without copying logo or exact branding. No lightning in this classic theme, no neon, no sci-fi ornaments, no hardware device frames, no photography. Good contrast, readable large simple text. This is a design concept, not a screenshot of shipped features.

### Selected Classic revision

`schness-classic-concept-v2.png` corrects the mobile board to four rows. Use this revision for
review; the first Classic image is retained as a draft.

Final edit prompt: Edit target: the supplied SCHNESS classic concept sheet. Preserve the large desktop interface exactly, all colors, typography, pieces, and surrounding mobile lobby. Make one correction only: the small mobile board on the right currently has only THREE rows and FOUR columns. Replace that small board with a square board of EXACTLY FOUR equal-height rows and FOUR equal-width columns (16 alternating sage/cream squares). Keep existing six pieces in their same relative squares in the top three rows, and add one empty fourth row at the bottom. Move the mobile Play / Random variant / Build an army controls slightly downward as needed to accommodate the square board, preserving clean spacing and keeping the bottom navigation visible. Do not add extra columns. Leave the desktop 4x4 board unchanged. No other changes.
