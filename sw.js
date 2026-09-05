// Bumped whenever anything in SHELL changes. The fetch handler below no longer
// depends on remembering to do it — it revalidates in the background — but a
// bump is still the only thing that refreshes every client on the same visit.
const CACHE = 'schness-v37';
const SHELL = [
  './',
  './index.html',
  './game.html',
  './styles.css',
  './manifest.webmanifest',
  './icon.svg',
  './assets/pieces/wK.svg',
  './assets/pieces/wR.svg',
  './assets/pieces/wB.svg',
  './assets/pieces/wN.svg',
  './assets/pieces/bK.svg',
  './assets/pieces/bR.svg',
  './assets/pieces/bB.svg',
  './assets/pieces/bN.svg',
  './src/main.js',
  './src/lobby.js',
  './src/rules.js',
  './src/notation.js',
  './src/history.js',
  './src/keyboard.js',
  './src/settings.js',
  './src/communication.js',
  './src/clock.js',
  './src/sound.js',
  './src/interaction.js',
  './src/game-message.js',
  './src/navigation.js',
  './src/theme.js',
  './src/chat.js',
  './src/board-ui.js',
  './src/drag.js',
  './src/matchmaking.js',
  './src/net.js',
  './src/bot.js',
  './src/bot-worker.js',
  './vendor/trystero/nostr.js',
  './vendor/trystero/node-crypto.js',
  './vendor/trystero/node-chunk.js',
  './vendor/trystero/src/strategy.js',
  './vendor/trystero/src/utils.js',
  './vendor/trystero/src/crypto.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then((names) => Promise.all(names.filter((name) => name !== CACHE).map((name) => caches.delete(name))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    const fallback = url.pathname.endsWith('/game.html') ? './game.html' : './index.html';
    event.respondWith(fetch(event.request).catch(() => caches.match(fallback)));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => {
    // Stale-while-revalidate. Cache-first alone meant that a deploy which did
    // not bump CACHE was invisible: sw.js was byte-identical, so no update
    // ever installed, and every returning player kept the old shell forever.
    // Now the cached copy still answers immediately — offline included — and
    // the next visit has the new one.
    const network = fetch(event.request).then((response) => {
      if (response.ok && response.type === 'basic') {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
      }
      return response;
    });
    if (!cached) return network;
    event.waitUntil(network.catch(() => { /* offline: the cached copy stands */ }));
    return cached;
  }));
});
