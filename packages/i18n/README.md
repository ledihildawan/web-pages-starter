# @web-pages-starter/i18n

Internationalization engine for 136 BCP 47 locales across 93 languages.

## Architecture

```
packages/i18n/
├── index.ts           Public API barrel (formatting + helpers + types)
├── config/            Type-safe config builders (defineI18n, defineFontStack)
├── data/              Master locale data (136 locales, 93 languages, 33 numbering systems)
├── engine/            Formatting engine (Intl-backed formatters, locale helpers, active-locale filtering)
├── strategies/        Per-language cardinal/ordinal spellout (code-split async chunks)
├── fonts/             Dynamic font loading (writing-system-aware, MutationObserver-driven)
├── runtime/           Client-side i18next init, Alpine store, locale switching
├── template/          Nunjucks SSR helpers (i18n.t, formatters, inline bootstrap script)
├── cli/               Build-time CLI tools (generate, sync, parity, watch)
└── utils.ts           Shared locale file loader
```

## Subpackages

| Entry point | Purpose | Environment |
|---|---|---|
| `@i18n` | Formatters, helpers, types (no DOM/i18next) | Universal |
| `@i18n/config/define` | `defineI18n`, `defineFont`, `defineFontStack` | Universal |
| `@i18n/engine/formatters` | Intl-backed number/currency/date/cardinal formatters | Universal |
| `@i18n/engine/helpers` | Locale lookup, fallback chain, direction, currency | Universal |
| `@i18n/engine/active-locales` | `getActiveLocaleCodes()`, `getActiveLocales()` | Universal |
| `@i18n/runtime/runtime` | i18next init, `translatePage()`, `updateFormattedElements()` | Browser |
| `@i18n/runtime/store` | Alpine.js `$store.i18n` registration | Browser |
| `@i18n/template/template` | Nunjucks `i18n.*` API, `createTemplateParams()`, `scanSharedLocales()` | Build-time |
| `@i18n/fonts/fonts` | `setupFontStackCSS()`, `loadLanguageFonts()`, `preloadActiveFont()` | Browser |
| `@i18n/data/locales` | `LOCALES` array (136 entries), `LocaleCode`, `LocaleConfig` types | Build-time |
| `@i18n/cli/*` | `generate-active-locales`, `generate-types`, `sync-locales`, `check-parity`, `watch` | Node CLI |

## Key Features

- **136 locales** out of the box with per-concern data (languages, regions, currencies, timezones, numbering systems, writing systems)
- **Active locale filtering** — production builds ship only configured locales
- **Code-split strategies** — Arabic, Indonesian, Japanese, Chinese cardinal/ordinal spellout loaded on demand
- **Native digits** — 12+ numbering systems with automatic conversion
- **RTL support** — Arabic, Hebrew, N'Ko, Adlam with logical CSS property integration
- **Regional pricing** — per-locale price overrides with currency conversion
- **Dual rendering** — SSR via Nunjucks + runtime via i18next (same keys, zero reload)
- **Font system** — writing-system-aware CSS variable management with MutationObserver

## Quick Reference

```ts
// Config
import { defineI18n, defineFontStack } from '@i18n/config/define';

const config = defineI18n({ defaultLocale: 'en-US', locales: ['id-ID', 'ja-JP'] });
const fonts = defineFontStack({ sans: { name: 'inter', family: 'Inter Variable' } });

// Formatting
import { formatCurrency, formatDate, formatCardinal, setLocale } from '@i18n';

setLocale('ja-JP');
formatCurrency(99.99, 'JPY');    // "¥100"
formatDate('2026-06-15');         // "2026/06/15"

setLocale('ar-SA');
formatCardinal(42, { gender: 'masculine' }); // "اثنان وأربعون"

// Runtime (browser)
import { initIntl } from '@i18n/runtime/runtime';
await initIntl('ja-JP');

// Template (build-time)
import { createTemplateParams } from '@i18n/template/template';
const params = createTemplateParams({ entryName: 'home' }, ...);
```

## Dependencies

- **i18next** — runtime translation engine
- **i18next-browser-languagedetector** — locale detection
- **pluralize** — English pluralization
- **chokidar** — file watcher (CLI only)

Generated at build time:
- `generated/active-locales-data.ts` — filtered locale/language/font data
- `generated/exchange-rates.ts` — currency conversion rates
- `generated/i18n.d.ts` — TypeScript key types from locale JSON
