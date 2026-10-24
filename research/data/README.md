# Preserved experiment data

Each run directory contains archive.json and compressed archive parts. archive.json records
individual part SHA-256 hashes, total archive SHA-256, source fingerprint and game count.
Concatenate the parts in numeric order, verify the full checksum, then extract the tar.gz.
Archives preserve the exact executed runtime, manifest and full replay bundles. All original
per-game information is in the bundles; redundant checkpoint files are omitted.

- all-variants-2026-10-24: completed 8,640 games across 36 presets and five AI pairings.
- balance-v1-smoke-2026-10-24: 32 clipped execution-check games; not balance evidence.
- balance-v1-2026-10-24: main Sharp-only batch; manifest committed before completion.
- home-setup-v1-2026-10-24: later home-row setup supplement; manifest committed before completion.

A manifest without archive parts identifies a prepared/running batch, not completed results.
Reports must state completion status. Local checkpoint outputs stay ignored by Git; the committed
compressed archives are the durable record.
