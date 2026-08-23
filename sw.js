const CACHE = 'schness-v2';
const SHELL = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './icon.svg',
  './src/main.js',
  './src/rules.js',
  './src/interaction.js',
  './src/game-message.js',
  './src/navigation.js',
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
    event.respondWith(fetch(event.request).catch(() => caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
