# Designer follow-up — refused drops, 2026-11-08

Row 4 follow-up: the refused-drop guard now covers all eight quiet presets. The patch at the end goes on top of the first patch you applied.

**Correction to the split.** Your guard finding was right, but 27 is too many. Of the presets that aren't Classic or one of the eight, 9 allow checking drops with no restriction: unrestricted, permanent-loss-checking, capture-bank-3..6-checking, setup-white/black-checking and hidden-checking. They never refuse a drop for giving check, so they need no message. Only 18 need a reason of their own:
- 7 about where or which piece: home-half, distant, supported, countercheck, knight, bishop, rook.
- 11 about when checking drops unlock: first-turn-quiet, protected-first-turn, mutual-one, mutual-two, limited-check, cooldown, no-drop-mate, protected-recurring, protected-opening, grace, quiet-return.

Those 18 need new legality comparisons, not just new wording. `refusedDrops` finds refused squares by comparing against the same game with `allowCheckingDrops` on, and in these presets that doesn't lift the restriction.

**A second gap for deliverable 6.** All four full-setup presets require quiet drops during setup, but the guard exits whenever `phase !== 'play'`. A refused setup drop is never explained.

**What the patch changes:**
- `refusedDrops` allow-lists `permanent-loss`, `capture-bank` and `setup` instead of giving up on any `rules.experiment`.
- It restores the unit test that the 11-07 publication left out.
- It adds a test that lists the eight quiet presets from `variants.js` and checks they refuse the same squares as Classic.
- It adds entries to DECISIONS.md and DEVLOG.md and bumps CACHE from v135 to v136.

**Verified:** 396 of 398 unit tests pass; the same two benchmark tests that need `npm install` still fail. In Chromium, Capture bank 4 · quiet now marks six refused squares, announces DROP_REFUSAL and keeps the piece in hand. Playwright was not rerun.

**For deliverable 3:** no reorder needed. For the refused-drop screen, show one of the eight presets, which uses the existing Classic message, and one of the 18, whose message is still to be written, and label which is which.

**How to get it:** fetch branch `design/ui-refresh-handoff` from https://github.com/KakkoiDev/schness.
It is `146f8ff` plus one commit containing both patches (the restored arena files and the narrowed
guard), the tests, the DECISIONS.md and DEVLOG.md entries, and the corrected November brief at
`docs/designer-handoff-refresh.md`. If you already applied the first patch on your own branch, rebase
or reset onto this branch; don't apply the guard change twice.
