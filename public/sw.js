/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'starter-v2';

// Install event - cache critical resources with error handling
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache critical HTML files with error handling
      return cache
        .addAll(['/', '/home.html', '/404.html', '/manifest.json'])
        .catch((error) => {
          console.warn('Cache add failed:', error);
          // Continue even if some resources fail to cache
          return Promise.resolve();
        });
    }),
  );
  self.skipWaiting();
});

// Fetch event - cache-first for assets, network-first for HTML
self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Don't cache chrome-extension, dev tools, etc.
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((response) => {
          // Don't cache if not successful or opaque response
          if (
            !response ||
            response.status !== 200 ||
            response.type === 'opaque'
          ) {
            return response;
          }

          // Clone the response before caching
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch((error) => {
              console.warn('Cache put failed:', error);
            });
          });

          return response;
        })
        .catch(() => {
          // Network failed, return offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/404.html');
          }
        });
    }),
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName === CACHE_NAME) {
            return null;
          }
          return caches.delete(cacheName);
        }),
      );
    }),
  );
  self.clients.claim();
});
