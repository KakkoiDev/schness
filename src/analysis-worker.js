import { scorePosition } from './bot.js';
import { mateOutlookAtDepth, movesAllowingMate } from './training.js';

self.onmessage = ({ data }) => {
  const { position, mate, advantage, risks, request } = data;
  try {
    let scored = false;
    if (mate && position.phase === 'play') {
      const memo = new Map();
      for (let depth = 1; depth <= 4; depth += 1) {
        const result = mateOutlookAtDepth(position, depth, memo);
        if (result) {
          self.postMessage({ request, kind: 'mate', result });
          break;
        }
        // In a live human turn, surface dangerous candidate moves early.
        if (risks && depth <= 2) {
          const actions = movesAllowingMate(position, depth, memo);
          if (actions.length) self.postMessage({ request, kind: 'risk', depth, actions });
        }
        self.postMessage({ request, kind: 'progress', depth });
        if (advantage && depth === 1) {
          self.postMessage({ request, kind: 'advantage', score: scorePosition(position, 3) });
          scored = true;
        }
        if (depth === 4) self.postMessage({ request, kind: 'mate', result: null });
      }
    }
    if (advantage && !scored) self.postMessage({ request, kind: 'advantage', score: scorePosition(position, 3) });
  } catch (error) {
    self.postMessage({ request, kind: 'error', error: String(error) });
  }
};
