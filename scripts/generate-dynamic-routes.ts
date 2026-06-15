import fs from 'node:fs';
import path from 'node:path';
import { isSlugDir } from '@page-engine/scanner';
import { readJSON5 } from '@utils/json5';
import { resolveRoot } from '@utils/paths';

interface DynamicEntry {
  entryKey: string;
  templateDir: string;
  slug: string;
  data: Record<string, unknown>;
}

const PAGES_DIR = resolveRoot('pages');

function scanSlugDirs(
  dir: string,
  basePath: string,
): Array<{ dir: string; basePath: string; param: string }> {
  const results: Array<{ dir: string; basePath: string; param: string }> = [];
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('_')) continue;

    const fullPath = path.join(dir, entry.name);
    const childBase = basePath ? `${basePath}/${entry.name}` : entry.name;

    if (isSlugDir(entry.name)) {
      const param = entry.name.slice(1, -1);
      results.push({ dir: fullPath, basePath, param });
    }

    if (entry.name.startsWith('(') && entry.name.endsWith(')')) {
      results.push(...scanSlugDirs(fullPath, basePath));
    } else {
      results.push(...scanSlugDirs(fullPath, childBase));
    }
  }
  return results;
}

function findDataSource(slugDir: string): {
  slugs: string[];
  data: Record<string, unknown>;
} {
  const parentDir = path.dirname(slugDir);
  const dataPath = path.join(parentDir, 'data.json5');
  const dataPathTs = path.join(parentDir, 'data.json');

  const dataFile = fs.existsSync(dataPath)
    ? dataPath
    : fs.existsSync(dataPathTs)
      ? dataPathTs
      : null;

  if (!dataFile) {
    console.warn(
      `[dynamic-routes] No data.json5 found at ${parentDir}. Skipping [slug] directory.`,
    );
    return { slugs: [], data: {} };
  }

  const data = readJSON5(dataFile) as {
    items?: Array<string | Record<string, unknown>>;
    posts?: Array<string | Record<string, unknown>>;
    slugs?: string[];
  };

  const items = data.items ?? data.posts ?? data.slugs ?? [];
  const slugs = items.map((item) =>
    typeof item === 'string' ? item : (item.slug as string),
  );
  const itemData = items.reduce<Record<string, unknown>>((acc, item) => {
    if (typeof item === 'string') {
      acc[item] = { slug: item };
    } else {
      acc[(item as { slug: string }).slug] = item;
    }
    return acc;
  }, {});

  return { slugs, data: itemData };
}

export function generateDynamicEntries(): DynamicEntry[] {
  const entries: DynamicEntry[] = [];
  const slugDirs = scanSlugDirs(PAGES_DIR, '');

  for (const { dir, basePath, param } of slugDirs) {
    const { slugs, data } = findDataSource(dir);

    for (const slug of slugs) {
      const entryKey = basePath ? `${basePath}/${slug}` : slug;
      entries.push({
        entryKey,
        templateDir: dir,
        slug,
        data: (data[slug] as Record<string, unknown>) ?? { slug },
      });
    }

    console.info(
      `[dynamic-routes] ${basePath || param}: generated ${slugs.length} page(s) from [${param}]`,
    );
  }

  return entries;
}
