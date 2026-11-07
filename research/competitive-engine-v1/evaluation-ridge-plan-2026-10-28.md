# Preregistered one-fit calibration test

The64-record teacher dataset has already been inspected descriptively:45cp/19mate, unequal residual means across even/odd starts. The odd group is therefore a reserved model-validation group, **not an untouched independent holdout**. This exploratory fit cannot establish strength. No current engine coefficient changes accompany this plan.

## Fixed model and split

Use only existing raw cp records, converted to white perspective exactly as in the retained analysis. Keep all64 records in the result artifact and report19 mate records separately; never assign mate a cp number. Even start identifiers are training (22cp); odd starts are validation (23cp), with both candidate colors and snapshots from a start always in one group. Do not move records, trim outliers, query more labels or choose another split.

Use the four already measured contribution columns, in order: material, mobility, check, combined positional. These include their current production coefficients. Divide every column and target cp by500 (fixed units, no dataset-dependent scaling). Fit a multiplier for each contribution with no intercept or side-to-move feature, preserving evaluation antisymmetry.

Exactly one deterministic ridge solution: minimize mean squared training error plus0.1 times the squared Euclidean distance of the four multipliers from(1,1,1,1). Solve the4×4 normal equations in double precision; record matrix, right-hand side, condition estimate or residual, coefficients, input hashes and every prediction. No hyperparameter/model search, alternative seeds, clipping, refitting on validation or feature additions. If any multiplier is outside[0,4], nonfinite, or the linear-system residual exceeds1e-8, reject the model rather than repair it by tuning. Round no coefficients in this analysis.

## Fixed acceptance and stopping

Report training and reserved-group MAE, median absolute error and RMSE against the unchanged baseline sum, plus start-level paired MAE changes. This is teacher prediction, not a decision oracle. The exploratory model passes only if training MAE improves, validation MAE improves by at least10%, and at least half of validation starts with cp labels improve strictly. It must also pass multiplier/numerical bounds. Do not pick a different metric after seeing the result.

Failure ends this four-term ridge family on this dataset: no lambda, split, outlier, feature or coefficient revisions. Success permits only a separately preregistered fresh disjoint teacher-validation dataset before a source prototype; it does not authorize a game screen, production option, promotion or strength claim. The observed64 labels cannot become that fresh validation set. Any eventual evaluator must preserve terminal/mate scores, default/reference behavior, rules, history/cache/restoration, all36 variants and independent mate/oracle coverage, and demonstrate bounded search cost.

No browser, opponent or new search queries are required for this fit. Preserve all failed results and the original raw categorical labels.
