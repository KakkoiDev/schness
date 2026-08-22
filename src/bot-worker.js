import { chooseAction } from './bot.js';

self.addEventListener('message', ({ data }) => {
  const { position, depth = 4, request } = data;
  try {
    self.postMessage({ action: chooseAction(position, { depth }), request });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : String(error), request });
  }
});
