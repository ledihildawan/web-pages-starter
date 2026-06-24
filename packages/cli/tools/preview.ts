import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { extname, join } from 'pathe';
import process from 'node:process';
import { i18nConfig } from '@config/i18n';
import { log } from '@web-pages-starter/core/logger';
import { createServer, wrapMainError } from '@web-pages-starter/core/signal-handler';
import { env } from '@generated/env';
import { lookup } from '@generated/paths';
import type { serve } from '@hono/node-server';
import ngrok from '@ngrok/ngrok';
import { getErrorPageSlugs, getRootPageSlug } from '@web-pages-starter/page-system';
import { createStaticApp, getPageNames, loadHtmlCache } from '@web-pages-starter/core/hono-server';
import { savePreviewUrl, type TunnelProvider, verifyUrlAccessible } from '@shared/utils/preview-url';
import inquirer from 'inquirer';

const PORT = env.PORT;
const HOST = env.HOST;
const LOCAL_URL = `http://localhost:${PORT}`;
const DIST = lookup('@dist');

const TEXT_EXTS = ['.html', '.css', '.js', '.json', '.xml', '.txt', '.svg', '.webmanifest'];

const runBuild = (siteUrl: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    log.info('\n▼ Running production build...');
    const proc = spawn('bun', ['run', 'build'], {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: { ...process.env, BUILD_PREVIEW: 'true', STAGE: 'prod', SITE_URL: siteUrl },
      shell: false,
    });
    proc.on('close', (code) => {
      if (code !== 0) {
        return reject(
          new Error(
            `Build failed with exit code ${code}.\n` +
              '  Check the output above for details.\n' +
              '  Common causes:\n' +
              '    - Config file errors (run `bun run typecheck` to check)\n' +
              '    - Missing locale files (check locales/)\n' +
              '    - Invalid data files (check data/*.json5)',
          ),
        );
      }
      log.success('▼ Build complete');
      resolve();
    });
    proc.on('error', (err) => {
      reject(
        new Error(`Failed to start build: ${err.message}.\n` + '  Make sure dependencies are installed: `bun install`'),
      );
    });
  });
};

const replaceUrls = (fromUrl: string, toUrl: string): number => {
  let replaced = 0;

  const getAllTextFiles = (dir: string): string[] => {
    const files: string[] = [];
    if (!fs.existsSync(dir)) return files;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...getAllTextFiles(fullPath));
      } else if (TEXT_EXTS.includes(extname(entry.name).toLowerCase())) {
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
    log.info('▼ Starting cloudflared tunnel...');
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
        if (line.includes('ERR_')) {
          log.warn(`  cloudflared: ${line.trim()}`);
        }
      }
    };

    proc.stdout.on('data', processChunk);
    proc.stderr.on('data', processChunk);
    proc.on('error', (err) =>
      finish(() =>
        reject(
          new Error(
            `cloudflared failed: ${err.message}.\n` +
              '  Make sure cloudflared is installed:\n' +
              '  https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads',
          ),
        ),
      ),
    );
    proc.on('close', (code) =>
      finish(() =>
        reject(new Error(`cloudflared exited unexpectedly (code ${code}).\n` + '  Try again or use ngrok instead.')),
      ),
    );

    setTimeout(() => {
      finish(() =>
        reject(
          new Error(
            'cloudflared timeout (30s) — no tunnel URL received.\n' + '  Check your internet connection and try again.',
          ),
        ),
      );
    }, 30000);
  });
};

const main = async () => {
  const cliArgs = process.argv.slice(2);
  const tunnelIndex = cliArgs.indexOf('--tunnel');
  const cliProvider = tunnelIndex !== -1 ? cliArgs[tunnelIndex + 1] : null;

  let provider: TunnelProvider;

  if (cliProvider && (cliProvider === 'ngrok' || cliProvider === 'cloudflared')) {
    provider = cliProvider as TunnelProvider;
  } else if (cliProvider) {
    throw new Error('Invalid tunnel provider. Use --tunnel ngrok or --tunnel cloudflared');
  } else {
    const { selected } = await inquirer.prompt<{ selected: TunnelProvider }>([
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
    await runBuild(tunnelUrl);

    const listener = await ngrok.forward({
      addr: PORT,
      authtoken: env.NGROK_AUTHTOKEN,
    });
    tunnelUrl = listener.url() || '';
    if (!tunnelUrl) {
      await listener.close();
      throw new Error('ngrok returned no tunnel URL. Check NGROK_AUTHTOKEN.');
    }
    tunnelClose = async () => {
      await listener.close();
    };
  } else {
    if (!checkCloudflared()) {
      throw new Error(
        'cloudflared not found.\n  Install: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads',
      );
    }

    await runBuild(tunnelUrl);

    log.info('Starting cloudflared tunnel...');
    try {
      const tunnel = await startCloudflaredTunnel();
      tunnelUrl = tunnel.url;
      tunnelClose = tunnel.kill;
    } catch (err) {
      throw new Error(`cloudflared tunnel failed: ${(err as Error).message}`);
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

  log.info('Verifying tunnel URL...');
  const maxRetries = 5;
  const retryDelay = 3000;
  let verified = false;

  await new Promise((resolve) => setTimeout(resolve, 3000));

  for (let i = 0; i < maxRetries; i++) {
    const accessible = await verifyUrlAccessible(tunnelUrl);
    if (accessible) {
      verified = true;
      break;
    }
    log.info(`  Attempt ${i + 1}/${maxRetries} failed, retrying in ${retryDelay / 1000}s...`);
    await new Promise((resolve) => setTimeout(resolve, retryDelay));
  }

  if (!verified) {
    throw new Error('Tunnel URL not accessible after multiple attempts.');
  }

  await savePreviewUrl(tunnelUrl, provider);

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
