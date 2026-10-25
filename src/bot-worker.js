import { analyzeAction } from './bot.js';

self.addEventListener('message', ({ data }) => {
  const { position, depth, strength, maxNodes, maxMillis, repetitionAversion = false, analyze = false, multiPv, quiescenceDepth, quiescenceChecks, lateMoveReduction, request } = data;
  try {
    const analysis = analyzeAction(position, { ...(depth===undefined?{}:{depth}), ...(strength===undefined?{}:{strength}), ...(maxNodes===undefined?{}:{maxNodes}), ...(maxMillis===undefined?{}:{maxMillis}), repetitionAversion, ...(multiPv===undefined?{}:{multiPv}), ...(quiescenceDepth===undefined?{}:{quiescenceDepth}), ...(quiescenceChecks===undefined?{}:{quiescenceChecks}), ...(lateMoveReduction===undefined?{}:{lateMoveReduction}) });
    self.postMessage({ action: analysis.action, ...(analyze ? {analysis} : {}), request });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : String(error), request });
  }
});
