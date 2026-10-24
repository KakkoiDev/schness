# Symmetric Classic armies — v1

31 armies: all multisets of 2, 3 or 4 non-king pieces from rook/bishop/knight. Every player also
has one mandatory king, and both sides have the same army. Standard RBN is the control. Duplicates
are allowed (including multiple rooks). Queens, pawns and fairy pieces are not in this screen.

Classic Schness only: 4×4, ordinary king placement, quiet drops, captures return to the current
owner, usual checkmate/stalemate/threefold repetition. No bank transfer/capacity, cooldown, new
win condition or altered movement. Starting reserve multiplicity is conserved separately for
each owner. A 4-piece army does not require fully deploying every piece simultaneously.

Frozen Sharp v2 depth 4 on both sides. Three fresh seeds 20261401–20261403 × all 16 king starts =
48 games per army, 1,488 total, 200 total plies per game. Initial two workers keep total CPU use
bounded alongside the balance screen. These are screening results; repeat finalists on fresh
seeds and with the same stronger engine for both sides. Results do not establish human balance.

The new adapter-based production search is deliberately not used here: only army composition
should change. The army list is committed with the exact executed runtime and source hashes.

Prepare:

    node research/armies-v1/run.js --output output/local-experiments/NEW-RUN --workers 2

Run with the frozen resume command printed by prepare. After completion:

    node research/armies-v1/report.js output/local-experiments/RUN
    python3 scripts/archive-local-experiments.py output/local-experiments/RUN research/data/RUN

Commit archive parts/checksums plus reports. Compare decisiveness and White's share of wins,
raw counts, draws by reason, game length and duplicate-army behavior. Separate army sizes when
interpreting results. Adding pieces can increase congestion rather than tactical richness.
