# decision-core

Exploratory specifications for a model-assisted reasoning library for software workflows.

Status: idea capture, 26 October 2026. Markdown only. No implementation, engine version, implementation schedule or performance promise is established.

## Idea

A model supplies semantic interpretation; an explicit reasoning layer explores consequences defined by the application. Resolve cases supported by facts and rules, and ask for missing information or use a model when the available evidence is insufficient.

The initial application to investigate is pi-local-harness: tool selection, prerequisites, recovery and bounded execution planning. This document does not claim its current architecture has been inspected.

## Documents

- [Vision and boundaries](specs/vision.md)
- [Conceptual architecture](specs/architecture.md)
- [Possible pi-local-harness application](specs/pi-local-harness.md)
- [Evaluation and open questions](specs/evaluation.md)

## Relationship to existing work

The idea emerged from Schness Sharp v7 search optimization. Fast game search suggests useful engineering techniques; it does not demonstrate general reasoning or classification ability. The existing gaming-core library remains separate. Future reuse, extraction, ownership and interfaces require investigation.

This is not a Schness v8 proposal. No Schness behavior changes, new game experiments or model deployment are authorized by these specifications. decision-core is a working name.
