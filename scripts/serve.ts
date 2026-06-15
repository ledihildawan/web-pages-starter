import { existsSync } from 'node:fs';
import process from 'node:process';
import '../configs/env';
import { resolveRoot } from '@constants/paths';
import { getErrorPageSlugs, getRootPageSlug } from '@page-engine';
import { i18nConfig } from '../configs/i18n';
import {
  createStaticApp,
  getPageNames,
  loadHtmlCache,
} from './lib/hono-server';
import { log } from './lib/logger';
import { createServer, setupSigintHandler } from './lib/signal-handler';

const PORT = Number.parseInt(process.env.PORT ?? '8888', 10);
const HOST = process.env.HOST ?? '0.0.0.0';

const DIST = resolveRoot('dist');

if (!existsSync(DIST)) {
  log.distNotFound();
  process.exit(1);
}

const htmlCache = loadHtmlCache(DIST);
const pageNames = getPageNames(DIST);
const app = createStaticApp(DIST, htmlCache);

createServer({ fetch: app.fetch, port: PORT, hostname: HOST }, () => {
  const localUrl = `http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`;
  log.info(`\n  \x1b[32m✓\x1b[0m Server ready at \x1b[1m${localUrl}\x1b[0m\n`);
  log.info(`  Mode: serve`);
  const errorPages = getErrorPageSlugs(i18nConfig.defaultLocale);
  const rootSlug = getRootPageSlug(i18nConfig.defaultLocale);
  log.info(
    `  Pages: ${pageNames
      .filter((n) => !errorPages.includes(n))
      .map((n) => (n === rootSlug ? `${n} (index)` : n))
      .join(', ')}\n`,
  );
});

setupSigintHandler();
