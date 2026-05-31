import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const args = process.argv.slice(2);

const env: NodeJS.ProcessEnv = { ...process.env };

console.log('Starting build process...\n');

if (args.includes('--debug')) {
    console.log('Debug mode enabled: Setting MINIFY=false');
    env.MINIFY = 'false';
}

if (args.includes('--no-html-minify')) {
    console.log('HTML Minify disabled: Setting MINIFY_HTML=false');
    env.MINIFY_HTML = 'false';
}

console.log('Cleaning previous build...');
const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
    fs.rmSync(distPath, { recursive: true, force: true });
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
    console.error(`\nBuild failed with exit code ${result.status}`);
    process.exit(result.status || 1);
}

console.log('\nBuild completed successfully.');
