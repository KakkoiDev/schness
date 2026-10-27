import { analyzeAction } from './bot.js';

self.addEventListener('message', ({ data }) => {
  const { position, reducePrincipalVariation, protectHistoryMoves, exchangeOrdering, stagedMoveSelection, cacheEvaluation, cacheQuiescence, reduceQuietDrops, profile, depth, strength, maxNodes, maxMillis, repetitionAversion, analyze = false, multiPv, quiescenceDepth, quiescenceEvasionDepth, quiescenceChecks, lateMoveReduction, request } = data;
  try {
    const analysis = analyzeAction(position, { ...(reducePrincipalVariation===undefined?{}:{reducePrincipalVariation}), ...(protectHistoryMoves===undefined?{}:{protectHistoryMoves}), ...(exchangeOrdering===undefined?{}:{exchangeOrdering}), ...(stagedMoveSelection===undefined?{}:{stagedMoveSelection}), ...(cacheEvaluation===undefined?{}:{cacheEvaluation}), ...(cacheQuiescence===undefined?{}:{cacheQuiescence}), ...(reduceQuietDrops===undefined?{}:{reduceQuietDrops}), ...(profile===undefined?{}:{profile}), ...(depth===undefined?{}:{depth}), ...(strength===undefined?{}:{strength}), ...(maxNodes===undefined?{}:{maxNodes}), ...(maxMillis===undefined?{}:{maxMillis}), ...(repetitionAversion===undefined?{}:{repetitionAversion}), ...(multiPv===undefined?{}:{multiPv}), ...(quiescenceDepth===undefined?{}:{quiescenceDepth}), ...(quiescenceEvasionDepth===undefined?{}:{quiescenceEvasionDepth}), ...(quiescenceChecks===undefined?{}:{quiescenceChecks}), ...(lateMoveReduction===undefined?{}:{lateMoveReduction}) });
    self.postMessage({ action: analysis.action, ...(analyze ? {analysis} : {}), request });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : String(error), request });
  }
});
