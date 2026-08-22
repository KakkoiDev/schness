# Schness

Schness is a compact chess variant played on a 4×4 board. Each player owns a king, rook, bishop,
and knight. The board starts empty; players place their kings on their home ranks, then alternate
between moving a deployed piece and dropping a banked piece onto an empty square.

A drop may not give check. Captured non-king pieces return to their original owner's bank. Check,
checkmate, king safety, and stalemate otherwise work as in chess. Threefold repetition is a draw.

## Development

Schness uses browser-native JavaScript modules and has no build step. The rules and bot are independent
of the eventual UI and peer-to-peer transport.

```sh
npm test
```

Current implementation:

- Pure rules engine and legal-action generator
- King-placement phase
- Move, capture, and drop rules
- Check, checkmate, stalemate, and threefold repetition
- Deterministic alpha-beta minimax foundation
- Node unit tests and GitHub Actions CI

Planned next:

- Browser board and local bot play
- Offline PWA shell
- Trystero/WebRTC online play, following the `kakkoi-online` architecture
- Optional chess clocks after the untimed game is complete
