const CACHE = 'schness-v12';
const SHELL = [
  './',
  './index.html',
  './game.html',
  './styles.css',
  './manifest.webmanifest',
  './icon.svg',
  './src/main.js',
  './src/lobby.js',
  './src/rules.js',
  './src/interaction.js',
  './src/game-message.js',
  './src/navigation.js',
  './src/theme.js',
  './src/chat.js',
  './src/communication.js',
  './src/settings.js',
  './src/board-ui.js',
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
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
