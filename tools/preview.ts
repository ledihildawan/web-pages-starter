import { spawn } from 'node:child_process';
import fs, { existsSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import type { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import ngrok from '@ngrok/ngrok';
import { Hono } from 'hono';
import { compress } from 'hono/compress';
import inquirer from 'inquirer';
import { log } from './shared/logger';
import {
  createServer,
  setupSigintHandler,
  wrapMainError,
} from './shared/signal-handler';
import '../src/configs/env';
import { PATHS } from '../src/configs/paths';

const PORT = Number.parseInt(process.env.PORT ?? '8888', 10);
const HOST = process.env.HOST ?? '127.0.0.1';
const DIST = path.resolve(PATHS.ROOT, 'dist');

const runBuild = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const steps = [
      'clean:cache',
      './tools/fetch-exchange-rates.ts',
      './tools/sync-root-page.ts',
      './tools/generate-i18n.ts',
      './tools/generate-sitemap.ts',
      './tools/build.ts',
    ];
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      BUILD_PREVIEW: 'true',
    };

    const run = async (i = 0) => {
      if (i >= steps.length) return resolve();
      const step = steps[i];
      const isNpmScript = !step.startsWith('./');
      const cmd = isNpmScript ? ['run', step] : [step];
      log.info(`\n[${i + 1}/${steps.length}] ${step}`);
      const proc = spawn('bun', cmd, {
        stdio: 'inherit',
        cwd: PATHS.ROOT,
        env,
        shell: !isNpmScript,
      });
      proc.on('close', (code) => {
        if (code !== 0) return reject(new Error(`Step "${step}" failed`));
        run(i + 1);
      });
      proc.on('error', reject);
    };
    run();
  });
};

const replaceUrls = (fromUrl: string, toUrl: string): void => {
  log.info('  Starting URL replacement...');
  const getAllFiles = (dir: string): string[] => {
    const files: string[] = [];
    if (!fs.existsSync(dir)) return files;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...getAllFiles(fullPath));
      } else {
        files.push(fullPath);
      }
    }
    return files;
  };

  const allFiles = getAllFiles(DIST);
  log.info(`  Found ${allFiles.length} files to check`);
  let updatedCount = 0;

  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    if (content.includes(fromUrl)) {
      const newContent = content.split(fromUrl).join(toUrl);
      fs.writeFileSync(file, newContent, 'utf-8');
      updatedCount++;
      const relativePath = file.replace(PATHS.ROOT, '.').replace(/\\/g, '/');
      log.info(`  Replaced in: ${relativePath}`);
    }
  }

  log.info(`\n  Done: Replaced URLs in ${updatedCount} file(s)`);
};

const cliArgs = process.argv.slice(2);
const tunnelIdx = cliArgs.indexOf('--tunnel');
const cliProvider = tunnelIdx >= 0 ? cliArgs[tunnelIdx + 1] : null;

const isValidProvider = (p: string) => p === 'ngrok' || p === 'cloudflared';

