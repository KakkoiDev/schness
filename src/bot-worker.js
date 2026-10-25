import { chooseAction } from './bot.js';

self.addEventListener('message', ({ data }) => {
  const { position, depth, strength, maxNodes, maxMillis, repetitionAversion = false, request } = data;
  try {
    self.postMessage({ action: chooseAction(position, { ...(depth===undefined?{}:{depth}), ...(strength===undefined?{}:{strength}), ...(maxNodes===undefined?{}:{maxNodes}), ...(maxMillis===undefined?{}:{maxMillis}), repetitionAversion }), request });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : String(error), request });
  }
});
