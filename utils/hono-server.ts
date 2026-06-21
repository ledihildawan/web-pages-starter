import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { i18nConfig } from '@config/i18n';
import { PUBLIC_FILENAMES } from '@constants';
import { serveStatic } from '@hono/node-server/serve-static';
import { CSP_NONCE_PLACEHOLDER } from '@i18n/constants';
import { getSystemPageSlug } from '@page-system';
import { Hono } from 'hono';
import { compress } from 'hono/compress';
import { log } from './logger';

const { faviconSvg, faviconIco, manifest, serviceWorker, robots, sitemap } = PUBLIC_FILENAMES;
const STATIC_ASSET_RE = new RegExp(
  `^\\/(?:locales\\/|assets\\/|fonts\\/|images\\/|${faviconSvg.replace('.', '\\.')}|${faviconIco.replace('.', '\\.')}|${manifest}|${serviceWorker}|${robots}|${sitemap}|.*\\.[a-z0-9]+$)`,
);
const FINGERPRINTED_ASSET_RE = /^\/(?:locales|assets|fonts|images)\//;
const HTML_RE = /\.html?$/;
const SW_RE = new RegExp(`\\/${serviceWorker}$`);
const ONE_YEAR = 31_536_000;
const ONE_HOUR = 3_600;

const getCacheControl = (urlPath: string): string => {
  if (SW_RE.test(urlPath)) return 'no-store, no-cache, must-revalidate, max-age=0';
  if (HTML_RE.test(urlPath)) return 'no-cache, must-revalidate, max-age=0';
  if (FINGERPRINTED_ASSET_RE.test(urlPath)) return `public, max-age=${ONE_YEAR}, immutable`;
  if (/\.(?:json|xml|txt|svg|ico)$/.test(urlPath)) return `public, max-age=${ONE_HOUR}`;

  return 'public, max-age=0, must-revalidate';
};

function scanHtmlFiles(dir: string, basePath: string): Array<{ key: string; content: string }> {
  const results: Array<{ key: string; content: string }> = [];

  if (!existsSync(dir)) return results;

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const childBase = basePath ? `${basePath}/${entry.name}` : entry.name;

      results.push(...scanHtmlFiles(fullPath, childBase));
    } else if (entry.name.endsWith('.html')) {
      const key = basePath ? `${basePath}/${entry.name.replace(/\.html$/, '')}` : entry.name.replace(/\.html$/, '');

      results.push({ key, content: readFileSync(fullPath, 'utf8') });
    }
  }
  return results;
}

export function loadHtmlCache(distDir: string): Map<string, string> {
  const cache = new Map<string, string>();

  for (const { key, content } of scanHtmlFiles(distDir, '')) {
    cache.set(key, content);
  }

  return cache;
}

export function getPageNames(distDir: string): string[] {
  return scanHtmlFiles(distDir, '').map((f) => f.key);
}

function generateNonce(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

function injectNonce(html: string, nonce: string): string {
  let result = html.replace(new RegExp(CSP_NONCE_PLACEHOLDER, 'g'), nonce);

  result = result.replace(/window\.__CSP_NONCE__\s*=\s*(?:undefined|void 0)/, `window.__CSP_NONCE__ = '${nonce}'`);

  return result;
}

export function createStaticApp(distDir: string, htmlCache?: Map<string, string>): Hono {
  const cache = htmlCache ?? loadHtmlCache(distDir);

  const app = new Hono();

  app.use('*', compress());
  app.use('*', async (c, next) => {
    const start = Date.now();

    await next();

    if (!c.res.headers.has('Cache-Control')) {
      c.res.headers.set('Cache-Control', getCacheControl(c.req.path));
    }

    const ms = Date.now() - start;

    log.info(`\x1b[90m${ms.toString().padStart(4)}ms\x1b[0m ${c.req.method} ${c.req.path}`);
  });

  app.use('/*', serveStatic({ root: './dist', rewriteRequestPath: (p) => p, precompressed: true }));

  app.use('/*', async (c, next) => {
    await next();

    const contentType = c.res.headers.get('Content-Type');
    if (contentType?.includes('application/json') && !contentType.includes('charset')) {
      c.res.headers.set('Content-Type', 'application/json; charset=utf-8');
    }
  });

  app.use('*', async (c, next) => {
    await next();

    c.res.headers.set('X-Content-Type-Options', 'nosniff');
    c.res.headers.set('X-Frame-Options', 'DENY');
    c.res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    c.res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  });

  app.get('*', (c) => {
    const reqPath = c.req.path;

    if (STATIC_ASSET_RE.test(reqPath)) return c.notFound();

    let html: string | undefined;

    if (reqPath === '/') {
      html = cache.get('index');
    } else {
      const cleanPath = reqPath.replace(/^\/+|\/+$/g, '');

      html = cache.get(cleanPath);
    }

    if (!html) {
      const notFoundSlug = getSystemPageSlug('not-found', i18nConfig.defaultLocale);
      const notFound = cache.get(notFoundSlug);

      if (notFound) {
        const nonce = generateNonce();
        const processedHtml = injectNonce(notFound, nonce);

        return c.html(processedHtml, 404);
      }

      return c.notFound();
    }

    const nonce = generateNonce();
    const processedHtml = injectNonce(html, nonce);

    return c.html(processedHtml);
  });

  return app;
}
