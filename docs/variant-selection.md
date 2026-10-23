# Playing experimental variants

The Bot Arena offers a Game variant selector. Classic Schness remains the default. Experimental
choices show their complete rule description and include both earlier research presets and the
new wave. Changing the choice starts a new game. Full setup uses the reserve trays: select a
piece, then a legal square; moves/captures are disabled until the setup finishes.

Random variant selects one complete preset. It does not combine random rule flags. Its resolved
name and random-army seed appear in the URL, so a reload preserves the recipe. While Random
remains selected, New game rerolls. Reopening the resolved URL selects the named preset; choose
Random again if you want to reroll. The homepage has a Random variant shortcut to the arena.

Random hidden armies are sampled independently on home ranks after king placement, then revealed
together. They are generated armies, not a human secret-army editor. Setup snapshots are replayable,
but cannot be branched halfway through the reveal. Editing a position starts a canonical game
because historical checking-drop rights cannot be reconstructed from an arbitrary board.

This implementation is for the Bot Arena. The homepage's inline game, online invitations, puzzles
and archived canonical games retain their existing rules. Online variants require an agreed recipe
and explicit peer compatibility before being offered there.

Cyberpunk/Classic theme images are local design concepts awaiting review. Dynamic board geometry,
queens, fairy pieces and army purchasing remain proposals in army-builder-proposal.md.
