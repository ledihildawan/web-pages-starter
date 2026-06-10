# Web Pages Starter

A multi-page starter for content sites built with **Rsbuild + Nunjucks + Alpine.js + Tailwind CSS + i18next**. Ships 87 locales out of the box with SSG rendering, runtime language switching, locale-aware formatting, RTL support, and regional pricing.

## Quick Start

```bash
bun install
bun run dev          # http://localhost:8888
bun run build        # production build to ./dist
bun run preview      # serve the production build
```

Requires [Bun](https://bun.sh) `>= 1.0`.

## Project Structure

```
src/
├── configs/               # app configuration
│   ├── i18n.ts            #   defaultLocale + fonts
│   ├── site.ts            #   ROOT_PAGE
│   └── paths.ts           #   filesystem path constants
├── data/                  # global site data
│   ├── global.json5       #   site_name, seo, social, dns, preconnect
│   └── menu.json5         #   navigation structure (header links + dropdowns)
├── pages/                 # routes — one folder per page
│   └── {page}/
│       ├── index.njk      #   Nunjucks template (required)
│       ├── index.json5    #   page data — colors, icons, layout (optional)
│       ├── index.ts       #   page entry (required, even if empty)
│       ├── index.css      #   page styles (optional)
│       └── components/    #   page-local partials (optional)
├── components/            # 10 shared Nunjucks partials + macros
├── layouts/               # base templates (main.njk) + macros (page-meta.njk)
├── locales/               # translation source of truth (87 locales)
│   └── {locale}/
│       ├── common.json5   #   shared copy (nav, footer, labels, plurals)
│       ├── {page}.json5   #   page-specific copy
│       └── components/{name}.json5
├── scripts/
│   ├── lib/i18n/          #   i18n engine (20 files)
│   ├── lib/utils/         #   shared utilities (microtask queue)
│   ├── utils/             #   build-time utilities (json5, common helpers)
│   ├── main.ts            #   app bootstrap
│   └── components/        #   client-side components
├── styles/
│   └── main.css           #   Tailwind v4 entry + design tokens + component classes
├── assets/                #   images, fonts, raw assets
└── types/                 #   shared TS types

tools/                     #   build-time scripts
generated/                 #   auto-generated (i18n.d.ts, exchange-rates.ts)
docs/                      #   documentation
```

## Pages & Routing

File-system based, zero-config routing. Drop a folder under `src/pages/` and it becomes a route.

### Pages

| Page | Route | Description |
| --- | --- | --- |
| `home` | `/` (root) | Hero, features grid, stats counter, CTA |
| `about` | `/about` | Company story, values, team, mission/vision |
| `features` | `/features` | Feature showcase with alternating layouts, checklists |
| `pricing` | `/pricing` | 3-tier pricing with monthly/yearly toggle, FAQ accordion |
| `contact` | `/contact` | Contact form with validation, info cards, social links |
| `404` | (fallback) | Custom not-found page |
| `i18n-test` | `/i18n-test` | Developer demo of all i18n capabilities |
| `carousel-demo` | `/carousel-demo` | Splide.js carousel demo |

### Scaffold a new page

```bash
bun run gen:page pricing
```

Creates the page folder, Nunjucks template, entry files, and 87 locale files. Available at `/pricing` immediately.

### Page data

Each page has an optional `index.json5` for structural/layout data (colors, icons, ordering). Text content comes from locale files. This separates content from presentation.

| Variable | Source | Access |
| --- | --- | --- |
| `global.*` | `src/data/global.json5` + `menu.json5` | site name, SEO, social, navigation |
| `page.*` | `src/pages/{page}/index.json5` | page-specific layout data |
| `i18n.*` | `src/locales/{locale}/*.json5` | translated text (see [i18n](#i18n)) |
| `lang` | `i18nConfig.defaultLocale` | current locale code |

### Template inheritance

All pages extend `src/layouts/main.njk` which provides the `<head>`, navbar, footer, and the inline i18n bootstrap script. Pages override `{% block content %}` for their body.

## Components

Shared Nunjucks partials live in `src/components/`. Two usage patterns:

**Include partials** (self-contained blocks):
```njk
{% include "navbar.njk" %}
{% include "footer.njk" %}
{% include "cta.njk" %}
```

**Import macros** (parameterized, reusable):
```njk
{% import "hero-section.njk" as hero with context %}
{% import "section-header.njk" as section with context %}
{% import "icons.njk" as icon with context %}
{% import "badge.njk" as badge %}
{% import "form-input.njk" as form %}
{% import "info-card.njk" as card %}
{% import "social-link.njk" as social_link %}

{{ hero.hero_section('hero', badge=true, i18n=i18n) }}
{{ icon.icon('lightning', 'w-8 h-8', size='xl') }}
{{ form.form_input('email', 'label_key', 'placeholder_key', 'email', i18n=i18n) }}
```

Pages can also have **local components** in `src/pages/{page}/components/`.

The build auto-detects which components a page uses (via `getUsedComponents()`) and loads only the relevant i18n namespaces at runtime.

## Styling

**Tailwind CSS v4** with CSS-first configuration (no `tailwind.config.*`). PostCSS uses `@tailwindcss/postcss` as the sole plugin.

### Design tokens

CSS custom properties on `:root` in `src/styles/main.css`:

| Token | Purpose |
| --- | --- |
| `--gradient-primary` / `--gradient-hero` / `--gradient-violet` | Gradient presets |
| `--elevation-1` / `--elevation-2` / `--elevation-3` | Shadow depth |
| `--radius-card-*` / `--radius-btn` / `--radius-icon` | Border radii |
| `--font-primary` | Dynamic font (set by i18n writing system) |
| `--dir` | `1` (LTR) / `-1` (RTL) for JS transforms |

### Component classes

Reusable interaction patterns defined in `@layer components`:

- **Animations:** `.entrance-blur`, `.entrance-fade-scale`, `.float-gentle`
- **Press effects:** `.btn-squash`, `.card-squash`, `.anticipate-press`
- **Hover effects:** `.hover-lift`, `.card-hover-lift`, `.icon-bounce`
- **Cards:** `.card-border-glow`, `.spotlight-card`, `.ripple-click`
- **Utilities:** `.text-gradient-primary`, `.no-scroll`, `.gpu-accelerated`

### RTL strategy

Five layers of RTL support:

1. **HTML `dir` attribute** — set by i18n system based on locale's writing system
2. **CSS logical properties** — `padding-inline`, `margin-inline-start`, `border-inline-end`
3. **Tailwind `ltr:` / `rtl:` variants** — for transforms and asymmetric layouts
4. **`--dir` CSS variable** — `1` (LTR) / `-1` (RTL) for JS-driven transforms
5. **`.is-rtl` class** — toggled on `<html>` by the Alpine i18n store

RTL locales: Arabic (`ar-*`), Hebrew, N'Ko, Adlam.

## i18n

The i18n system is the most complex subsystem. Full reference: **[`docs/i18n.md`](docs/i18n.md)**.

87 BCP 47 locales spanning 54 languages. Default locale: `id-ID`.

### Data flow

```
src/locales/{locale}/*.json5
        │
        ├─► Build time (template.ts)
        │     Resolves keys with the default locale,
        │     emits HTML with data-* attributes
        │
        └─► Runtime (runtime.ts)
              i18next.init() → translatePage() + updateFormattedElements()
              User switches language → Alpine store → in-place DOM update
```

The same key (`i18n.t('page.hero.title')`) renders at build time **and** updates in place at runtime — no full reload.

### At a glance

```njk
<h1>{{ i18n.t('page.hero.title') }}</h1>
<span>{{ i18n.formatNumber(1234.56) }}</span>
<span>{{ i18n.formatCurrency(99, 'USD') }}</span>
<time>{{ i18n.formatDate('2026-06-04', { dateStyle: 'long' }) }}</time>
<span>{{ i18n.formatLocalPrice(plan) }}</span>

<button @click="$store.i18n.change('en-US')">English</button>
```

### Locales

| Group | Codes | Notes |
| --- | --- | --- |
| Indonesian | `id-ID` | Default, source of truth |
| English | `en-US`, `en-GB`, `en-CA`, `en-AU`, `en-IN`, `en-NZ`, `en-ZA` | Region-specific currencies |
| Chinese | `zh-Hans-CN`, `zh-Hans-SG`, `zh-Hans-MY`, `zh-Hant-TW`, `zh-Hant-HK`, `zh-Hant-MO` | Script variants |
| Arabic | `ar-SA`, `ar-AE`, `ar-EG`, `ar-MA`, `ar-TN` | RTL, native digits, six-form plurals |
| Japanese, Korean, Thai, Hindi, Russian | `ja-JP`, `ko-KR`, `ko-KP`, `th-TH`, `hi-IN`, `hi-NP`, `ru-RU` | Native digits where applicable |
| Spanish, Portuguese, French, German | regional variants | Latin script, two-form plurals |
| European Latin | `nl-NL`, `ca-ES`, `it-IT`, `no-NO`, `fi-FI`, `sv-SE`, `da-DK`, `cs-CZ`, `hu-HU`, `ro-RO`, `pl-PL`, `el-GR` | Region-specific currencies |

## Client-Side Architecture

**Alpine.js v3** with `@alpinejs/collapse` and `@alpinejs/focus` plugins (lazy-loaded).

### Alpine store: `$store.i18n`

The i18n store provides reactive locale switching. Registered in `src/scripts/lib/i18n/store.ts`.

| Property | Type | Purpose |
| --- | --- | --- |
| `languages` | `{code, label, flag}[]` | Available locales |
| `current` | `string` | Active locale code |
| `change(code)` | method | Full locale switch (persist, translate, fonts) |

### Alpine data components

| Component | Location | Purpose |
| --- | --- | --- |
| `navbar` | `src/components/navbar.njk` (inline script) | Mobile menu, scroll-aware hide/show, language picker dropdown, touch gestures |
| `contactForm` | `src/pages/contact/index.ts` | Form validation with field-level error messages |
| `pricing` | `src/pages/pricing/index.njk` (inline `x-data`) | Monthly/yearly toggle |

### Bootstrap sequence (`src/scripts/main.ts`)

1. Load Alpine + i18n store in parallel
2. Register store, start Alpine
3. Initialize i18next (load locale resources, translate page)
4. Defer font loading via `requestIdleCallback`
5. Register service worker (production only)

## Build Pipeline

### Development

```
sync:root-page → clean:cache → fetch:rates → [watch:i18n || rsbuild dev]
```

- Rsbuild dev server on port 8888 with HMR
- File watching for `.njk`, `.json5`, `.json`, `.css` (polling 100ms)
- i18n type regeneration on locale changes

### Production

```
sync:root-page → clean:cache → fetch:rates → gen:i18n → gen:sitemap → build.ts (Rsbuild + HTML minification)
```

- HTML minification (via `html-minifier-terser`)
- Image compression (AVIF via `@rsbuild/plugin-image-compress`)
- CSS inlined into HTML; small JS inlined (<2KB)
- Per-page code splitting with shared runtime chunk

### Rsbuild highlights

| Feature | Detail |
| --- | --- |
| Entry discovery | Auto-scans `src/pages/*/index.ts` |
| Path aliases | `@/` → `src/`, `@components/`, `@assets/`, `@generated/`, `@configs/` |
| Nunjucks loader | `simple-nunjucks-loader` with search paths: `pages/`, `layouts/`, `components/` |
| Pre-entries | `src/scripts/main.ts` + `src/styles/main.css` loaded before every page |
| Excluded pages | `EXCLUDED_PAGES=carousel-demo,i18n-test` env var |

### Preview server (`tools/preview.ts`)

Hono-based static file server with:
- gzip/deflate compression
- Aggressive caching (1 year for fingerprinted assets, `no-cache` for HTML)
- SPA-like routing (root → home page, unknown → 404)
- HTML files pre-loaded into memory

## Configuration

| File | Purpose |
| --- | --- |
| `src/configs/i18n.ts` | Default locale + font stack |
| `src/configs/site.ts` | `ROOT_PAGE` — which page serves at `/` |
| `src/configs/paths.ts` | Filesystem path constants |
| `src/data/global.json5` | Site name, SEO metadata, social links, DNS/prefetch |
| `src/data/menu.json5` | Navigation structure (header menu with children) |
| `.env.development` | `SITE_URL`, `TUNNEL_URL` (for ngrok/Lighthouse) |
| `.env.production` | `SITE_URL` (production domain) |
| `biome.json` | Linting (Tailwind class sorting) + formatting (2-space indent, single quotes) |
| `tsconfig.json` | Strict mode, ESNext, path aliases |

### Environment variables

| Variable | Purpose |
| --- | --- |
| `SITE_URL` | Base URL for sitemap and global data |
| `TUNNEL_URL` | Overrides `SITE_URL` for tunnel-based testing |
| `BUILD_PREVIEW` | Use `.env.development` in build (for Lighthouse) |
| `EXCLUDED_PAGES` | Comma-separated page names to skip in build |
| `MINIFY` / `MINIFY_HTML` | Disable minification (`"false"`) |
| `PORT` | Preview server port (default 8888) |

## PWA

- `public/manifest.json` — web app manifest
- `public/sw.js` — cache-first service worker with network fallback
- Registered automatically in production builds
- Offline fallback to `/404.html` for navigation requests

## Testing

[Rstest](https://rstest.dev) + `happy-dom` + Testing Library.

```bash
bun test
```

Tests live in `tests/`. The setup extends `expect` with `@testing-library/jest-dom` matchers.

## Commands

| Command | What it does |
| --- | --- |
| `bun run dev` | Sync root page, fetch rates, watch JSON5, start Rsbuild dev server |
| `bun run build` | Sync root page, fetch rates, regenerate i18n types, generate sitemap, production build |
| `bun run build:preview` | Same as `build` with `BUILD_PREVIEW=true`, then runs preview server |
| `bun run preview` | Serve the production build |
| `bun run gen:page <name>` | Scaffold a new page and 87 translation files |
| `bun run gen:i18n` | Regenerate `generated/i18n.d.ts` |
| `bun run watch:i18n` | Watch JSON5 files and rerun `gen:i18n` |
| `bun run fetch:rates` | Update exchange rates (24h cache) |
| `bun run sync:root-page` | Sync root page folder name with `ROOT_PAGE` config |
| `bun run clean:cache` | Remove `node_modules/.cache`, `.cache`, `dist` |
| `bun run clean` | Remove `bun.lock`, `node_modules` (runs `clean:cache` first) |

All tools live in `tools/`. Available via `bun ./tools/<name>.ts` or `bun run cli` (interactive menu).

| Tool | Purpose |
| --- | --- |
| `build.ts` | Production build wrapper (Rsbuild + HTML minification) |
| `preview.ts` | Hono-based static preview server |
| `generate-page.ts` | Scaffold a new page with 87 locale files |
| `generate-i18n.ts` | Regenerate `generated/i18n.d.ts` type definitions |
| `watch-i18n.ts` | Watch JSON5 files, auto-rerun `generate-i18n` |
| `generate-sitemap.ts` | Generate `public/sitemap.xml` |
| `fetch-exchange-rates.ts` | Fetch exchange rates with 24h cache |
| `sync-locales.ts` | Create missing locale folders from default |
| `sync-root-page.ts` | Sync root page folder name with `ROOT_PAGE` config |
| `check-locale-parity.ts` | Diff translation keys across all locales |
| `lighthouse.ts` | Run Lighthouse performance audits |
| `cli.ts` | Interactive menu for all tools |

## Tech Stack

- **Build:** Rsbuild v2, Rspack, html-minifier-terser
- **Templates:** Nunjucks (autoescape off), `simple-nunjucks-loader`
- **Reactive UI:** Alpine.js v3 + `@alpinejs/collapse`, `@alpinejs/focus`
- **Styling:** Tailwind CSS v4 (CSS-first, logical properties for RTL)
- **i18n:** i18next + `i18next-browser-languagedetector`
- **Carousel:** Splide.js
- **Testing:** Rstest, happy-dom, Testing Library
- **Linting:** Biome (Tailwind class sorting)
- **Types:** TypeScript (strict)
- **Runtime:** Bun

## Browser Support

`>= 0.5%, last 2 versions, not dead, not ie 11`

## License

MIT
