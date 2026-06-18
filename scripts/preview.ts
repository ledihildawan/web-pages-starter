import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { env } from '@config/env';
import { i18nConfig } from '@config/i18n';
import type { serve } from '@hono/node-server';
import ngrok from '@ngrok/ngrok';
import { getErrorPageSlugs, getRootPageSlug } from '@page-system';
import { resolveRoot } from '@utils/common';
import inquirer from 'inquirer';
import { createStaticApp, getPageNames, loadHtmlCache } from './lib/hono-server';
import { log } from './lib/logger';
import { createServer, wrapMainError } from './lib/signal-handler';

const PORT = env.PORT;
const HOST = env.HOST;
const LOCAL_URL = `http://localhost:${PORT}`;
const DIST = resolveRoot('dist');

const TEXT_EXTS = ['.html', '.css', '.js', '.json', '.xml', '.txt', '.svg', '.webmanifest'];

const runBuild = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    log.info('\n[Build] Running production build...');
    const proc = spawn('bun', ['run', 'build'], {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: { ...process.env, BUILD_PREVIEW: 'true' },
      shell: false,
    });
    proc.on('close', (code) => {
      if (code !== 0) return reject(new Error('Build failed'));
      resolve();
    });
    proc.on('error', reject);
  });
};

const replaceUrls = (fromUrl: string, toUrl: string): number => {
  let replaced = 0;

  const getAllTextFiles = (dir: string): string[] => {
    const files: string[] = [];
    if (!fs.existsSync(dir)) return files;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...getAllTextFiles(fullPath));
      } else if (TEXT_EXTS.includes(path.extname(entry.name).toLowerCase())) {
        files.push(fullPath);
      }
    }
    return files;
  };

  const files = getAllTextFiles(DIST);
  log.info(`  Found ${files.length} text files to check`);

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    if (content.includes(fromUrl)) {
      fs.writeFileSync(file, content.replaceAll(fromUrl, toUrl));
      replaced++;
    }
  }

  return replaced;
};

const closeServer = (server: ReturnType<typeof serve> | null): Promise<void> => {
  return new Promise((resolve) => {
    if (!server) {
      resolve();
      return;
    }
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        resolve();
      }
    };
    server.close(finish);
    setTimeout(finish, 2000);
  });
};

const checkCloudflared = (): boolean => {
  try {
    const result = spawnSync('cloudflared', ['--version'], { stdio: 'ignore' });
    return result.status === 0;
  } catch {
    return false;
  }
};

const startCloudflaredTunnel = (): Promise<{ url: string; kill: () => void }> => {
  return new Promise((resolve, reject) => {
    const tunnelTarget = `http://${HOST}:${PORT}`;
    const proc = spawn('cloudflared', ['tunnel', '--url', tunnelTarget], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let lineBuffer = '';
    let settled = false;

    const finish = (fn: () => void) => {
      if (!settled) {
        settled = true;
        fn();
      }
    };

    const processChunk = (data: Buffer) => {
      lineBuffer += data.toString();
      const lines = lineBuffer.split(/\r?\n/);
      lineBuffer = lines.pop() || '';

      for (const line of lines) {
        const match = line.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
        if (match) {
          finish(() => resolve({ url: match[0], kill: () => proc.kill() }));
          return;
        }
      }
    };

    proc.stdout.on('data', processChunk);
    proc.stderr.on('data', processChunk);
    proc.on('error', (err) => finish(() => reject(new Error(`cloudflared failed — ${err.message}`))));
    proc.on('close', (code) => finish(() => reject(new Error(`cloudflared exited (code ${code})`))));

    setTimeout(() => {
      finish(() => reject(new Error('cloudflared tunnel timeout (30s) — no URL received')));
    }, 30000);
  });
};

const main = async () => {
  const cliProvider = process.argv.includes('--tunnel') ? process.argv[process.argv.indexOf('--tunnel') + 1] : null;

  let provider: string;

  if (cliProvider && (cliProvider === 'ngrok' || cliProvider === 'cloudflared')) {
    provider = cliProvider;
  } else if (cliProvider) {
    log.error('Error: Invalid tunnel provider. Use --tunnel ngrok or --tunnel cloudflared');
    process.exit(1);
  } else {
    const { selected } = await inquirer.prompt<{ selected: string }>([
      {
        type: 'select',
        name: 'selected',
        message: 'Select tunnel provider:',
        choices: [
          { name: 'ngrok (requires NGROK_AUTHTOKEN)', value: 'ngrok' },
          { name: 'cloudflared (requires cloudflared installed)', value: 'cloudflared' },
        ],
      },
    ]);
    provider = selected;
  }

  let tunnelUrl = '';
  let tunnelClose: (() => void) | null = null;
  let serverInstance: ReturnType<typeof serve> | null = null;

  if (provider === 'ngrok') {
    const listener = await ngrok.forward({
      addr: PORT,
      authtoken_from_env: true,
    });
    tunnelUrl = listener.url() || '';
    if (!tunnelUrl) {
      log.error('Error: ngrok returned no tunnel URL. Check NGROK_AUTHTOKEN.');
      await listener.close();
      process.exit(1);
    }
    process.env.SITE_URL = tunnelUrl;
    tunnelClose = async () => {
      await listener.close();
    };

    await runBuild();
  } else {
    if (!checkCloudflared()) {
      log.error('Error: cloudflared not found.');
      log.error('Install: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads');
      process.exit(1);
    }

    await runBuild();

    log.info('Starting cloudflared tunnel...');
    try {
      const tunnel = await startCloudflaredTunnel();
      tunnelUrl = tunnel.url;
      tunnelClose = tunnel.kill;
    } catch (err) {
      log.error(`Error: ${(err as Error).message}`);
      process.exit(1);
    }

    const replaced = replaceUrls(LOCAL_URL, tunnelUrl);
    log.info(`  Done: Replaced URLs in ${replaced} file(s)`);
  }

  const htmlCache = loadHtmlCache(DIST);
  const app = createStaticApp(DIST, htmlCache);

  log.info('Starting server...');
  serverInstance = createServer({
    fetch: app.fetch,
    port: PORT,
    hostname: HOST,
  });

  const shutdown = async () => {
    log.info('\nShutting down...');
    await closeServer(serverInstance);
    if (tunnelClose) {
      try {
        await tunnelClose();
      } catch {}
    }
    const restoreProc = spawn('bun', ['./packages/i18n/cli/generate-active-locales.ts'], {
      stdio: 'ignore',
      cwd: process.cwd(),
      detached: true,
    });
    restoreProc.unref();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  log.info(`\n  \x1b[32m✓\x1b[0m Preview ready at \x1b[1m${tunnelUrl}\x1b[0m\n`);
  log.info(`  Mode: preview (${provider})`);
  const errorPages = getErrorPageSlugs(i18nConfig.defaultLocale);
  const rootSlug = getRootPageSlug(i18nConfig.defaultLocale);
  log.info(
    `  Pages: ${getPageNames(DIST)
      .filter((n) => !errorPages.includes(n))
      .map((n) => (n === rootSlug ? `${n} (index)` : n))
      .join(', ')}\n`,
  );

  await new Promise(() => {});
};

wrapMainError(main);
