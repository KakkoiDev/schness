# Working on Schness

## Read `DECISIONS.md` first

It holds the architecture, the invariants, and why each one exists. Several rules in this codebase
look like arbitrary style and are load-bearing — the service-worker cache version, the append-only
relay list, where an animation is allowed to live. `DECISIONS.md` tells you which is which.

## Keep `DECISIONS.md` current — in the same commit

A change that makes anything in `DECISIONS.md` untrue is not finished until that file is updated
alongside it. Not afterwards, not in a follow-up.

Update it when you:

- **change or add an invariant** — anything a future agent could break without noticing
- **add a module to `src/`** — the layer table lists every one, and a test enforces that
- **change how the app is built, tested or deployed**
- **make a decision worth not relitigating** — add a line to the Log at the bottom
- **close one of the Known gaps**, or discover a new one

If your change contradicts an entry, change the entry. If your change makes an entry's reasoning
wrong, say what replaced it. A stale record is worse than none, because it is trusted.

## Before you finish

- `npm test` passes. It is the only gate; there is no build and no browser runner in CI.
- **Bump `CACHE` in `sw.js`** if you touched anything listed in its `SHELL`. A deploy that forgets
  this reaches nobody who has opened the site before.
- Verify the effect, not the trigger. A class appearing, an object being returned, a check going
  green on the wrong rule — all of those have passed here while the feature did nothing.
- Say plainly what you could not verify. This is a sandbox: there is no real device, no live relay,
  and no second peer.
