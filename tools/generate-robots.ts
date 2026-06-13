import path from 'node:path';
import '../src/configs/env';
import { PATHS } from '../src/configs/paths';
import { logBox } from './shared/logger';
import { SITE_URL } from './shared/site-url';
import { writeFilePath } from './shared/write-file';

const OUTPUT_PUBLIC = path.join(PATHS.ROOT, 'public', 'robots.txt');

const basePath = (process.env.BASE_PATH || '/').replace(/\/?$/, '/');
const baseUrl = SITE_URL.endsWith('/') ? SITE_URL : `${SITE_URL}/`;

const robots = `User-agent: *
Allow: ${basePath}
Disallow: ${basePath}not-found.html
Disallow: ${basePath}unauthorized.html
Disallow: ${basePath}forbidden.html
Disallow: ${basePath}server-error.html
Disallow: ${basePath}maintenance.html
Disallow: ${basePath}offline.html
Disallow: ${basePath}sw.js

Sitemap: ${baseUrl}sitemap.xml
`;

writeFilePath(OUTPUT_PUBLIC, robots);

logBox('Generate Robots.txt', {
  Sitemap: baseUrl.slice(0, 28),
  Output: 'public/robots.txt',
});
