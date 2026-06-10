import fs from 'node:fs';
import { existsSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { config } from 'dotenv';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { compress } from 'hono/compress';
import { ROOT_PAGE } from '../src/configs/site';

const args = process.argv.slice(2);
const isProd = process.env.NODE_ENV === 'production';

config({ path: '.env.development' });

const portArg = args.find((a) => a.startsWith('--port='))?.split('=')[1];
const PORT = Number.parseInt(portArg ?? process.env.PORT ?? '8888', 10);
const HOST = process.env.HOST ?? '0.0.0.0';
const DIST = path.resolve(process.cwd(), 'dist');

if (!existsSync(DIST)) {
  console.error(`\n\x1b[31m✗\x1b[0m dist/ not found at ${DIST}`);
  console.error('  Run \x1b[1mbun run build\x1b[0m first.\n');
  process.exit(1);
}

const displayUrl = process.env.TUNNEL_URL || `http://localhost:${PORT}`;

const STATIC_ASSET_RE =
  /^\/(?:locales\/|assets\/|fonts\/|images\/|favicon\.svg$|favicon\.ico$|manifest\.json$|sw\.js$|robots\.txt$|sitemap\.xml$|.*\.[a-z0-9]+$)/;

const FINGERPRINTED_ASSET_RE = /^\/(?:locales|assets|fonts|images)\//;
const HTML_RE = /\.html?$/;
const SW_RE = /\/sw\.js$/;

const ONE_YEAR = 31_536_000;
const ONE_HOUR = 3_600;

const getCacheControl = (urlPath: string): string => {
  if (SW_RE.test(urlPath)) return 'no-store, no-cache, must-revalidate, max-age=0';
  if (HTML_RE.test(urlPath)) return 'no-cache, must-revalidate, max-age=0';
  if (FINGERPRINTED_ASSET_RE.test(urlPath))
    return `public, max-age=${ONE_YEAR}, immutable`;
  if (/\.(?:json|xml|txt|svg|ico)$/.test(urlPath))
    return `public, max-age=${ONE_HOUR}`;
  return 'public, max-age=0, must-revalidate';
};

const PAGE_NAMES = fs
  .readdirSync(DIST)
  .filter((f) => f.endsWith('.html'))
  .map((f) => f.replace(/\.html$/, ''));

const tryReadFile = async (relPath: string): Promise<string | null> => {
  const fullPath = path.join(DIST, relPath);
  if (!existsSync(fullPath)) return null;
  if (!statSync(fullPath).isFile()) return null;
  return readFile(fullPath, 'utf8');
};

const htmlCache = new Map<string, string>();
for (const name of PAGE_NAMES) {
  const html = await tryReadFile(`${name}.html`);
  if (html) htmlCache.set(name, html);
}

const app = new Hono();

app.use('*', compress());

app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  if (!c.res.headers.has('Cache-Control')) {
    c.res.headers.set('Cache-Control', getCacheControl(c.req.path));
  }
  if (!isProd) {
    const ms = Date.now() - start;
    console.log(
      `\x1b[90m${ms.toString().padStart(4)}ms\x1b[0m ${c.req.method} ${c.req.path}`,
    );
  }
});

app.use(
  '/*',
  serveStatic({
    root: './dist',
    rewriteRequestPath: (p) => p,
  }),
);

app.get('*', (c) => {
  const reqPath = c.req.path;

  if (STATIC_ASSET_RE.test(reqPath)) {
    return c.notFound();
  }

  if (reqPath === '/') {
    const home = htmlCache.get(ROOT_PAGE);
    if (home) return c.html(home);
    return c.notFound();
  }

  const segments = reqPath.replace(/^\/+|\/+$/g, '').split('/');
  const first = segments[0];
  if (first && htmlCache.has(first)) {
    return c.html(htmlCache.get(first) as string);
  }

  const notFound = htmlCache.get('404');
  if (notFound) return c.html(notFound, 404);
  return c.notFound();
});

serve({ fetch: app.fetch, port: PORT, hostname: HOST }, (_info) => {
  console.log(
    `\n  \x1b[32m✓\x1b[0m Hono static server ready at \x1b[1m${displayUrl}\x1b[0m\n`,
  );
  console.log(`  Serving from: ${DIST}`);
  console.log(`  Mode: ${isProd ? 'production' : 'development'}`);
  console.log(`  Pages: ${PAGE_NAMES.filter((n) => n !== '404').join(', ')}\n`);
});
