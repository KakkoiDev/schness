# Rechargeable checking-drop banks

Authorized in chat: banks start at zero, maximum 1/2/3 checking-drop charges. King placement
does not charge. Every own play action other than a checking drop restores one charge up to
the cap, including normal checking moves and a forced wait. A checking drop requires and
spends one charge, with no same-turn recharge. Drop-checkmate remains legal when charged.
Normal board checks spend nothing. Players can save charges and spend them on consecutive
own turns. No first-turn checking drop is possible for either color.

Six recipes cross the three caps with capture/return cooldown 0 or 1, on four-slot capture
banks. Captures transfer pieces; overflow returns to the captured side. All initial reserve
pieces are ready. Other movement, checkmate, repetition and stalemate rules are unchanged.
Capture cooldown and checking-drop recharge are independent resources. Charge state is part
of hashes, legal generation, immutable transitions and full replay validation.

576 games = six recipes × fresh seeds 20261801–20261806 × 16 starts. Research Sharp depth 4,
200 total plies, eight local workers. Adapter identity variant-objective-search-v3 records
the new resource. Bot/search/evaluation code is unchanged from v2; no extra heuristic value
is assigned to stored charges, though legal mobility reflects readiness. This limits claims
about optimal resource management. Do not pool with prior engine/adapter datasets.

Prepare, then run the printed frozen runtime command:

    node research/check-charge-v1/run.js --output output/local-experiments/check-charge-v1-2026-10-25 --workers 8

After runner exits, validate frozen --resume, generate report/rates with report.js and archive
all replay bundles/runtime/manifest using scripts/archive-local-experiments.py. Commit full
compressed parts/checksums and readable reports/progress/findings on GitHub. No automatic
expansion, mid-run tuning, merge or official adoption. Screening targets remain >=80% decisive
and White taking 45–55% of decisive games; six seeds repeat 16 starts, not independent positions.
