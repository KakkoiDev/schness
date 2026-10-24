# Wave 3: where, how and with which piece may a drop check?

2026-10-24. Seven new opt-in presets; no change to Classic. These isolate spatial restrictions,
support and piece identity instead of adding more development timers.

| Preset | Checking-drop rule | Hypothesis |
|---|---|---|
| home-half-check | Must land in the mover's own two ranks | Allow long-range threats without immediate invasion |
| distant-check | Must land at Chebyshev distance >= 2 from enemy king | Remove adjacent checking deployments while retaining rays and knight checks |
| supported-check | Landing square attacked by another friendly piece after deployment | Reward board development; king support counts; pinned supporters count as attacks |
| countercheck-only | Mover must already be in check; action must also resolve it | Make checking drops a defensive resource rather than an opening attack |
| knight-check | Only knight drops may check | Test jumping checks without checking rook/bishop deployment |
| bishop-check | Only bishop drops may check | Isolate diagonal deployment threats |
| rook-check | Only rook drops may check | Isolate orthogonal deployment threats |

All quiet drops and ordinary moves follow existing legality. Distance counts rows and files, not
legal king paths. Support is geometric attack, not a legal-move test, so pins are explicit rather
than ambiguous. Captured pieces still return to original owner. No new historical rights are
needed: geometry, pieces and existing board state determine these policies. Ruleset identity
continues to distinguish hashes, replays and research manifests. Shared registry also exposes
these presets in Bot Arena and Random variant.

## Experiment schedule

Nine presets including canonical and recurring-protection controls; three seeds 20261027–29;
80 games per preset/seed = **2,160 pilot games**. The same five AI matchups and all sixteen king
starts are covered. Existing combined screening criteria are retained: >=48 decisive games,
White decisive share 40–60%, median normal-play length >=20, >=120 unique transcripts, no blocked
setup. Controls never auto-expand. Each qualifying new preset expands to three 1,040-game
schedules (3,120 games); their pilot prefixes are included, so never pool stages. All seeds and
failed screens are retained; a failed screen is not proof of unviability.

The workflow verifies unit and full desktop/mobile suites first. At most two research jobs run
concurrently to avoid flooding the account while wave 2 is active. Jobs have a 330-minute timeout,
upload partial data even on failure, and successful batches archive to a GitHub release. Finite
search and 200-ply adjudication can distort apparent balance; inspect equal-strength subsets,
repetitions, piece use and opening traces before making a recommendation. No dynamic boards or
fairy pieces are implemented in this wave.
