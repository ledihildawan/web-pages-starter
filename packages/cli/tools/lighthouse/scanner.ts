import { existsSync } from 'node:fs';
import { lookup } from '@generated/paths';
import { getPageNames } from '@shared/utils/hono-server';

export interface DiscoveredPage {
  path: string;
  url: string;
}

export function scanPagesFromDist(distDir?: string): DiscoveredPage[] {
  const dist = distDir ?? lookup('@dist');

  if (!existsSync(dist)) {
    return [];
  }

  const pageNames = getPageNames(dist);

  return pageNames.map((name) => ({
    path: name,
    url: name === 'index' ? '/' : `/${name}`,
  }));
}

export function buildAuditUrls(baseUrl: string, pages: DiscoveredPage[]): string[] {
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

  return pages.map((page) => {
    if (page.url.startsWith('http')) {
      return page.url;
    }
    return `${base}${page.url}`;
  });
}
