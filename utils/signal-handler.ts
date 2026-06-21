import { serve } from '@hono/node-server';
import { log } from './logger';

let isShuttingDown = false;

export const handleShutdown = () => {
  isShuttingDown = true;

  log.cancelled();

  process.exit(0);
};

export const setupSigintHandler = () => {
  process.on('SIGINT', handleShutdown);
};

export const handleExitPromptError = (err: unknown): boolean => {
  if (isShuttingDown) return true;

  const message = err instanceof Error ? err.message : String(err);

  if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'ExitPromptError') {
    handleShutdown();

    return true;
  }

  if (message.includes('force closed')) {
    handleShutdown();

    return true;
  }

  return false;
};

type ServeArgs = Parameters<typeof serve>;

export const createServer = (options: ServeArgs[0], callback?: ServeArgs[1]) => {
  const port = options.port ?? 8888;
  const server = serve(options, callback);

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      log.serverPortError(port);
    } else {
      log.serverError(err);
    }

    process.exit(1);
  });

  return server;
};

export const wrapMainError = (mainFn: () => Promise<void>, label = 'Error:') => {
  mainFn().catch((err) => {
    if (handleExitPromptError(err)) return;

    log.error(`\n${label} ${err}`);

    process.exit(1);
  });
};
