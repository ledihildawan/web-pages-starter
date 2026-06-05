# Web Pages Starter

A minimal multi-page starter for content sites that need to ship in many languages from day one. **Rsbuild + Nunjucks + Alpine + Tailwind + i18next** wired together so that copy, formatting, RTL, native digits, and regional pricing all flow from one source of truth.

- **42 BCP 47 locales** out of the box (`id-ID`, `en-US`, `zh-Hans-CN`, `zh-Hant-TW`, `ar-SA`, `ja-JP`, …)
- **One source of truth** — `src/locales/{locale}/*.json5` for copy, `src/configs/locales.ts` for behavior
- **Inline hydration** — templates emit `<span data-i18n="…">` so i18next can swap text in place
- **Zero-touch scaffolding** — drop a folder under `src/pages/` and it becomes a route
- **No hand-rolled formatting** — every number, currency, date, and price goes through `i18n.*`

See **[`docs/i18n.md`](docs/i18n.md)** for the full i18n reference.

## Quick Start

```bash
bun install
bun run dev          # http://localhost:8888
bun run build        # production build to ./dist
bun run preview      # serve the production build
```

Requires [Bun](https://bun.sh) `>= 1.0`.

## Generate a Page

```bash
bun run gen:page pricing
```

This scaffolds:

```
src/pages/pricing/
  index.njk         # Nunjucks template (required)
  index.ts          # Page entry (optional)
  index.css         # Page styles (optional)

src/locales/{locale}/pricing.json5   # 42 translation files
```

The build picks up the page automatically; no router config to touch.

## Project Structure

```
src/
├── configs/
│   ├── locales.ts        # languages, regions, currencies, timezones, fallbacks (single source of truth)
│   └── paths.ts          # filesystem path constants
├── pages/                # routes — one folder per page
│   └── {page}/
│       ├── index.njk     # template (required)
│       ├── index.json5   # static page data (optional)
│       ├── index.ts      # page entry (optional)
│       └── index.css     # page styles (optional)
├── components/           # reusable Nunjucks partials
├── layouts/              # base templates (main.njk)
├── locales/              # translation source of truth
│   └── {locale}/
│       ├── common.json5
│       ├── {page}.json5
│       └── components/{name}.json5
├── scripts/              # client TS — bootstrap, i18n, stores, formatters
├── styles/               # global styles (Tailwind entry)
├── assets/               # images, fonts, raw assets
└── types/                # shared TS types

tools/                    # build-time scripts (gen, sync, parity, exchange rates)
generated/                # auto-generated: i18n.d.ts, exchange-rates.ts
docs/                     # guides (i18n.md)
```

## How i18n Works

```
src/locales/{locale}/*.json5
        │
        ├─► Nunjucks build (src/scripts/lib/template.ts)
        │     resolves keys with the default locale and emits HTML
        │     with data-* attributes
        │
        └─► Inline bootstrap in <head>
              exposes window.__I18N_DATA__ for every locale
                       │
                       ▼
              src/scripts/lib/i18n.ts
                  i18next.init(...)
                  translatePage()          (data-i18n, data-i18n-plural, …)
                  updateFormattedElements() (data-format-*, data-convert-*, …)
```

The same translation key (`i18n.t('page.hero.title')`) renders the initial HTML at build time and is updated in place by i18next when the user changes language — no full reload, no second fetch.

## At a Glance

```njk
{# translation with runtime data attribute #}
<h1>{{ i18n.t('page.hero.title') }}</h1>

{# formatters — locale-aware numbers, currency, dates #}
<span>{{ i18n.formatNumber(1234.56) }}</span>
<span>{{ i18n.formatCurrency(99, 'USD') }}</span>
<time>{{ i18n.formatDate('2026-06-04', { dateStyle: 'long' }) }}</time>

{# regional pricing — picks the right currency for the active locale #}
<span>{{ i18n.formatLocalPrice(plan) }}</span>

{# language switcher #}
<button @click="$store.i18n.change('en-US')">English</button>
```

## Commands

| Command | What it does |
| --- | --- |
| `bun run dev` | Fetch rates, watch JSON5, start the Rsbuild dev server |
| `bun run build` | Fetch rates, regenerate i18n types, production build |
| `bun run preview` | Serve the production build |
| `bun run gen:page <name>` | Scaffold a new page and 42 translation files |
| `bun run gen:i18n` | Regenerate `generated/i18n.d.ts` |
| `bun run watch:i18n` | Watch JSON5 files and rerun `gen:i18n` |
| `bun run sync:locales` | Create missing locale folders from the default |
| `bun run check:parity` | Diff keys across all locales |
| `bun run fetch:rates` | Update exchange rates (24h cache) |
| `bun run fetch:rates:force` | Bypass the rate cache |
| `bun run clean` | Wipe `dist`, `node_modules`, and reinstall |

## Locales

42 locales are configured in [`src/configs/locales.ts`](src/configs/locales.ts). The default is `id-ID`. Add a new locale by adding an entry there and running `bun run sync:locales`.

Highlights:

| Group | Codes | Notes |
| --- | --- | --- |
| Indonesian | `id-ID` | Default |
| English | `en-US`, `en-GB`, `en-CA`, `en-AU`, `en-IN`, `en-NZ`, `en-ZA` | Region-specific currencies |
| Chinese | `zh-Hans-CN`, `zh-Hans-SG`, `zh-Hans-MY`, `zh-Hant-TW`, `zh-Hant-HK`, `zh-Hant-MO` | Script variants |
| Arabic | `ar-SA`, `ar-AE`, `ar-EG`, `ar-MA`, `ar-TN` | RTL, native digits, six-form plurals |
| Japanese, Korean, Thai, Hindi, Russian | `ja-JP`, `ko-KR`, `ko-KP`, `th-TH`, `hi-IN`, `hi-NP`, `ru-RU` | Native digits where applicable |
| Spanish, Portuguese, French, German | regional variants | Latin script, two-form plurals |

## Tech Stack

- **Build:** Rsbuild v2, Rspack, html-minifier-terser
- **Templates:** Nunjucks (autoescape off), `simple-nunjucks-loader`
- **Reactive UI:** Alpine.js + `@alpinejs/collapse`, `@alpinejs/focus`
- **Styling:** Tailwind CSS v4 (logical properties for RTL)
- **i18n:** i18next + `i18next-browser-languagedetector`
- **Types:** TypeScript
- **Runtime:** Bun

## Browser Support

`last 2 versions, not dead` · `Edge >= 79` · `Firefox >= 68` · `Chrome >= 80` · `Safari >= 13.1` · `iOS >= 13.4`

## License

MIT
