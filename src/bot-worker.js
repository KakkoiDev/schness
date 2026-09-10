import { chooseAction } from './bot.js';

self.addEventListener('message', ({ data }) => {
  const { position, depth = 4, repetitionAversion = false, request } = data;
  try {
    self.postMessage({ action: chooseAction(position, { depth, repetitionAversion }), request });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : String(error), request });
  }
});
