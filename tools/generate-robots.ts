import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import '../src/configs/env';
import { PATHS } from '../src/configs/paths';
import { log } from './shared/logger';

const SITE_URL = process.env.SITE_URL || 'http://localhost:8888';
const OUTPUT_PUBLIC = path.join(PATHS.ROOT, 'public', 'robots.txt');

const baseUrl = SITE_URL.endsWith('/') ? SITE_URL : `${SITE_URL}/`;

const robots = `User-agent: *
Allow: /
Disallow: /404.html
Disallow: /assets/sw.js

Sitemap: ${baseUrl}sitemap.xml
`;

fs.writeFileSync(OUTPUT_PUBLIC, robots, 'utf-8');

log.info('┌────────────────────────────────────────┐');
log.info('│         Generate Robots.txt            │');
log.info('├────────────────────────────────────────┤');
log.info(`│  Sitemap:   ${baseUrl.slice(0, 28).padEnd(28)}│`);
log.info(`│  Output:    public/robots.txt          │`);
log.info('└────────────────────────────────────────┘');
