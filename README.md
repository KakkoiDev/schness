# Schness

Schness is a compact chess variant played on a 4×4 board. Each player owns a king, rook, bishop,
and knight. The board starts empty; players place their kings on their home ranks, then alternate
between moving a deployed piece and dropping a banked piece onto an empty square.

A drop may not give check. Captured non-king pieces return to their original owner's bank. Check,
checkmate, king safety, and stalemate otherwise work as in chess. Threefold repetition is a draw.

Contributing agents and humans: read [`DECISIONS.md`](DECISIONS.md) before changing anything. It
records the architecture and the invariants that are load-bearing, and it is kept current in the
same commit as the change that affects it.

Experiments, rejected alternatives, evidence, and changes in direction are recorded chronologically
in [`DEVLOG.md`](DEVLOG.md). **Every pull request that changes product direction, tunes an AI, runs
an experiment, or makes a meaningful UX tradeoff must update that log in the same commit.** Do not
defer the entry to a later cleanup. A public development-log page is planned; this file is its source.

## AI games and research

Open the **[Bot arena](https://schness.com/watch.html)** for every local AI mode. Each White and Black
seat can be You, Learning, Steady, or Sharp. That makes the same board support human–AI, AI–AI, and
local human play. Change the side-to-move seat to You to interrupt an AI and take over. Pause and
review any earlier ply, then choose **Continue from here** to create a new variation. The position
editor can start from any valid board; missing non-king pieces are inferred to be in their owner's
reserve. AI searches stay in a Web Worker.

Sharp v2 uses depth-four alpha-beta and avoids an already repeated resulting position when another
move has the same minimax score. It still accepts a repetition when that is better than losing.

Large experiments deliberately do **not** run in the browser. Open the
**[AI tournament workflow](../../actions/workflows/tournament.yml)**, choose **Run workflow**, and
set the number of complete research sets and a reproducible seed. Each 80-game set covers every one
of the 16 king placements for Sharp–Sharp, Sharp–Steady, Steady–Sharp, Sharp–Learning, and
Learning–Sharp. The default is 13 sets (**1,040 games**), so lower levels always face Sharp with
colors reversed. The workflow uses parallel Node workers and publishes exactly one downloadable GitHub
artifact, named `schness-tournament-<run>`, for convenient inspection from the run page. Actions
artifacts are temporary (this workflow retains them for 30 days), so every successful run also
publishes the same ZIP permanently under **[GitHub Releases](../../releases)** with a
`tournament-run-<run>` tag. Tournament runs 1 and 2 are backfilled there. The archive workflow can
preserve any older still-available run on demand.

The ZIP is designed for human or AI analysis:

- `manifest.json` — experiment settings and overall result totals
- `summary.csv` — outcomes grouped by both AI levels and both starting king squares
- `games.jsonl` — one self-contained, reproducible game per line, including every action
- `ANALYZE.md` — schema guidance and suggested strategic questions

An AI with access to the repository can download that workflow artifact, unzip it, inspect all
games, compare corner and inner king placements, identify recurring winning sequences, and propose
follow-up experiments. Keep the workflow run URL when requesting analysis so the exact artifact is
unambiguous.

The first full 1,040-game experiment and its strategic findings are recorded in
**[AI tournament report — run 1](docs/tournament-report-2026-09-10.md)**. The controlled rerun with
repetition-aware Sharp v2 is documented in **[AI tournament report — run 2](docs/tournament-report-2026-09-11-sharp-v2.md)**:
threefold draws fell by 37 and Sharp's score against lower levels rose by 1.15 percentage points,
though its losses also rose from 28 to 30.

The public **[game library](https://schness.com/library.html)** deduplicates both tournament runs by
their complete action sequence: 2,080 records become 1,099 unique replayable games. Each game keeps
all of its experiment provenance, including exact White and Black AI versions, result, length, and
starting kings. Rebuild it from downloaded artifacts with:

```sh
npm run library:build -- --input 1:1:path/to/run1/games.jsonl --input 2:2:path/to/run2/games.jsonl
```

The **[checkmate-puzzle workflow](../../actions/workflows/puzzles.yml)** reconstructs every distinct
position in that corpus, walking each game from its final playable position back to the opening. A
64-shard exact solver proves the shortest forced mate in one through four moves against every legal
defense. Its final artifact contains the deduplicated puzzle collection and source game/ply metadata;
phones never perform this exhaustive search. Its result is also stored permanently in GitHub Releases
under a `puzzle-corpus-<run>` tag.

The verified result is playable in **[Checkmate puzzles](https://schness.com/puzzles.html)**. Select
any combination of mate depths, optionally hide the depth, and optionally advance automatically after
a solution. The first complete extraction checked 52,371
unique positions and found 1,526 unique puzzles: 537 mate-in-one, 510 mate-in-two, 323 mate-in-three,
and 156 mate-in-four. Every puzzle retains its source game and ply.

## Development

Schness uses browser-native JavaScript modules and has no build step. The rules and bot are independent
of the eventual UI and peer-to-peer transport.

```sh
npm test
```

Serve the repository through any local HTTP server to play during development:

```sh
python3 -m http.server 8000
```

After GitHub Pages is enabled with **GitHub Actions** as its source, the `master` branch deploys
automatically. No account data or game state is stored on a server. Online peers discover each other
through public Nostr relays and then exchange legal actions over WebRTC. Some restrictive networks may
not permit a direct peer connection.

Current implementation:

- Pure rules engine and legal-action generator
- King-placement phase
- Move, capture, and drop rules
- Check, checkmate, stalemate, and threefold repetition
- Deterministic alpha-beta minimax foundation
- Node unit tests and GitHub Actions CI
- Mobile-first browser board following the original design
- Local human-vs-minimax play in a Web Worker
- Installable offline PWA shell
- Unique UUID game URLs for bot matches and private P2P invitations
- Serverless Trystero/WebRTC invite play using public Nostr relays
- Per-move validation and position hashes at the network boundary
- Persistent light and dark themes, with the device preference used on first visit
- Ephemeral peer-to-peer match chat with validation and no stored transcript
- Opt-in WebRTC voice chat, with microphone mute and mutual consent before audio starts
- Device-local communication preferences; text and voice are both off by default
- Optional chess clocks, move history, undo, and step-back review
- Keyboard play and screen-reader announcements
- Landscape and portrait layouts, with the board bounded by the window on both
- WCAG AA contrast in both themes, measured in the test suite
- 1,526 exact, source-linked checkmate puzzles with selectable or mixed difficulty
- Tap-and-drag play across matches, Bot Arena, puzzles, and playable rule demonstrations
- Full visual reserve trays on live, puzzle, tutorial, and recorded-game boards
- First-visit interactive tutorial, with a replay control in Settings
- Permanent GitHub Release archives for tournament and puzzle research bundles

## Roadmap

The original repository did not preserve a numbered V2/V3 plan, so the versions are now defined here:

- **V2 — social and presentation:** light/dark themes, private in-match P2P text chat, quick messages,
  and opt-in voice chat. Implemented.
- **V3 — competitive play:** optional chess clocks and a move-history/replay view. Implemented;
  untimed remains the default.

Beyond V3 the work has been correctness and craft rather than features: see the Log at the end of
[`DECISIONS.md`](DECISIONS.md), and its Known gaps for what is deliberately still open.
