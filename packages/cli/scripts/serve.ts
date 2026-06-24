import { existsSync } from 'node:fs';
import process from 'node:process';
import { i18nConfig } from '@config/i18n';
import { log } from '@web-pages-starter/core/logger';
import { createServer, setupSigintHandler } from '@web-pages-starter/core/signal-handler';
import { env } from '@generated/env';
import { lookup } from '@generated/paths';
import { getErrorPageSlugs, getRootPageSlug } from '@web-pages-starter/page-system';
import { createStaticApp, getPageNames, loadHtmlCache } from '@web-pages-starter/core/hono-server';

const DIST = lookup('@dist');

if (!existsSync(DIST)) {
  log.distNotFound();
  process.exit(1);
}

const htmlCache = loadHtmlCache(DIST);
const pageNames = getPageNames(DIST);
const app = createStaticApp(DIST, htmlCache);

createServer({ fetch: app.fetch, port: env.PORT, hostname: env.HOST }, () => {
  log.info(`\n  \x1b[32m✓\x1b[0m Server ready at \x1b[1m${env.SITE_URL}\x1b[0m\n`);
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
