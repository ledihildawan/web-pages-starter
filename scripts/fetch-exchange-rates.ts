import fs from 'node:fs';
import { inject, loadTemplate } from '@codegen';
import { lookup } from '@generated/paths';
import { CURRENCY_CODE } from '@i18n/data/currencies';
import { getActiveLocales } from '@i18n/engine/active-locales';
import { log } from './lib/logger';
import { writeFilePath } from './lib/write-file';

const EXCHANGE_RATES_URL = 'https://api.frankfurter.dev/v2/rates';
const EXCHANGE_RATES_FILE = lookup('@generated', 'exchange-rates.ts');
const BASE_CURRENCY = CURRENCY_CODE.USD;

function getActiveCurrencies(): Set<string> {
  const currencies = new Set<string>([BASE_CURRENCY]);
  for (const locale of getActiveLocales()) {
    currencies.add(locale.currency);
  }
  return currencies;
}

async function fetchExchangeRates(): Promise<Record<string, number>> {
  const url = `${EXCHANGE_RATES_URL}?base=${BASE_CURRENCY}`;

  log.info(`Fetching from: ${url}`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`[i18n] Failed to fetch exchange rates: ${response.statusText}`);
  }

  const raw = await response.json();

  if (!Array.isArray(raw)) {
    throw new Error('[i18n] Exchange rates API returned unexpected format');
  }

  const activeCurrencies = getActiveCurrencies();

  const ratesObj: Record<string, number> = {
    [BASE_CURRENCY]: 1,
  };

  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue;
    if (typeof item.quote !== 'string' || typeof item.rate !== 'number') continue;
    if (activeCurrencies.has(item.quote)) {
      ratesObj[item.quote] = item.rate;
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

async function loadExistingRates(): Promise<{ lastUpdated: Date } | null> {
  if (fs.existsSync(EXCHANGE_RATES_FILE)) {
    try {
      const stats = await fs.promises.stat(EXCHANGE_RATES_FILE);
      return { lastUpdated: stats.mtime };
    } catch {
      log.warn('Warning: Could not read cached exchange rates');
      return null;
    }
  }
  return null;
}

function isRatesFresh(data: { lastUpdated: Date }): boolean {
  const now = new Date();
  const hoursSinceUpdate = (now.getTime() - data.lastUpdated.getTime()) / (1_000 * 60 * 60);
  return hoursSinceUpdate < 24;
}

async function generateExchangeRates(forceRefresh = false): Promise<void> {
  const existing = await loadExistingRates();

  if (!forceRefresh && existing && isRatesFresh(existing)) {
    log.info(`Using cached exchange rates (last updated: ${existing.lastUpdated})`);
    return;
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

    log.info(`Exchange rates saved to ${EXCHANGE_RATES_FILE.replace(process.cwd(), '.')}`);
    log.info(`Last updated: ${new Date().toISOString()}`);
  } catch (error) {
    log.error(`Error: Failed to generate exchange rates — ${error}`);

    if (!existing) {
      throw error;
    }
    const hoursSinceUpdate = (Date.now() - existing.lastUpdated.getTime()) / (1_000 * 60 * 60);
    log.warn(`Using stale cached exchange rates (${hoursSinceUpdate.toFixed(1)} hours old) — update recommended`);
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
