import { REGION_CODE } from './regions';

export const FLAGS = [
  { code: 'ID', emoji: '🇮🇩', name: 'Indonesia', region: REGION_CODE.ID },
  { code: 'US', emoji: '🇺🇸', name: 'United States', region: REGION_CODE.US },
  { code: 'GB', emoji: '🇬🇧', name: 'United Kingdom', region: REGION_CODE.GB },
  { code: 'CA', emoji: '🇨🇦', name: 'Canada', region: REGION_CODE.CA },
  { code: 'AU', emoji: '🇦🇺', name: 'Australia', region: REGION_CODE.AU },
  { code: 'IN', emoji: '🇮🇳', name: 'India', region: REGION_CODE.IN },
  { code: 'NZ', emoji: '🇳🇿', name: 'New Zealand', region: REGION_CODE.NZ },
  { code: 'ZA', emoji: '🇿🇦', name: 'South Africa', region: REGION_CODE.ZA },
  { code: 'JP', emoji: '🇯🇵', name: 'Japan', region: REGION_CODE.JP },
  { code: 'CN', emoji: '🇨🇳', name: 'China', region: REGION_CODE.CN },
  { code: 'SG', emoji: '🇸🇬', name: 'Singapore', region: REGION_CODE.SG },
  { code: 'TW', emoji: '🇹🇼', name: 'Taiwan', region: REGION_CODE.TW },
  { code: 'HK', emoji: '🇭🇰', name: 'Hong Kong', region: REGION_CODE.HK },
  { code: 'MO', emoji: '🇲🇴', name: 'Macau', region: REGION_CODE.MO },
  { code: 'MY', emoji: '🇲🇾', name: 'Malaysia', region: REGION_CODE.MY },
  { code: 'SA', emoji: '🇸🇦', name: 'Saudi Arabia', region: REGION_CODE.SA },
  {
    code: 'AE',
    emoji: '🇦🇪',
    name: 'United Arab Emirates',
    region: REGION_CODE.AE,
  },
  { code: 'EG', emoji: '🇪🇬', name: 'Egypt', region: REGION_CODE.EG },
  { code: 'MA', emoji: '🇲🇦', name: 'Morocco', region: REGION_CODE.MA },
  { code: 'TN', emoji: '🇹🇳', name: 'Tunisia', region: REGION_CODE.TN },
  { code: 'ES', emoji: '🇪🇸', name: 'Spain', region: REGION_CODE.ES },
  { code: 'MX', emoji: '🇲🇽', name: 'Mexico', region: REGION_CODE.MX },
  { code: 'AR', emoji: '🇦🇷', name: 'Argentina', region: REGION_CODE.AR },
  { code: 'CO', emoji: '🇨🇴', name: 'Colombia', region: REGION_CODE.CO },
  { code: 'PE', emoji: '🇵🇪', name: 'Peru', region: REGION_CODE.PE },
  { code: 'BR', emoji: '🇧🇷', name: 'Brazil', region: REGION_CODE.BR },
  { code: 'PT', emoji: '🇵🇹', name: 'Portugal', region: REGION_CODE.PT },
  { code: 'AO', emoji: '🇦🇴', name: 'Angola', region: REGION_CODE.AO },
  { code: 'MZ', emoji: '🇲🇿', name: 'Mozambique', region: REGION_CODE.MZ },
  { code: 'NP', emoji: '🇳🇵', name: 'Nepal', region: REGION_CODE.NP },
  { code: 'KR', emoji: '🇰🇷', name: 'South Korea', region: REGION_CODE.KR },
  { code: 'KP', emoji: '🇰🇵', name: 'North Korea', region: REGION_CODE.KP },
  { code: 'FR', emoji: '🇫🇷', name: 'France', region: REGION_CODE.FR },
  { code: 'BE', emoji: '🇧🇪', name: 'Belgium', region: REGION_CODE.BE },
  { code: 'CH', emoji: '🇨🇭', name: 'Switzerland', region: REGION_CODE.CH },
  { code: 'DE', emoji: '🇩🇪', name: 'Germany', region: REGION_CODE.DE },
  { code: 'AT', emoji: '🇦🇹', name: 'Austria', region: REGION_CODE.AT },
  { code: 'RU', emoji: '🇷🇺', name: 'Russia', region: REGION_CODE.RU },
  { code: 'TH', emoji: '🇹🇭', name: 'Thailand', region: REGION_CODE.TH },
] as const;

export const FLAG_CODES = FLAGS.map((f) => f.code) as FlagCode[];

export const FLAG_CODE = FLAG_CODES.reduce(
  (acc, flag) => {
    const key = flag.toUpperCase();
    return Object.assign(acc, { [key]: flag });
  },
  {} as Record<string, FlagCode>,
) as {
  [K in FlagCode as Uppercase<K>]: K;
};

export type FlagCode = (typeof FLAGS)[number]['code'];
export type FlagConfig = (typeof FLAGS)[number];
