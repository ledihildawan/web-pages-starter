import { readdirSync, statSync } from 'fs';
import { join, relative } from 'node:path';

export const entry = (...path: string[]) => join(process.cwd(), ...path);

export function scanPagesDir(pagesDir = 'pages'): Map<string, { template: string; route: string }> {
  const pagesMap = new Map();
  
  function scan(dir: string, basePath = '') {
    try {
      const entries = readdirSync(dir);
      
      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);
        
        if (stat.isDirectory()) {
          if (entry !== 'sections' && entry !== 'partials' && entry !== 'layouts') {
            scan(fullPath, basePath ? `${basePath}/${entry}` : entry);
          }
        } else if (stat.isFile() && entry.endsWith('.njk')) {
          const templateName = entry.replace('.njk', '');
          const routePath = basePath ? `/${basePath}` : '/';
          pagesMap.set(routePath, {
            template: relative(process.cwd(), fullPath),
            route: routePath,
          });
        }
      }
    } catch (error) {
      console.error(`Error scanning ${dir}:`, error);
    }
  }
  
  scan(entry(pagesDir));
  return pagesMap;
}

export function getAssetPath(assetName: string, pageRoute: string): string {
  const pageName = pageRoute === '/' ? 'home' : pageRoute.replace(/^\//, '').split('/')[0];
  return `/assets/${pageName}/${assetName}`;
}
