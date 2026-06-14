import { describe, expect, test } from '@rstest/core';
import { romanize } from '../../scripts/shared/romanize';

describe('romanize', () => {
  test('romanizes Chinese to pinyin with tone numbers', () => {
    expect(romanize('中文页面')).toMatch(/zhong|wen|ye|mian/);
  });

  test('romanizes Cyrillic to Latin', () => {
    expect(romanize('О нас')).toBe('o-nas');
  });

  test('handles already-Latin text', () => {
    expect(romanize('about us')).toBe('about-us');
  });

  test('handles mixed scripts', () => {
    const result = romanize('hello 世界');
    expect(result).toContain('hello');
    expect(result).toMatch(/shi|jie/);
  });

  test('produces lowercase output', () => {
    expect(romanize('HelloWorld')).toBe(romanize('HelloWorld').toLowerCase());
  });

  test('handles empty string', () => {
    expect(romanize('')).toBe('');
  });
});
