const CACHE_NAME = 'kosmos-cache-v2'; // Cambia questo ogni volta che aggiorni

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/logos/logo.png',
  '/css/style.css',
  '/app.js'
];

// INSTALL: Cache iniziale
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Attiva subito il nuovo SW
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// ACTIVATE: Pulisce le vecchie cache
self.addEventListener('activate', (event) => {
  clients.claim(); // Prende subito il controllo
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
});

// FETCH: Usa cache, poi rete
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});
