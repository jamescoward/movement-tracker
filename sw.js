const CACHE_NAME = 'movement-tracker-v7';

// Use relative URLs so the SW works on any deployment path
// (e.g. GitHub Pages at /repo-name/ or a custom domain at /)
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './storage.js',
  './log.js',
  './chart.html',
  './chart.js',
  './week.html',
  './week.js',
  './heatmap.html',
  './heatmap.js',
  './settings.html',
  './data-io.js',
  './settings.js',
  './correlation.html',
  './correlation.js',
  './manifest.json',
];

// Install: cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activate: remove old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: cache-first strategy for app shell
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Cache successful responses for same-origin requests
        if (response.ok && event.request.url.startsWith(self.location.origin)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback: return a basic offline response for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return new Response('', { status: 503, statusText: 'Offline' });
      });
    })
  );
});
