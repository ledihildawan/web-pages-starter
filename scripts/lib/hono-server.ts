import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { i18nConfig } from '@config/i18n';
import { serveStatic } from '@hono/node-server/serve-static';
import { getSystemPageSlug } from '@page-system';
import { Hono } from 'hono';
import { compress } from 'hono/compress';
import { log } from './logger';

const STATIC_ASSET_RE =
  /^\/(?:locales\/|assets\/|fonts\/|images\/|favicon\.svg$|favicon\.ico$|manifest\.json$|sw\.js$|robots\.txt$|sitemap\.xml$|.*\.[a-z0-9]+$)/;
const FINGERPRINTED_ASSET_RE = /^\/(?:locales|assets|fonts|images)\//;
const HTML_RE = /\.html?$/;
const SW_RE = /\/sw\.js$/;
const ONE_YEAR = 31_536_000;
const ONE_HOUR = 3_600;
const NONCE_PLACEHOLDER = '__CSP_NONCE__';

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
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

  const bytes = new Uint8Array(16);

  crypto.getRandomValues(bytes);

  let nonce = '';

  for (const byte of bytes) {
    nonce += chars[byte % chars.length];
  }

  return nonce;
}

function injectNonce(html: string, nonce: string): string {
  const nonceAttrPattern = new RegExp(`nonce=["']${NONCE_PLACEHOLDER}["']`, 'g');

  let result = html.replace(nonceAttrPattern, `nonce="${nonce}"`);

  const cspMetaMatch = result.match(
    /<meta[^>]+http-equiv=["']Content-Security-Policy["'][^>]+content=["']([^"']+)["']/i,
  );

  if (cspMetaMatch) {
    const oldCsp = cspMetaMatch[1];

    const newCsp = oldCsp.replace(/nonce-[^;']+/g, `nonce-${nonce}`);

    result = result.replace(cspMetaMatch[0], cspMetaMatch[0].replace(oldCsp, newCsp));
  }

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
