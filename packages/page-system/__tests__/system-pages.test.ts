import { describe, expect, test } from '@rstest/core';
import {
  getErrorPageSlugs,
  getRootPageSlug,
  getSystemPageSlug,
  isSystemPageId,
  isSystemPageSlug,
  ROOT_PAGE,
  SYSTEM_PAGE_IDS,
  SYSTEM_PAGE_SLUGS,
} from '../system-pages';

describe('pages config', () => {
  describe('ROOT_PAGE', () => {
    test('is "home"', () => {
      expect(ROOT_PAGE).toBe('home');
    });
  });

  describe('SYSTEM_PAGE_IDS', () => {
    test('contains all 7 system pages', () => {
      expect(SYSTEM_PAGE_IDS).toHaveLength(7);
      expect(SYSTEM_PAGE_IDS).toContain('home');
      expect(SYSTEM_PAGE_IDS).toContain('not-found');
      expect(SYSTEM_PAGE_IDS).toContain('unauthorized');
      expect(SYSTEM_PAGE_IDS).toContain('forbidden');
      expect(SYSTEM_PAGE_IDS).toContain('server-error');
      expect(SYSTEM_PAGE_IDS).toContain('maintenance');
      expect(SYSTEM_PAGE_IDS).toContain('offline');
    });
  });

  describe('getSystemPageSlug', () => {
    test('returns locale-specific slug', () => {
      expect(getSystemPageSlug('home', 'en-US')).toBe('home');
      expect(getSystemPageSlug('home', 'id-ID')).toBe('beranda');
      expect(getSystemPageSlug('not-found', 'id-ID')).toBe('halaman-tidak-ditemukan');
    });

    test('falls back to en-US for unknown locale', () => {
      expect(getSystemPageSlug('home', 'xx-XX')).toBe('home');
    });

    test('returns pageId for unknown page', () => {
      expect(getSystemPageSlug('unknown', 'en-US')).toBe('unknown');
    });
  });

  describe('getRootPageSlug', () => {
    test('returns root slug for en-US', () => {
      expect(getRootPageSlug('en-US')).toBe('home');
    });

    test('returns root slug for id-ID', () => {
      expect(getRootPageSlug('id-ID')).toBe('beranda');
    });
  });

  describe('getErrorPageSlugs', () => {
    test('returns 6 error page slugs', () => {
      expect(getErrorPageSlugs('en-US')).toHaveLength(6);
    });

    test('does not include root page', () => {
      expect(getErrorPageSlugs('en-US')).not.toContain('home');
    });
  });

  describe('isSystemPageId', () => {
    test('returns true for system page ids', () => {
      expect(isSystemPageId('home')).toBe(true);
      expect(isSystemPageId('not-found')).toBe(true);
    });

    test('returns false for non-system pages', () => {
      expect(isSystemPageId('about')).toBe(false);
      expect(isSystemPageId('pricing')).toBe(false);
    });
  });

  describe('isSystemPageSlug', () => {
    test('returns true for system page slugs', () => {
      expect(isSystemPageSlug('home', 'en-US')).toBe(true);
      expect(isSystemPageSlug('beranda', 'id-ID')).toBe(true);
    });

    test('returns false for non-system slugs', () => {
      expect(isSystemPageSlug('about', 'en-US')).toBe(false);
    });
  });

  describe('SYSTEM_PAGE_SLUGS coverage', () => {
    test('has entries for all system pages', () => {
      for (const pageId of SYSTEM_PAGE_IDS) {
        expect(SYSTEM_PAGE_SLUGS[pageId]).toBeDefined();
      }
    });

    test('has en-US entry for every system page', () => {
      for (const pageId of SYSTEM_PAGE_IDS) {
        expect(SYSTEM_PAGE_SLUGS[pageId]['en-US']).toBeDefined();
        expect(typeof SYSTEM_PAGE_SLUGS[pageId]['en-US']).toBe('string');
      }
    });
  });
});
