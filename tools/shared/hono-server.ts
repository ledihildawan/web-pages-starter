import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { serveStatic } from '@hono/node-server/serve-static';
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

const getCacheControl = (urlPath: string): string => {
  if (SW_RE.test(urlPath))
    return 'no-store, no-cache, must-revalidate, max-age=0';
  if (HTML_RE.test(urlPath)) return 'no-cache, must-revalidate, max-age=0';
  if (FINGERPRINTED_ASSET_RE.test(urlPath))
    return `public, max-age=${ONE_YEAR}, immutable`;
  if (/\.(?:json|xml|txt|svg|ico)$/.test(urlPath))
    return `public, max-age=${ONE_HOUR}`;
  return 'public, max-age=0, must-revalidate';
};

export function loadHtmlCache(distDir: string): Map<string, string> {
  const cache = new Map<string, string>();
  if (!existsSync(distDir)) return cache;

  for (const f of readdirSync(distDir)) {
    if (!f.endsWith('.html')) continue;
    const fullPath = path.join(distDir, f);
    if (!statSync(fullPath).isFile()) continue;
    cache.set(f.replace(/\.html$/, ''), readFileSync(fullPath, 'utf8'));
  }

  return cache;
}

export function getPageNames(distDir: string): string[] {
  if (!existsSync(distDir)) return [];
  return readdirSync(distDir)
    .filter((f) => f.endsWith('.html'))
    .map((f) => f.replace(/\.html$/, ''));
}

export function createStaticApp(
  distDir: string,
  htmlCache?: Map<string, string>,
): Hono {
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
    log.info(
      `\x1b[90m${ms.toString().padStart(4)}ms\x1b[0m ${c.req.method} ${c.req.path}`,
    );
  });

  app.use('/*', serveStatic({ root: './dist', rewriteRequestPath: (p) => p }));

  app.get('*', (c) => {
    const reqPath = c.req.path;
    if (STATIC_ASSET_RE.test(reqPath)) return c.notFound();
    if (reqPath === '/') {
      const home = cache.get('index');
      if (home) return c.html(home);
      return c.notFound();
    }
    const segments = reqPath.replace(/^\/+|\/+$/g, '').split('/');
    const first = segments[0];
    if (first && cache.has(first)) return c.html(cache.get(first) as string);
    const notFound = cache.get('404');
    if (notFound) return c.html(notFound, 404);
    return c.notFound();
  });

  return app;
}
