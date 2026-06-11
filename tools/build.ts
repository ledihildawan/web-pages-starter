import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import '../src/configs/env';

const args = process.argv.slice(2);
const isPreview = process.env.BUILD_PREVIEW === 'true';

const env: NodeJS.ProcessEnv = { ...process.env };
if (!isPreview) {
  env.NODE_ENV = 'production';
}

console.log('┌────────────────────────────────────────┐');
console.log('│           Build Process                │');
console.log('├────────────────────────────────────────┤');

if (args.includes('--debug')) {
  console.log('│  Mode:          debug (no minify)       │');
  env.MINIFY = 'false';
} else {
  console.log('│  Mode:          production              │');
}

if (args.includes('--no-html-minify')) {
  console.log('│  HTML minify:   disabled              │');
  env.MINIFY_HTML = 'false';
}

console.log('└────────────────────────────────────────┘');

const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  console.log('Cleaning previous build...');
  fs.rmSync(distPath, { recursive: true, force: true });
}
console.log();

console.log('Bundling with Rsbuild...\n');
const rsbuildBin = path.resolve(process.cwd(), 'node_modules', '@rsbuild', 'core', 'bin', 'rsbuild.js');
const runtimes = [
  process.env.RSBUILD_RUNTIME,
  process.env.NODE_BINARY,
  'node',
  'bun',
].filter(Boolean) as string[];

let result: ReturnType<typeof spawnSync> | null = null;

for (const runtime of runtimes) {
  try {
    result = spawnSync(runtime, [rsbuildBin, 'build'], {
      stdio: 'inherit',
      env,
      cwd: process.cwd(),
    });
  } catch {
    continue;
  }

  if (!result.error || result.status !== null) break;
}

if (!result) {
  console.error('\nError: Build process failed - no runtime available');
  process.exit(1);
}

if (result.error) {
  console.error('\nError: Build process failed:', result.error);
  process.exit(1);
}

if (result.status !== 0) {
  console.error(`\nError: Build failed with exit code ${result.status}`);
  process.exit(result.status || 1);
}

console.log('\n┌────────────────────────────────────────┐');
console.log('│           Build completed               │');
console.log('├────────────────────────────────────────┤');
console.log('│  Run `bun run preview` to build with tunnel │');
console.log('└────────────────────────────────────────┘\n');
