export const log = {
  info: (msg: string) => console.log(msg),
  error: (msg: string) => console.error(msg),
  warn: (msg: string) => console.warn(msg),
  success: (msg: string) => console.log(`\x1b[32m${msg}\x1b[0m`),
  cancelled: () => console.log('\n\nCancelled.'),
  header: (title: string) => {
    const line = '─'.repeat(42);
    console.log(`┌${line}┐`);
    console.log(
      `│${title.padStart(Math.floor((42 + title.length) / 2)).padEnd(42)}│`,
    );
    console.log(`└${line}┘\n`);
  },
  toolStarted: (name: string) => console.log(`\n${name}\n`),
  toolFailed: (name: string, code: number) => {
    console.error(`\nError: "${name}" failed — exit code ${code}.`);
    console.error('  Check the output above for details.\n');
  },
  toolSpawnFailed: (name: string, err: Error) => {
    console.error(`\nError: Failed to run "${name}" — ${err.message}\n`);
  },
  serverReady: (port: number) => console.log(`Server ready on port ${port}`),
  serverPortError: (port: number) => {
    console.error(
      `\nError: Cannot start server on port ${port} — it may already be in use.`,
    );
    console.error(
      '  Stop the other process or set PORT in .env to a different value.\n',
    );
  },
  serverError: (err: NodeJS.ErrnoException) => {
    console.error(`\nError: Server failed — ${err}`);
  },
  distNotFound: () =>
    console.log('dist/ not found — run `bun run build` first.'),
};
