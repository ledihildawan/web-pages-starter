export const CURRENCIES = [
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', decimals: 2, region: 'AE' },
  {
    code: 'AOA',
    name: 'Angolan Kwanza',
    symbol: 'Kz',
    decimals: 2,
    region: 'AO',
  },
  {
    code: 'ARS',
    name: 'Argentine Peso',
    symbol: '$',
    decimals: 2,
    region: 'AR',
  },
  {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: '$',
    decimals: 2,
    region: 'AU',
  },
  {
    code: 'BRL',
    name: 'Brazilian Real',
    symbol: 'R$',
    decimals: 2,
    region: 'BR',
  },
  {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: '$',
    decimals: 2,
    region: 'CA',
  },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', decimals: 2, region: 'CH' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimals: 2, region: 'CN' },
  {
    code: 'COP',
    name: 'Colombian Peso',
    symbol: '$',
    decimals: 2,
    region: 'CO',
  },
  {
    code: 'EGP',
    name: 'Egyptian Pound',
    symbol: 'E£',
    decimals: 2,
    region: 'EG',
  },
  { code: 'EUR', name: 'Euro', symbol: '€', decimals: 2, region: 'EU' },
  {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    decimals: 2,
    region: 'GB',
  },
  {
    code: 'HKD',
    name: 'Hong Kong Dollar',
    symbol: '$',
    decimals: 2,
    region: 'HK',
  },
  {
    code: 'IDR',
    name: 'Indonesian Rupiah',
    symbol: 'Rp',
    decimals: 0,
    region: 'ID',
  },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimals: 2, region: 'IN' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimals: 0, region: 'JP' },
  {
    code: 'KPW',
    name: 'North Korean Won',
    symbol: '₩',
    decimals: 2,
    region: 'KP',
  },
  {
    code: 'KRW',
    name: 'South Korean Won',
    symbol: '₩',
    decimals: 0,
    region: 'KR',
  },
  {
    code: 'MAD',
    name: 'Moroccan Dirham',
    symbol: 'DH',
    decimals: 2,
    region: 'MA',
  },
  {
    code: 'MOP',
    name: 'Macanese Pataca',
    symbol: 'MOP$',
    decimals: 2,
    region: 'MO',
  },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', decimals: 2, region: 'MX' },
  {
    code: 'MYR',
    name: 'Malaysian Ringgit',
    symbol: 'RM',
    decimals: 2,
    region: 'MY',
  },
  {
    code: 'MZN',
    name: 'Mozambican Metical',
    symbol: 'MT',
    decimals: 2,
    region: 'MZ',
  },
  {
    code: 'NPR',
    name: 'Nepalese Rupee',
    symbol: '₨',
    decimals: 2,
    region: 'NP',
  },
  {
    code: 'NZD',
    name: 'New Zealand Dollar',
    symbol: '$',
    decimals: 2,
    region: 'NZ',
  },
  {
    code: 'PEN',
    name: 'Peruvian Sol',
    symbol: 'S/',
    decimals: 2,
    region: 'PE',
  },
  {
    code: 'RUB',
    name: 'Russian Ruble',
    symbol: '₽',
    decimals: 2,
    region: 'RU',
  },
  {
    code: 'SAR',
    name: 'Saudi Riyal',
    symbol: 'ر.س',
    decimals: 2,
    region: 'SA',
  },
  {
    code: 'SGD',
    name: 'Singapore Dollar',
    symbol: '$',
    decimals: 2,
    region: 'SG',
  },
  {
    code: 'TND',
    name: 'Tunisian Dinar',
    symbol: 'DT',
    decimals: 3,
    region: 'TN',
  },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', decimals: 2, region: 'TH' },
  {
    code: 'TWD',
    name: 'Taiwan Dollar',
    symbol: '$',
    decimals: 2,
    region: 'TW',
  },
  { code: 'USD', name: 'US Dollar', symbol: '$', decimals: 2, region: 'US' },
  {
    code: 'ZAR',
    name: 'South African Rand',
    symbol: 'R',
    decimals: 2,
    region: 'ZA',
  },
] as const;

export const CURRENCY_CODES = CURRENCIES.map((c) => c.code) as CurrencyCode[];

export const CURRENCY_CODE = CURRENCY_CODES.reduce(
  (acc, currency) => {
    const key = currency.toUpperCase();
    return Object.assign(acc, { [key]: currency });
  },
  {} as Record<string, CurrencyCode>,
) as {
  [K in CurrencyCode as Uppercase<K>]: K;
};

export type CurrencyCode = (typeof CURRENCIES)[number]['code'];
export type CurrencyConfig = (typeof CURRENCIES)[number];

export const BASE_CURRENCY: CurrencyCode = CURRENCY_CODE.USD;
