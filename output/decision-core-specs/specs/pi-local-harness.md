# Possible first application: pi-local-harness

This is a conceptual candidate, not an assessment of current repository capabilities. Inspect the repository and its instructions before proposing integration.

## Candidate questions

| Decision | Explicit reasoning contribution | Possible model contribution |
|---|---|---|
| Tool selection | Filter capabilities, availability and permissions | Interpret intent and candidate tool suitability |
| Action readiness | Check prerequisites and host authorization evidence | Identify missing semantic facts |
| Recovery | Compare bounded retries and alternative paths | Interpret an unfamiliar failure |
| Plan selection | Explore feasible sequences and estimated costs | Suggest candidate actions or decompositions |
| Clarification | Identify missing facts that change outcomes | Phrase a question for the user |

## Illustrative scenario

A request has two potential tool routes. Route A is initially attractive but requires an unavailable credential later. Route B satisfies known prerequisites. A bounded planner can identify the dead end before execution, provided those dependencies are explicitly modeled. It cannot discover an undocumented dependency by searching more deeply.

Another case is a request whose authorization is ambiguous. A parser may extract the requested operation but must not infer permission solely from text that resembles an instruction. The harness checks trusted authorization independently and asks the user when required by its policy.

## Future exploration boundaries

Possible initial study: offline traces or shadow decisions, with no action execution. Compare reasoning results with actual outcomes. This is a future study proposal, not authorization to collect data, call a paid model, modify the harness or run experiments now.

Success would mean fewer avoidable dead ends or model calls at acceptable total latency and decision quality. The engine should abstain when its representation cannot support a decision.
