# Schness

Schness is a compact chess variant played on a 4×4 board. Each player owns a king, rook, bishop,
and knight. The board starts empty; players place their kings on their home ranks, then alternate
between moving a deployed piece and dropping a banked piece onto an empty square.

A drop may not give check. Captured non-king pieces return to their original owner's bank. Check,
checkmate, king safety, and stalemate otherwise work as in chess. Threefold repetition is a draw.

Contributing agents and humans: read [`DECISIONS.md`](DECISIONS.md) before changing anything. It
records the architecture and the invariants that are load-bearing, and it is kept current in the
same commit as the change that affects it.

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

## Roadmap

The original repository did not preserve a numbered V2/V3 plan, so the versions are now defined here:

- **V2 — social and presentation:** light/dark themes, private in-match P2P text chat, quick messages,
  and opt-in voice chat. Implemented.
- **V3 — competitive play:** optional chess clocks and a move-history/replay view. Implemented;
  untimed remains the default.

Beyond V3 the work has been correctness and craft rather than features: see the Log at the end of
[`DECISIONS.md`](DECISIONS.md), and its Known gaps for what is deliberately still open.
