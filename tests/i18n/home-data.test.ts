import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from '@rstest/core';
import JSON5 from 'json5';

const ROOT = join(__dirname, '../..');

const REQUIRED_HERO_KEYS = [
  'hero.badge',
  'hero.title_part1',
  'hero.title_highlight',
  'hero.description',
  'hero.primary_btn.label',
  'hero.primary_btn.url',
  'hero.secondary_btn.label',
  'hero.secondary_btn.url',
  'hero.note',
] as const;

const REQUIRED_FEATURE_KEYS = [
  'features.list.speed.title',
  'features.list.speed.description',
  'features.list.design.title',
  'features.list.design.description',
  'features.list.security.title',
  'features.list.security.description',
  'features.heading',
  'features.subheading',
] as const;

const REQUIRED_STATS_KEYS = [
  'stats.community',
  'stats.community_val',
  'stats.projects',
  'stats.projects_val',
  'stats.uptime',
  'stats.uptime_val',
  'stats.rating',
  'stats.rating_val',
] as const;

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (
      current === null ||
      current === undefined ||
      typeof current !== 'object'
    ) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

describe('home page data', () => {
  const pageData = JSON5.parse(
    readFileSync(join(ROOT, 'src/pages/home/index.json5'), 'utf-8'),
  );

  test('has page_id', () => {
    expect(pageData.page_id).toBe('home');
  });

  test('has meta with translation keys', () => {
    expect(pageData.meta).toBeDefined();
    expect(pageData.meta.t_title).toBe('meta.title');
    expect(pageData.meta.t_description).toBe('meta.description');
  });

  test('features list has 3 items with required fields', () => {
    const list = pageData.features.list;
    expect(Array.isArray(list)).toBe(true);
    expect(list).toHaveLength(3);
    for (const item of list) {
      expect(item.t_key).toBeDefined();
      expect(item.icon).toBeDefined();
      expect(item.color).toBeDefined();
    }
  });

  test('features t_keys are speed, design, security', () => {
    const keys = pageData.features.list.map((i: { t_key: string }) => i.t_key);
    expect(keys).toEqual(['speed', 'design', 'security']);
  });

  test('stats has 4 items', () => {
    expect(pageData.stats).toHaveLength(4);
    const keys = pageData.stats.map((s: { t_key: string }) => s.t_key);
    expect(keys).toEqual(['community', 'projects', 'uptime', 'rating']);
  });
});

describe('home locale keys (id-ID)', () => {
  const locale = JSON.parse(
    readFileSync(join(ROOT, 'src/locales/id-ID/home.json'), 'utf-8'),
  );

  test('has all hero keys', () => {
    for (const key of REQUIRED_HERO_KEYS) {
      expect(getNestedValue(locale, key)).not.toBeUndefined();
    }
  });

  test('has all feature keys', () => {
    for (const key of REQUIRED_FEATURE_KEYS) {
      expect(getNestedValue(locale, key)).not.toBeUndefined();
    }
  });

  test('has all stats keys', () => {
    for (const key of REQUIRED_STATS_KEYS) {
      expect(getNestedValue(locale, key)).not.toBeUndefined();
    }
  });

  test('hero values are non-empty strings', () => {
    for (const key of REQUIRED_HERO_KEYS) {
      const val = getNestedValue(locale, key);
      expect(typeof val).toBe('string');
      expect((val as string).length).toBeGreaterThan(0);
    }
  });

  test('feature values are non-empty strings', () => {
    for (const key of REQUIRED_FEATURE_KEYS) {
      const val = getNestedValue(locale, key);
      expect(typeof val).toBe('string');
      expect((val as string).length).toBeGreaterThan(0);
    }
  });
});

describe('home locale parity across locales', () => {
  const idHome = JSON.parse(
    readFileSync(join(ROOT, 'src/locales/id-ID/home.json'), 'utf-8'),
  );
  const enHome = JSON.parse(
    readFileSync(join(ROOT, 'src/locales/en-US/home.json'), 'utf-8'),
  );

  function getAllKeys(obj: Record<string, unknown>, prefix = ''): string[] {
    const keys: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        keys.push(...getAllKeys(value as Record<string, unknown>, fullKey));
      } else {
        keys.push(fullKey);
      }
    }
    return keys;
  }

  test('en-US has same keys as id-ID', () => {
    const idKeys = getAllKeys(idHome).sort();
    const enKeys = getAllKeys(enHome).sort();
    expect(enKeys).toEqual(idKeys);
  });
});
