import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { config } from 'dotenv';

const args = process.argv.slice(2);

if (process.env.BUILD_PREVIEW === 'true') {
  config({ path: '.env.development' });
} else {
  config({ path: '.env.production' });
}

const env: NodeJS.ProcessEnv = { ...process.env };

console.log('┌────────────────────────────────────────┐');
console.log('│           🏗️ Build Process              │');
console.log('├────────────────────────────────────────┤');

if (args.includes('--debug')) {
  console.log('│  Debug mode:     enabled (no minify)   │');
  env.MINIFY = 'false';
}

if (args.includes('--no-html-minify')) {
  console.log('│  HTML minify:    disabled              │');
  env.MINIFY_HTML = 'false';
}

console.log('└────────────────────────────────────────┘');

const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  console.log('Cleaning previous build...');
  fs.rmSync(distPath, { recursive: true, force: true });
}
console.log();

const siteUrl = process.env.TUNNEL_URL || process.env.SITE_URL || 'https://example.com';

// Update global.json5 site_url
const globalJson5Path = path.resolve(process.cwd(), 'src', 'data', 'global.json5');
if (fs.existsSync(globalJson5Path)) {
  let content = fs.readFileSync(globalJson5Path, 'utf-8');
  content = content.replace(/"site_url":\s*"[^"]*"/, `"site_url": "${siteUrl}"`);
  fs.writeFileSync(globalJson5Path, content, 'utf-8');
  console.log(`Updated site_url to: ${siteUrl}`);
}

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
  console.error('\nBuild process failed to start: no runtime available.');
  process.exit(1);
}

if (result.error) {
  console.error('\nBuild process failed to start:', result.error);
  process.exit(1);
}

if (result.status !== 0) {
  console.error(`\n❌ Build failed with exit code ${result.status}`);
  process.exit(result.status || 1);
}

console.log('\n┌────────────────────────────────────────┐');
console.log('│       ✅ Build completed successfully    │');
console.log('├────────────────────────────────────────┤');
console.log('│  Run `bun run preview` to preview.      │');
console.log('└────────────────────────────────────────┘\n');
