# Evaluation and open questions

## Proposed comparisons

On the same held-out workflow examples, compare model alone, simple rules plus model, and a reasoning gate plus model. Include parser cost and errors in end-to-end results. Use representative failures and ambiguous cases, not only examples constructed from the rules.

Measure total p50/p95 latency, throughput, cost, model calls avoided, routing accuracy, successful task completion, incorrect resolved decisions, abstention coverage and recovery behavior. Report accuracy against coverage rather than a single confidence score. Separate an inferred answer from an outcome actually verified by execution.

If gate cost is G, model cost M, and fraction resolved before any model call is r, expected cost is G + (1-r)M. Savings require G < rM under those assumptions. A model-first parser changes this accounting: include its cost on every parsed request, and measure avoided downstream calls separately. No savings are assumed.

## Future validation categories

- Unknown versus false; contradictory and incomplete facts.
- Exhaustive small reference problems for planner correctness.
- Budget exhaustion, cycles and deterministic replay where supported.
- Parser mistakes and alternative interpretations.
- Stale state, changing prerequisites and cache invalidation.
- Untrusted content attempting to change rules or authorization.
- Separation of feasible, optimal, impossible and unresolved results.
- End-to-end comparisons using frozen versions and held-out thresholds.

These are proposed requirements, not implemented tests.

## Open questions

- Which concrete pi-local-harness decision has enough explicit structure to justify search?
- What is already solved more simply by rules or existing planners?
- Which components genuinely belong in gaming-core versus a separate decision-core?
- Can a fixed-question classifier extract the needed facts, or is a structured extractor required?
- How should uncertain interpretations be represented without combinatorial explosion?
- Which facts and effects can be verified, and which remain predictions?
- What quality, abstention and latency targets justify future implementation?
- Which model, runtime, license and deployment arrangement fit the workflow?

## References and provenance

The idea was discussed with the project owner on 26 October 2026. Preserve it for future exploration; no implementation is requested at this stage.

- [Jev official introduction](https://typesafe.ai/blog/introducing-system-one-models-and-jev): typed probabilistic decisions from application state.
- [Laya upstream repository](https://github.com/NandhaKishorM/laya): open decision-model tooling.

Model capabilities, APIs and performance require fresh verification before any future integration. Provider confidence claims are not a substitute for application-specific evaluation.
