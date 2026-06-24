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
  log.error('Error: dist/ directory not found.');
  log.info('  Run `bun run build` first to generate the production build.');
  log.info('  Or use `bun run preview` to build and serve with tunnel.\n');
  process.exit(1);
}

const htmlCache = loadHtmlCache(DIST);
const pageNames = getPageNames(DIST);
const app = createStaticApp(DIST, htmlCache);

createServer({ fetch: app.fetch, port: env.PORT, hostname: env.HOST }, () => {
  log.info(`\n  \x1b[32m✓\x1b[0m Server ready at \x1b[1m${env.SITE_URL}\x1b[0m\n`);
  log.info(`  Mode: serve`);
  log.info(`  Serving: ${DIST.replace(process.cwd(), '.')}`);
  const errorPages = getErrorPageSlugs(i18nConfig.defaultLocale);
  const rootSlug = getRootPageSlug(i18nConfig.defaultLocale);
  const publicPages = pageNames.filter((n) => !errorPages.includes(n));
  log.info(`  Pages (${publicPages.length}):`);
  for (const name of publicPages) {
    const isIndex = name === rootSlug;
    log.info(`    - ${name}${isIndex ? ' (index)' : ''}`);
  }
  log.info('');
});

setupSigintHandler();
