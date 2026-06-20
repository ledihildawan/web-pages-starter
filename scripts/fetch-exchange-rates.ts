import fs from 'node:fs';
import { inject, loadTemplate } from '@codegen';
import { lookup } from '@generated/paths';
import { CURRENCY_CODE } from '@i18n/data/currencies';
import { getActiveLocales } from '@i18n/engine/active-locales';
import { log } from './lib/logger';
import { getCacheWithTTL, setCacheWithTTL } from './lib/pipeline-cache';
import { writeFilePath } from './lib/write-file';

const EXCHANGE_RATES_URL = 'https://api.frankfurter.dev/v1';
const FRANKFURTER_CURRENCIES_URL = `${EXCHANGE_RATES_URL}/currencies`;
const FRANKFURTER_RATES_URL = `${EXCHANGE_RATES_URL}/latest`;
const EXCHANGE_RATES_FILE = lookup('@generated', 'exchange-rates.ts');
const BASE_CURRENCY = CURRENCY_CODE.USD;
const TTL_MINUTES = 24 * 60;
const PRICE_KEY_PATTERN = /^price_([a-z]{3})$/;

async function getFrankfurterCurrencies(): Promise<Set<string>> {
  try {
    const response = await fetch(FRANKFURTER_CURRENCIES_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch currencies: ${response.statusText}`);
    }
    const data = await response.json();
    return new Set(Object.keys(data));
  } catch (error) {
    log.warn(`Could not fetch Frankfurter currencies: ${error}. Using fallback list.`);
    return new Set([
      'AUD',
      'BRL',
      'CAD',
      'CHF',
      'CNY',
      'EUR',
      'GBP',
      'HKD',
      'HUF',
      'IDR',
      'INR',
      'JPY',
      'KRW',
      'MXN',
      'MYR',
      'NOK',
      'NZD',
      'PHP',
      'PLN',
      'RON',
      'SEK',
      'SGD',
      'THB',
      'TRY',
      'USD',
      'ZAR',
    ]);
  }
}

function getPricingCurrencies(whitelist: Set<string>): Set<string> {
  const currencies = new Set<string>();
  const pricingPath = lookup('@pages', 'pricing', 'data.json5');

  if (!fs.existsSync(pricingPath)) {
    log.warn(`Pricing data not found at ${pricingPath}`);
    return currencies;
  }

  try {
    const content = fs.readFileSync(pricingPath, 'utf-8');
    const data = JSON.parse(content);
    extractPriceKeys(data, currencies, whitelist);
  } catch (error) {
    log.warn(`Could not read pricing data: ${error}`);
  }

  return currencies;
}

function extractPriceKeys(obj: unknown, currencies: Set<string>, whitelist: Set<string>): void {
  if (typeof obj !== 'object' || obj === null) return;

  for (const [key, value] of Object.entries(obj)) {
    const match = key.match(PRICE_KEY_PATTERN);
    if (match && whitelist.has(match[1].toUpperCase())) {
      currencies.add(match[1].toUpperCase());
    }
    if (typeof value === 'object' && value !== null) {
      extractPriceKeys(value, currencies, whitelist);
    }
  }
}

function getActiveCurrencies(whitelist: Set<string>): Set<string> {
  const currencies = new Set<string>([BASE_CURRENCY]);

  for (const locale of getActiveLocales()) {
    if (whitelist.has(locale.currency)) {
      currencies.add(locale.currency);
    }
  }

  const pricingCurrencies = getPricingCurrencies(whitelist);
  for (const currency of pricingCurrencies) {
    currencies.add(currency);
  }

  return currencies;
}

async function fetchExchangeRates(): Promise<Record<string, number>> {
  const whitelist = await getFrankfurterCurrencies();
  const activeCurrencies = getActiveCurrencies(whitelist);

  const url = `${FRANKFURTER_RATES_URL}?base=${BASE_CURRENCY}`;

  log.info(`Fetching from: ${url}`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`[i18n] Failed to fetch exchange rates: ${response.statusText}`);
  }

  const raw = await response.json();

  if (!raw.rates || typeof raw.rates !== 'object') {
    throw new Error('[i18n] Exchange rates API returned unexpected format');
  }

  const ratesObj: Record<string, number> = {
    [BASE_CURRENCY]: 1,
  };

  for (const [currency, rate] of Object.entries(raw.rates)) {
    if (typeof currency !== 'string' || typeof rate !== 'number') continue;
    if (activeCurrencies.has(currency)) {
      ratesObj[currency] = rate;
    }
  }

  return ratesObj;
}

function formatRatesObject(rates: Record<string, number>): string {
  return Object.entries(rates)
    .sort(([, a], [, b]) => a - b)
    .map(([key, value]) => `  ${key}: ${value.toFixed(8)}`)
    .join(',\n');
}

async function generateExchangeRates(forceRefresh = false): Promise<void> {
  if (!forceRefresh) {
    const cached = getCacheWithTTL('exchange-rates');
    if (cached && fs.existsSync(EXCHANGE_RATES_FILE)) {
      log.info(`Using cached exchange rates (last updated: ${cached.cachedAt})`);
      return;
    }
  }

  log.info(`Fetching all exchange rates (base: ${BASE_CURRENCY})`);

  try {
    const rates = await fetchExchangeRates();

    log.info(`Fetched ${Object.keys(rates).length} exchange rates:`);
    for (const [currency, rate] of Object.entries(rates)) {
      log.info(`  1 ${BASE_CURRENCY} = ${rate.toFixed(4)} ${currency}`);
    }

    const template = loadTemplate('exchange-rates.ts');
    const content = inject(template, {
      generated_at: new Date().toISOString(),
      rates_object: formatRatesObject(rates),
      description: ` * Currencies: ${Object.keys(rates).sort().join(', ')}\n *\n`,
    });

    writeFilePath(EXCHANGE_RATES_FILE, content);
    setCacheWithTTL('exchange-rates', TTL_MINUTES);

    log.info(`Exchange rates saved to ${EXCHANGE_RATES_FILE.replace(process.cwd(), '.')}`);
    log.info(`Last updated: ${new Date().toISOString()}`);
  } catch (error) {
    log.error(`Error: Failed to generate exchange rates — ${error}`);
    throw error;
  }
}

const args = process.argv.slice(2);
const forceRefresh = args.includes('--force') || args.includes('-f');

generateExchangeRates(forceRefresh)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    log.error(`Error: Exchange rates generation failed — ${error}`);
    process.exit(1);
  });
