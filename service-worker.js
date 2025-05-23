self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open('kosmos-cache-v1').then((cache) => {
        return cache.addAll([
          '/',
          '/index.html',
          '/logos/logo.png',
          '/css/style.css',
          '/app.js'
        ]);
      })
    );
  });
  
  self.addEventListener('fetch', (event) => {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  });
  