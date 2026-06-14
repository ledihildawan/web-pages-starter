import { describe, expect, test } from '@rstest/core';
import {
  formatBytes,
  formatCardinal,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatList,
  formatNumber,
  formatOrdinal,
  formatPercent,
  formatUnit,
  setStrategies,
  toNativeDigits,
} from '../../packages/i18n/engine/formatters';
import { setLocale } from '../../packages/i18n/engine/helpers';
import {
  cardinal as arCardinal,
  ordinal as arOrdinal,
} from '../../packages/i18n/strategies/ar';
import {
  cardinal as idCardinal,
  ordinal as idOrdinal,
} from '../../packages/i18n/strategies/id';
import {
  cardinal as jaCardinal,
  ordinal as jaOrdinal,
} from '../../packages/i18n/strategies/ja';
import { cardinal as zhCardinal } from '../../packages/i18n/strategies/zh';

setStrategies(
  { id: idCardinal, ja: jaCardinal, zh: zhCardinal, ar: arCardinal },
  { id: idOrdinal, ja: jaOrdinal, ar: arOrdinal },
);

describe('formatCardinal', () => {
  test('indonesian cardinal 0-10', () => {
    setLocale('id-ID');
    expect(formatCardinal(0)).toBe('nol');
    expect(formatCardinal(1)).toBe('satu');
    expect(formatCardinal(5)).toBe('lima');
    expect(formatCardinal(10)).toBe('sepuluh');
  });

  test('indonesian cardinal teens', () => {
    setLocale('id-ID');
    expect(formatCardinal(11)).toBe('sebelas');
    expect(formatCardinal(15)).toBe('lima belas');
    expect(formatCardinal(19)).toBe('sembilan belas');
  });

  test('indonesian cardinal tens', () => {
    setLocale('id-ID');
    expect(formatCardinal(20)).toBe('dua puluh');
    expect(formatCardinal(21)).toBe('dua puluh satu');
    expect(formatCardinal(99)).toBe('sembilan puluh sembilan');
  });

  test('indonesian cardinal hundreds', () => {
    setLocale('id-ID');
    expect(formatCardinal(100)).toBe('seratus');
    expect(formatCardinal(150)).toBe('seratus lima puluh');
    expect(formatCardinal(200)).toBe('dua ratus');
  });

  test('indonesian cardinal thousands', () => {
    setLocale('id-ID');
    expect(formatCardinal(1000)).toBe('seribu');
    expect(formatCardinal(2000)).toBe('dua ribu');
  });

  test('japanese cardinal', () => {
    setLocale('ja-JP');
    expect(formatCardinal(0)).toBe('〇');
    expect(formatCardinal(3)).toBe('三');
    expect(formatCardinal(10)).toBe('十');
    expect(formatCardinal(15)).toBe('十五');
  });
});

describe('formatOrdinal', () => {
  test('indonesian ordinal', () => {
    setLocale('id-ID');
    expect(formatOrdinal(1)).toBe('kesatu');
    expect(formatOrdinal(2)).toBe('kedua');
    expect(formatOrdinal(3)).toBe('ketiga');
    expect(formatOrdinal(10)).toBe('kesepuluh');
    expect(formatOrdinal(11)).toBe('ke-11');
    expect(formatOrdinal(25)).toBe('ke-25');
  });
});

describe('formatNumber', () => {
  test('formats integer with locale grouping', () => {
    setLocale('id-ID');
    const result = formatNumber(1000);
    expect(result).toContain('1');
    expect(result).toContain('000');
  });

  test('formats with decimals', () => {
    setLocale('id-ID');
    const result = formatNumber(1234.5);
    expect(result).toMatch(/1.*234.*5/);
  });

  test('handles string input', () => {
    setLocale('id-ID');
    const result = formatNumber('42');
    expect(result).toContain('42');
  });
});

describe('formatCurrency', () => {
  test('formats IDR for id-ID', () => {
    setLocale('id-ID');
    const result = formatCurrency(100000, 'IDR');
    expect(result).toContain('100');
    expect(result).toMatch(/Rp/);
  });

  test('formats USD for en-US', () => {
    setLocale('en-US');
    const result = formatCurrency(99.99, 'USD');
    expect(result).toContain('99');
  });
});

describe('formatPercent', () => {
  test('formats 0.5 as 50%', () => {
    setLocale('id-ID');
    const result = formatPercent(0.5);
    expect(result).toContain('50');
  });
});

describe('formatUnit', () => {
  test('formats with unit', () => {
    setLocale('id-ID');
    const result = formatUnit(100, 'kilometer');
    expect(result).toContain('100');
  });
});

describe('formatBytes', () => {
  test('formats 0 bytes', () => {
    setLocale('id-ID');
    const result = formatBytes(0);
    expect(result).toContain('0');
  });

  test('formats kilobytes', () => {
    setLocale('id-ID');
    const result = formatBytes(1024);
    expect(result).toMatch(/1/);
  });

  test('formats megabytes', () => {
    setLocale('id-ID');
    const result = formatBytes(1048576);
    expect(result).toMatch(/1/);
  });
});

describe('formatDate', () => {
  test('returns non-empty string for a date', () => {
    setLocale('id-ID');
    const result = formatDate('2025-01-15');
    expect(result.length).toBeGreaterThan(0);
  });

  test('returns non-empty string for Date object', () => {
    setLocale('id-ID');
    const result = formatDate(new Date(2025, 0, 15));
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('formatDateTime', () => {
  test('returns non-empty string', () => {
    setLocale('id-ID');
    const result = formatDateTime('2025-01-15T10:30:00');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('formatList', () => {
  test('formats list with conjunction', () => {
    setLocale('id-ID');
    const result = formatList(['A', 'B', 'C']);
    expect(result).toContain('A');
    expect(result).toContain('B');
    expect(result).toContain('C');
  });

  test('formats single item', () => {
    setLocale('id-ID');
    expect(formatList(['Solo'])).toBe('Solo');
  });

  test('formats empty list', () => {
    setLocale('id-ID');
    expect(formatList([])).toBe('');
  });
});

describe('toNativeDigits', () => {
  test('does not convert when force=false', () => {
    setLocale('id-ID');
    expect(toNativeDigits('123', false)).toBe('123');
  });

  test('does not convert for latn locale without force', () => {
    setLocale('id-ID');
    expect(toNativeDigits('123')).toBe('123');
  });
});
