import type { STAGES } from './index.ts';

export { STAGES } from './index.ts';

export async function loadServerEnvFiles(): Promise<void> {
  if (typeof process === 'undefined' || !process.versions?.node) return;
  const moduleName = 'node:module';
  const moduleRef = (await import(/* webpackIgnore: true */ moduleName)) as {
    createRequire: (path: string) => NodeRequire;
  };
  const dynamicRequire = moduleRef.createRequire(import.meta.url);
  const fs = dynamicRequire('node:fs') as typeof import('node:fs');
  const path = dynamicRequire('node:path') as typeof import('node:path');
  const cwd = process.cwd();
  const stage = (process.env.STAGE as (typeof STAGES)[number] | undefined) ?? 'dev';
  const files = ['.env', `.env.${stage}`];
  for (const file of files) {
    const filePath = path.resolve(cwd, file);
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, 'utf-8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  }
}