const main = async () => {
  if (cliProvider && !isValidProvider(cliProvider)) {
    log.error(
      'Error: Invalid tunnel provider. Use --tunnel ngrok or --tunnel cloudflared',
    );
    process.exit(1);
  }

  let provider = cliProvider;
  if (!provider) {
    const { selected } = await inquirer.prompt([
      {
        type: 'select',
        name: 'selected',
        message: 'Select tunnel provider:',
        choices: [
          { name: 'ngrok', value: 'ngrok' },
          { name: 'cloudflared', value: 'cloudflared' },
        ],
      },
    ]);
    provider = selected;
  }

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

  const getPageNames = () => {
    return fs
      .readdirSync(DIST)
      .filter((f) => f.endsWith('.html'))
      .map((f) => f.replace(/\.html$/, ''));
  };

  const tryReadFile = async (relPath: string): Promise<string | null> => {
    const fullPath = path.join(DIST, relPath);
    if (!existsSync(fullPath)) return null;
    if (!statSync(fullPath).isFile()) return null;
    return readFile(fullPath, 'utf8');
  };

  const createApp = () => {
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

    app.use(
      '/*',
      serveStatic({ root: './dist', rewriteRequestPath: (p) => p }),
    );

    app.get('*', async (c) => {
      const reqPath = c.req.path;
      if (STATIC_ASSET_RE.test(reqPath)) return c.notFound();
      if (reqPath === '/') {
        const home = await tryReadFile('index.html');
        if (home) return c.html(home);
        return c.notFound();
      }
      const segments = reqPath.replace(/^\/+|\/+$/g, '').split('/');
      const first = segments[0];
      if (first) {
        const content = await tryReadFile(`${first}.html`);
        if (content) return c.html(content);
      }
      const notFound = await tryReadFile('404.html');
      if (notFound) return c.html(notFound, 404);
      return c.notFound();
    });

    return app;
  };

  let tunnelUrl = '';
  let tunnelClose: (() => void) | null = null;
  let serverInstance: ReturnType<typeof serve> | null = null;

  const closeServer = (): Promise<void> => {
    return new Promise((resolve) => {
      if (!serverInstance) {
        resolve();
        return;
      }
      serverInstance.close(() => {
        serverInstance = null;
        resolve();
      });
      setTimeout(resolve, 2000);
    });
  };

  if (provider === 'ngrok') {
    const listener = await ngrok.forward({
      addr: PORT,
      authtoken_from_env: true,
    });
    tunnelUrl = listener.url() ?? `http://localhost:${PORT}`;
    process.env.SITE_URL = tunnelUrl;
    tunnelClose = async () => {
      await listener.close();
    };

    await runBuild();

    const app = createApp();

    log.info('Starting server...');
    serverInstance = createServer({
      fetch: app.fetch,
      port: PORT,
      hostname: HOST,
    });
  }

  if (provider === 'cloudflared') {
    const placeholderUrl = `http://${HOST}:${PORT}`;
    process.env.SITE_URL = placeholderUrl;

    await runBuild();

    const app1 = createApp();

    log.info('Starting server...');
    serverInstance = createServer({
      fetch: app1.fetch,
      port: PORT,
      hostname: HOST,
    });

    log.info('Starting cloudflared tunnel...');

    const checkProc = spawn('cloudflared', ['--version'], { stdio: 'ignore' });
    checkProc.on('error', () => {
      log.error('Error: cloudflared not found.');
      log.error(
        'Install: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads',
      );
      process.exit(1);
    });

    const proc = spawn(
      'cloudflared',
      ['tunnel', '--url', `http://localhost:${PORT}`],
      {
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );

    await new Promise<void>((resolve, reject) => {
      const checkLine = (line: string) => {
        const match = line.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
        if (match && !tunnelUrl) {
          tunnelUrl = match[0];
          resolve();
        }
      };

      proc.stdout.on('data', (data) => checkLine(data.toString()));
      proc.stderr.on('data', (data) => checkLine(data.toString()));
      proc.on('error', (err) => {
        log.error(`Error: cloudflared failed — ${err.message}`);
        reject(err);
      });
    });

    tunnelClose = () => {
      proc.kill();
    };

    try {
      replaceUrls(placeholderUrl, tunnelUrl);
    } catch (error) {
      log.error(`Error: URL replacement failed — ${error}`);
    }

    const shutdown = async () => {
      log.info('\nShutting down...');
      closeServer();
      if (tunnelClose) tunnelClose();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    log.info(`\n  Preview ready at ${tunnelUrl || `http://${HOST}:${PORT}`}\n`);
    log.info(`  Mode: preview (${provider})`);
    log.info(
      `  Pages: ${getPageNames()
        .filter((n) => n !== '404')
        .join(', ')}\n`,
    );

    await new Promise(() => {});
  }
};

setupSigintHandler();
wrapMainError(main);
