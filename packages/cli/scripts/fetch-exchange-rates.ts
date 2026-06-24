import fs from 'node:fs';
import { join } from 'pathe';
import { log } from '@web-pages-starter/core/logger';
import { getCacheWithTTL, setCacheWithTTL } from '@web-pages-starter/core/pipeline-cache';
import { writeFilePath } from '@web-pages-starter/core/write-file';
import { env } from '@generated/env';
import { lookup } from '@generated/paths';
import { CURRENCY_CODE, CURRENCY_CODES } from '@i18n/data/currencies';
import { getActiveLocales } from '@i18n/engine/active-locales';
import { readJSON5 } from '@web-pages-starter/core/json5';

const CURRENCY_FREAKS_URL = 'https://api.currencyfreaks.com/v2.0/rates/latest';
const EXCHANGE_RATES_FILE = lookup('@generated', 'exchange-rates.ts');
const BASE_CURRENCY = CURRENCY_CODE.USD;
const TTL_MINUTES = 24 * 60;
const PRICE_KEY_PATTERN = /^price_([a-z]{3})$/;
const CURRENCY_ARR_PATTERNS = ['currency_comparison_currencies', 'supported_currencies', 'available_currencies'];

function extractCurrenciesFromData(
  data: Record<string, unknown>,
  currencies: Set<string>,
  whitelist: Set<string>,
): void {
  if (typeof data !== 'object' || data === null) return;

  for (const [key, value] of Object.entries(data)) {
    const priceMatch = key.match(PRICE_KEY_PATTERN);
    if (priceMatch && whitelist.has(priceMatch[1].toUpperCase())) {
      currencies.add(priceMatch[1].toUpperCase());
    }

    if (CURRENCY_ARR_PATTERNS.includes(key) && Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string' && whitelist.has(item.toUpperCase())) {
          currencies.add(item.toUpperCase());
        }
      }
    }

    if (typeof value === 'object' && value !== null) {
      extractCurrenciesFromData(value as Record<string, unknown>, currencies, whitelist);
    }
  }
}

function getCurrenciesFromPages(whitelist: Set<string>): Set<string> {
  const currencies = new Set<string>();
  const pagesDir = lookup('@pages');

  if (!fs.existsSync(pagesDir)) {
    return currencies;
  }

  const scanDir = (dir: string): void => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.name === 'data.json5') {
        try {
          const data = readJSON5(fullPath);
          extractCurrenciesFromData(data, currencies, whitelist);
        } catch (error) {
          log.warn(`Could not read ${fullPath}: ${error}`);
        }
      }
    }
  };

  scanDir(pagesDir);
  return currencies;
}

function getActiveCurrencies(): Set<string> {
  const currencies = new Set<string>([BASE_CURRENCY]);

  for (const locale of getActiveLocales()) {
    currencies.add(locale.currency);
  }

  const pageCurrencies = getCurrenciesFromPages(new Set(CURRENCY_CODES));
  for (const currency of pageCurrencies) {
    currencies.add(currency);
  }

  return currencies;
}

async function fetchExchangeRates(): Promise<Record<string, number>> {
  const activeCurrencies = getActiveCurrencies();
  const symbols = [...activeCurrencies].join(',');
  const apiKey = env.CURRENCY_FREAKS_API_KEY;
  const url = `${CURRENCY_FREAKS_URL}?apikey=${apiKey}&symbols=${symbols}&base=${BASE_CURRENCY}`;

  log.info(`Fetching from: ${url.replace(apiKey || '', '***')}`);

  if (!apiKey) {
    throw new Error('CURRENCY_FREAKS_API_KEY not set in environment');
  }

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
    if (typeof currency !== 'string') continue;
    const numRate = typeof rate === 'string' ? parseFloat(rate) : typeof rate === 'number' ? rate : NaN;
    if (!Number.isNaN(numRate)) {
      ratesObj[currency] = numRate;
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

function inject(template: string, values: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replaceAll(`{{codegen:${key}}}`, value);
  }
  return result;
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

    const template = `/**
 * Generated by: packages/cli/scripts/fetch-exchange-rates.ts
 * Generated at: {{codegen:generated_at}}
 *
 * WARNING: DO NOT EDIT MANUALLY
 * This file is automatically updated.
{{codegen:description}} */

export const EXCHANGE_RATES = {
{{codegen:rates_object}}
} as const;
`;
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
