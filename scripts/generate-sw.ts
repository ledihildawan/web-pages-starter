import path from 'node:path';
import { i18nConfig } from '../configs/i18n';
import {
  getErrorPageSlugs,
  getRootPageSlug,
  getSystemPageSlug,
} from '../configs/pages';
import { PATHS } from '../configs/paths';
import { logBox } from './shared/logger';
import { writeFilePath } from './shared/write-file';

const OUTPUT = path.join(PATHS.ROOT, 'public', 'sw.js');

const defaultLocale = i18nConfig.defaultLocale;
const rootSlug = getRootPageSlug(defaultLocale);
const [
  notFoundSlug,
  unauthorizedSlug,
  forbiddenSlug,
  serverErrorSlug,
  maintenanceSlug,
  offlineErrorSlug,
] = getErrorPageSlugs(defaultLocale);
const offlineSlug = getSystemPageSlug('offline', defaultLocale);

const swContent = `const CACHE_NAME = 'starter-v5';
const BASE = new URL('.', self.location.href).pathname;
const ERROR_PAGES = [
  \`\${BASE}${notFoundSlug}.html\`,
  \`\${BASE}${unauthorizedSlug}.html\`,
  \`\${BASE}${forbiddenSlug}.html\`,
  \`\${BASE}${serverErrorSlug}.html\`,
  \`\${BASE}${maintenanceSlug}.html\`,
  \`\${BASE}${offlineErrorSlug}.html\`,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache
        .addAll([BASE, ...ERROR_PAGES, \`\${BASE}manifest.json\`])
        .catch(() => Promise.resolve());
    }),
  );
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request)
        .then((response) => {
          if (response?.status !== 200 || response.type === 'opaque')
            return response;

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch(() => {});
          });

          return response;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match(\`\${BASE}${offlineSlug}.html\`);
          }
        });
    }),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((cacheName) =>
            cacheName === CACHE_NAME ? null : caches.delete(cacheName),
          ),
        ),
      ),
  );
  self.clients.claim();
});
`;

writeFilePath(OUTPUT, swContent);

logBox('Generate SW', {
  Locale: defaultLocale,
  Root: rootSlug,
  Version: 'starter-v5',
  Output: 'public/sw.js',
});
