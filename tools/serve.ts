import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import '../src/configs/env';
import { PATHS } from '../src/configs/paths';
import {
  createStaticApp,
  getPageNames,
  loadHtmlCache,
} from './shared/hono-server';
import { log } from './shared/logger';
import { createServer, setupSigintHandler } from './shared/signal-handler';

const PORT = Number.parseInt(process.env.PORT ?? '8888', 10);
const HOST = process.env.HOST ?? '0.0.0.0';

const DIST = path.resolve(PATHS.ROOT, 'dist');

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
  log.info(`  Pages: ${pageNames.filter((n) => n !== '404').join(', ')}\n`);
});

setupSigintHandler();
