// Service Worker — KRS Klassenarbeitsplan
const CACHE_NAME = 'krs-ka-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://esm.sh/preact@10.19.3',
  'https://esm.sh/preact@10.19.3/hooks',
  'https://esm.sh/htm@3.1.1'
];

// Install: Cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activate: Clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: Network-first for API, cache-first for assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // API calls: network only
  if (url.hostname === 'script.google.com') {
    event.respondWith(fetch(event.request));
    return;
  }

  // Assets: cache-first, fallback to network
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cache successful responses
        if (response.ok && (url.protocol === 'https:' || url.protocol === 'http:')) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    }).catch(() => {
      // Offline fallback
      if (event.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
    })
  );
});
