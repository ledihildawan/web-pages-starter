import { i18nConfig } from '@config/i18n';
import { resolveRoot } from '@config/paths';
import { getErrorPageSlugs, getRootPageSlug, getSystemPageSlug } from '@page-engine';
import { logBox } from './lib/logger';
import { writeFilePath } from './lib/write-file';

const OUTPUT = resolveRoot('public', 'service-worker.js');

const rootSlug = getRootPageSlug(i18nConfig.defaultLocale);
const [notFoundSlug, unauthorizedSlug, forbiddenSlug, serverErrorSlug, maintenanceSlug, offlineErrorSlug] =
  getErrorPageSlugs(i18nConfig.defaultLocale);
const offlineSlug = getSystemPageSlug('offline', i18nConfig.defaultLocale);

const CACHE_VERSION = `starter-${Date.now().toString(36)}`;

const swContent = `const CACHE_NAME = '${CACHE_VERSION}';
const BASE = new URL('.', self.location.href).pathname;
const ERROR_PAGES = [
  \`\${BASE}${notFoundSlug}.html\`,
  \`\${BASE}${unauthorizedSlug}.html\`,
  \`\${BASE}${forbiddenSlug}.html\`,
  \`\${BASE}${serverErrorSlug}.html\`,
  \`\${BASE}${maintenanceSlug}.html\`,
  \`\${BASE}${offlineErrorSlug}.html\`,
];
const PRECACHE_URLS = [BASE, ...ERROR_PAGES, \`\${BASE}manifest.json\`, \`\${BASE}favicon.svg\`];

const logCacheError = (context, url) => {
  console.warn(\`[SW] Cache error in \${context}: \${url}\`);
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).catch((err) => {
      console.warn('[SW] Precache failed:', err);
    }),
  );
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (!request.url.startsWith(self.location.origin)) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch((err) => logCacheError('navigate', request.url));
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match(\`\${BASE}${offlineSlug}.html\`)),
        ),
    );
    return;
  }

  const isI18nAsset = request.url.includes('/assets/i18n/');
  if (isI18nAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          fetch(request)
            .then((response) => {
              if (response?.status === 200 && response.type !== 'opaque') {
                const clone = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch((err) => logCacheError('i18n', request.url));
              }
            })
            .catch((err) => logCacheError('i18n fetch', request.url));
          return cached;
        }
        return fetch(request)
          .then((response) => {
            if (response?.status === 200 && response.type !== 'opaque') {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch((err) => logCacheError('i18n', request.url));
            }
            return response;
          })
          .catch(() => cached);
      }),
    );
    return;
  }

  const isStaticAsset = /.(js|css|woff2?|png|jpg|jpeg|webp|svg|gif|ico|avif|webm|mp4)$/.test(request.url);
  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          fetch(request)
            .then((response) => {
              if (response?.status === 200 && response.type !== 'opaque') {
                const clone = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch((err) => logCacheError('static', request.url));
              }
            })
            .catch((err) => logCacheError('static fetch', request.url));
          return cached;
        }
        return fetch(request)
          .then((response) => {
            if (response?.status === 200 && response.type !== 'opaque') {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch((err) => logCacheError('static', request.url));
            }
            return response;
          })
          .catch(() => cached);
      }),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response?.status === 200 && response.type !== 'opaque') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch((err) => logCacheError('general', request.url));
          }
          return response;
        })
        .catch(() => cached);
    }),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.map((n) => (n === CACHE_NAME ? null : caches.delete(n))))),
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'GET_VERSION') {
    event.ports[0]?.postMessage({ version: CACHE_NAME });
  }
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
`;

writeFilePath(OUTPUT, swContent);

logBox('Generate Service Worker', {
  Locale: i18nConfig.defaultLocale,
  Root: rootSlug,
  Version: CACHE_VERSION,
  Output: 'public/service-worker.js',
});
