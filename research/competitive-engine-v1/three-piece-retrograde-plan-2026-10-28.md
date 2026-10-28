# Preregistered finite-subgame diagnostic

The compulsory-action prototype has no demonstrated winning save and stays unadopted. Stop its family. Current search/evaluation inspection supplies no supported coefficient, reduction guard or ordering change. A different source of evidence is needed before another candidate.

## Falsifiable question

Does current competitive search choose an action that changes an independently solved win/draw/loss outcome in the closed three-piece subgame of two kings and one rook, including that rook in either capture bank? This uses complete graph outcomes, including draws, rather than another selected short-mate horizon or reference-score agreement. A disagreement is a synthetic diagnostic, not evidence of playing-strength gain.

## Fixed construction and limits

Use unchanged shared quiet six-slot capture-bank rules and separately frozen v5 legal transitions. Enumerate white king square, black king square, rook owner and location (unoccupied board square or its owner's bank), then side to act in numeric order. There are at most14,400 candidate states before legality filtering. Start each diagnostic position with its current repetition key counted once and no earlier history. Exclude malformed boards, adjacent kings and positions where the side that just moved remains in check; retain counts and reasons for every excluded candidate. Preserve other template fields required by frozen rules.

Build the closed graph with at most20,000 retained states,200,000 generated edges and10 seconds total construction time. Check closure explicitly: every legal transition must map to an enumerated state or an adjudicated terminal. If a cap or closure check fails, retain the partial graph and stop; do not raise caps or infer outcomes. First retain source/input hashes, exact enumeration order, counts and failed attempts.

Only a complete closed graph permits retrograde win/loss/draw solving. Terminal winners seed the attractor. A player wins when one successor wins for that player; loses when every successor loses; unresolved states are draw candidates. Store distance/rank certificates and independently verify every classified state's existential/universal successor condition. Verify a residual nonlosing strategy and terminal-draw handling before calling residual states draws. Extra turns must use actual side identity rather than assumed alternation.

## History boundary and later search comparison

The graph omits earlier repetitions and must never become a production score cache. Winning certificates must decrease rank on every defender response and on the selected attacker action, so their proof paths cannot repeat. Draw claims need an explicit nonlosing strategy under the real threefold rule; if this is not verified, label unresolved states unresolved. Earlier repetition counts can change an answer and remain outside this diagnostic. No claim covers arbitrary game histories, all36 variants or larger material.

Do not launch search comparisons during graph construction. If complete and certified, preregister a small deterministic sample spanning solved wins/losses/draws, board/bank states and both colors, with no score-selected replacements. Compare legal chosen successors at unchanged100ms. Only an independently certified outcome-changing error can motivate a separate bounded candidate; shorter mates alone do not. No automatic adoption, strength screen, promotion or budget increase follows.
