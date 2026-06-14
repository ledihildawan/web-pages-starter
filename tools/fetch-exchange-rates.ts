import fs from 'node:fs';
import path from 'node:path';
import { CURRENCY_CODE } from '../packages/i18n/data/currencies';
import { LOCALES } from '../packages/i18n/data/locales';
import { PATHS } from '../src/configs/paths';
import { log } from './shared/logger';
import { generatedHeader, writeFilePath } from './shared/write-file';

const EXCHANGE_RATES_URL = 'https://api.frankfurter.dev/v2/rates';
const GENERATED_DIR = path.resolve(process.cwd(), PATHS.GENERATED);
const EXCHANGE_RATES_FILE = path.resolve(GENERATED_DIR, 'exchange-rates.ts');
const BASE_CURRENCY = CURRENCY_CODE.USD;
const LOCALE_CURRENCIES = [...new Set(LOCALES.map((l) => l.currency))];

async function fetchExchangeRates(): Promise<Record<string, number>> {
  const quotes = LOCALE_CURRENCIES.filter((c) => c !== BASE_CURRENCY).join(',');
  const url = `${EXCHANGE_RATES_URL}?base=${BASE_CURRENCY}${quotes ? `&quotes=${quotes}` : ''}`;

  log.info(`Fetching from: ${url}`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch exchange rates: ${response.statusText}`);
  }

  const data = (await response.json()) as Array<{
    quote: string;
    rate: number;
  }>;

  const ratesObj: Record<string, number> = {
    [BASE_CURRENCY]: 1,
  };

  for (const item of data) {
    ratesObj[item.quote] = item.rate;
  }

  return ratesObj;
}

function formatRatesObject(rates: Record<string, number>): string {
  const entries = Object.entries(rates)
    .sort(([, a], [, b]) => a - b)
    .map(([key, value]) => `  ${key}: ${value.toFixed(8)}`)
    .join(',\n');
  return `{\n${entries}\n}`;
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
  const hoursSinceUpdate =
    (now.getTime() - data.lastUpdated.getTime()) / (1_000 * 60 * 60);
  return hoursSinceUpdate < 24;
}

async function generateExchangeRates(forceRefresh = false): Promise<void> {
  const existing = await loadExistingRates();

  if (!forceRefresh && existing && isRatesFresh(existing)) {
    log.info(
      `Using cached exchange rates (last updated: ${existing.lastUpdated})`,
    );
    return;
  }

  log.info(
    `Fetching ${LOCALE_CURRENCIES.length} currencies: ${LOCALE_CURRENCIES.join(', ')}`,
  );

  try {
    const rates = await fetchExchangeRates();

    log.info(`Fetched ${Object.keys(rates).length} exchange rates:`);
    for (const [currency, rate] of Object.entries(rates)) {
      log.info(`  1 ${BASE_CURRENCY} = ${rate.toFixed(4)} ${currency}`);
    }

    const header = generatedHeader('tools/fetch-exchange-rates.ts');
    const content = `${header}

export const EXCHANGE_RATES = ${formatRatesObject(rates)} as const;

export function convertCurrency(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number> = EXCHANGE_RATES
): number {
  if (from === to) return amount;

  const fromRate = rates[from];
  const toRate = rates[to];

  if (!fromRate || !toRate) {
    const missing = !fromRate ? from : to;
    console.warn(\`[i18n] Currency not supported: \${missing}. Available: \${Object.keys(rates).join(', ')}\`);
    return amount;
  }

  const inBase = amount / fromRate;
  return inBase * toRate;
}
`;

    writeFilePath(EXCHANGE_RATES_FILE, content);

    log.info(
      `Exchange rates saved to ${EXCHANGE_RATES_FILE.replace(process.cwd(), '.')}`,
    );
    log.info(`Last updated: ${new Date().toISOString()}`);
  } catch (error) {
    log.error(`Error: Failed to generate exchange rates — ${error}`);

    if (!existing) {
      throw error;
    }
    log.info('Using existing cached rates as fallback');
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
