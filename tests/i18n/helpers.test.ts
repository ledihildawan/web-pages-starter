import { describe, expect, test } from '@rstest/core';
import { DIRECTION_CODE } from '../../src/scripts/lib/i18n/directions';
import {
  getCurrency,
  getDirection,
  getFallbackChain,
  getFirstDayOfWeek,
  getLanguageSubtag,
  getLocale,
  getNumberingSystem,
  getRegionSubtag,
  getTimezone,
  isRTL,
  setLocale,
} from '../../src/scripts/lib/i18n/helpers';
import { NUMBERING_SYSTEM_CODE } from '../../src/scripts/lib/i18n/numbering-systems';

describe('getLocale', () => {
  test('returns valid locale unchanged', () => {
    setLocale('id-ID');
    expect(getLocale()).toBe('id-ID');
  });

  test('returns default locale when no locale set and no arg', () => {
    setLocale(undefined as never);
    expect(getLocale()).toBe('en-US');
  });

  test('returns default locale for unknown locale', () => {
    expect(getLocale('xx-XX' as never)).toBe('en-US');
  });

  test('resolves valid locale via argument even if current differs', () => {
    setLocale('en-US');
    expect(getLocale('ja-JP')).toBe('ja-JP');
  });
});

describe('getFallbackChain', () => {
  test('returns empty for known locale', () => {
    expect(getFallbackChain('id-ID')).toEqual([]);
  });

  test('falls back to matching language locale for unknown variant', () => {
    const chain = getFallbackChain('en-XX' as never);
    expect(chain[0]).toMatch(/^en-/);
    expect(chain[chain.length - 1]).toBe('en-US');
  });

  test('falls back to default for unknown language', () => {
    expect(getFallbackChain('zz-ZZ')).toEqual(['en-US']);
  });
});

describe('getLanguageSubtag', () => {
  test('extracts language from standard locale', () => {
    expect(getLanguageSubtag('id-ID')).toBe('id');
    expect(getLanguageSubtag('en-US')).toBe('en');
  });

  test('handles script-tag locale with 4-char second part', () => {
    expect(getLanguageSubtag('uz-Latn-UZ' as never)).toBe('uz');
  });
});

describe('getDirection / isRTL', () => {
  test('LTR locales return ltr', () => {
    setLocale('id-ID');
    expect(getDirection('id-ID')).toBe(DIRECTION_CODE.LTR);
    expect(isRTL('id-ID')).toBe(false);
  });

  test('RTL locale returns rtl', () => {
    expect(getDirection('ar-SA')).toBe(DIRECTION_CODE.RTL);
    expect(isRTL('ar-SA')).toBe(true);
  });
});

describe('getCurrency', () => {
  test('returns IDR for id-ID', () => {
    expect(getCurrency('id-ID')).toBe('IDR');
  });

  test('returns USD for en-US', () => {
    expect(getCurrency('en-US')).toBe('USD');
  });
});

describe('getNumberingSystem', () => {
  test('returns latn for id-ID', () => {
    expect(getNumberingSystem('id-ID')).toBe(NUMBERING_SYSTEM_CODE.LATN);
  });
});

describe('getTimezone', () => {
  test('returns timezone string', () => {
    const tz = getTimezone('id-ID');
    expect(typeof tz).toBe('string');
    expect(tz.length).toBeGreaterThan(0);
  });
});

describe('getFirstDayOfWeek', () => {
  test('returns 1 (Monday) for id-ID', () => {
    expect(getFirstDayOfWeek('id-ID')).toBe(1);
  });

  test('returns 0 (Sunday) for en-US', () => {
    expect(getFirstDayOfWeek('en-US')).toBe(0);
  });
});

describe('getRegionSubtag', () => {
  test('returns region for known locale', () => {
    const region = getRegionSubtag('id-ID');
    expect(region).toBeDefined();
  });
});
