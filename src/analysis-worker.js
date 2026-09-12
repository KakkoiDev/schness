import { scorePosition } from './bot.js';
import { forcedMate } from './puzzle.js';

self.onmessage = ({ data }) => {
  const { position, mate, advantage, request } = data;
  try {
    if (advantage) self.postMessage({ request, kind: 'advantage', score: scorePosition(position, 3) });
    if (mate && position.phase === 'play') {
      const memo = new Map();
      for (let depth = 1; depth <= 4; depth += 1) {
        const result = forcedMate(position, depth, memo);
        if (result) {
          self.postMessage({ request, kind: 'mate', side: position.turn, moves: result.moves });
          return;
        }
        self.postMessage({ request, kind: 'progress', depth });
      }
      self.postMessage({ request, kind: 'mate', side: position.turn, moves: null });
    }
  } catch (error) {
    self.postMessage({ request, kind: 'error', error: String(error) });
  }
};
