import { i18nConfig } from '@config/i18n';
import { resolveRoot } from '@config/paths';
import { getErrorPageSlugs, getRootPageSlug, getSystemPageSlug } from '@page-engine';
import { logBox } from './lib/logger';
import { writeFilePath } from './lib/write-file';

const OUTPUT = resolveRoot('public', 'sw.js');

const rootSlug = getRootPageSlug(i18nConfig.defaultLocale);
const [notFoundSlug, unauthorizedSlug, forbiddenSlug, serverErrorSlug, maintenanceSlug, offlineErrorSlug] =
  getErrorPageSlugs(i18nConfig.defaultLocale);
const offlineSlug = getSystemPageSlug('offline', i18nConfig.defaultLocale);

const swContent = `const CACHE_NAME = 'starter-v6';
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

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {})),
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
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match(\`\${BASE}${offlineSlug}.html\`)),
        ),
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
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
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
`;

writeFilePath(OUTPUT, swContent);

logBox('Generate SW', {
  Locale: i18nConfig.defaultLocale,
  Root: rootSlug,
  Version: 'starter-v6',
  Output: 'public/sw.js',
});
