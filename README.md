# Web Pages Starter

A multi-page starter for content sites built with **Rsbuild + Nunjucks + Alpine.js + Tailwind CSS v4 + i18next**. Ships 87 locales out of the box with SSG rendering, runtime language switching, locale-aware formatting, RTL support, and regional pricing.

## Quick Start

```bash
bun install
bun run dev          # http://localhost:8888
bun run build        # production build to ./dist
bun run preview      # build + tunnel for external testing
```

Requires [Bun](https://bun.sh) `>= 1.3.14`.

## Project Structure

```
src/
├── configs/               # app configuration
│   ├── env.ts             #   environment variable loading
│   ├── i18n.ts            #   defaultLocale + fonts
│   ├── paths.ts           #   filesystem path constants
│   └── pages.ts            #   ROOT_PAGE, SYSTEM_PAGE_IDS, SYSTEM_PAGE_SLUGS, slug helpers
├── data/                  # global site data
│   ├── global.json5       #   site_name, seo, social, dns, preconnect
│   └── menu.json5         #   navigation structure (header links + dropdowns)
├── pages/                 # routes — one folder per page
│   └── {page}/
│       ├── index.njk      #   Nunjucks template (required)
│       ├── index.json5    #   page data — colors, icons, layout (optional)
│       ├── index.ts       #   page entry (auto-imported by Rsbuild)
│       ├── index.css      #   page styles (optional)
│       └── components/    #   page-local partials (optional)
├── components/            # 11 shared Nunjucks partials (includes error-page.njk, offline-page.njk)
├── layouts/               # base template (main.njk) + macros/ (page-meta.njk)
├── locales/               # translation source of truth (87 locales)
│   └── {locale}/
│       ├── common.json    #   shared copy (nav, footer, labels, plurals)
│       ├── {page}.json    #   page-specific copy
│       └── components.{name}.json  #   component copy (flat, dot-notation namespace)
├── scripts/
│   ├── lib/i18n/          #   i18n engine (19 files)
│   ├── lib/utils/         #   shared utilities (microtask queue)
│   ├── utils/             #   build-time utilities (json5, common, types)
│   └── main.ts            #   app bootstrap
├── styles/
│   └── main.css           #   Tailwind v4 entry + design tokens + component classes
├── assets/                #   images, fonts, raw assets
└── *.d.ts                 #   TS type declarations (env, global, globals, linkedom)

tools/                     #   build-time CLI scripts
  └── shared/              #   shared modules (logger, signal-handler, hono-server, site-url, write-file, romanize)
public/                    #   static assets (favicon, generated sw.js/manifest/robots/sitemap)
  └── assets/i18n/         #   pre-compiled i18n JSON bundles (generated)
generated/                 #   auto-generated types + exchange rates (gitignored at file level; stubs committed for fresh-clone typecheck; overwritten at build time)
docs/                      #   documentation
```

## Pages & Routing

File-system based, zero-config routing. Drop a folder under `src/pages/` and it becomes a route. The root page (`home` by default) is output as `index.html` via the `pluginRootPageAsIndex` Rsbuild plugin.

`ROOT_PAGE` lives in `src/configs/pages.ts`. System pages (root + 6 error pages) have locale-dependent folder names driven by `SYSTEM_PAGE_SLUGS` — `page_id` (from `index.json5`) is the stable identifier, decoupled from the folder name. When the default locale changes, `sync-system-pages` renames ALL system page folders to the new locale's slugs. Locale files stay keyed by `page_id` (`home.json`, `not-found.json`, etc.) and are never renamed.

### Pages

| Page | Route | Description |
| --- | --- | --- |
| `home` | `/` (root) | Hero, features grid, stats counter, CTA |
| `about` | `/about` | Company story, values, team, mission/vision |
| `features` | `/features` | Feature showcase with alternating layouts, checklists |
| `pricing` | `/pricing` | 3-tier pricing with monthly/yearly toggle, FAQ accordion |
| `contact` | `/contact` | Contact form with validation, info cards, social links |
| `not-found` | `/not-found` | 404 — page not found (violet) |
| `unauthorized` | `/unauthorized` | 401 — authentication required (yellow) |
| `forbidden` | `/forbidden` | 403 — access denied (amber) |
| `server-error` | `/server-error` | 500 — internal server error (red) |
| `maintenance` | `/maintenance` | 503 — service unavailable (blue) |
| `offline` | `/offline` | PWA offline — no network connection (slate) |
| `i18n-test` | `/i18n-test` | Developer demo of all i18n capabilities |
| `carousel-demo` | `/carousel-demo` | Splide.js carousel demo |

### Scaffold a new page

```bash
bun ./tools/generate-page.ts pricing
```

Creates the page folder, Nunjucks template, entry files, and 87 locale files. Available at `/pricing` immediately.

### Page data

Each page has an optional `index.json5` for structural/layout data (colors, icons, ordering). Text content comes from locale files. This separates content from presentation.

| Variable | Source | Access |
| --- | --- | --- |
| `global.*` | `src/data/global.json5` + `menu.json5` | site name, SEO, social, navigation |
| `page.*` | `src/pages/{page}/index.json5` | page-specific layout data |
| `i18n.*` | `src/locales/{locale}/*.json` | translated text (see [i18n](#i18n)) |
| `lang` | `i18nConfig.defaultLocale` | current locale code |
| `base_path` | `process.env.BASE_PATH` | subpath prefix for asset URLs (default `/`) |
| `localeConfig` | `LOCALES` lookup | current locale's `dir`, `writingSystem`, etc. |
| `clientI18nScript` | `template.ts` | inline `<script>` for i18n bootstrap |
| `page_id` | `params.entryName` | stable page identifier (decoupled from folder name; folder uses locale-dependent slug) |

### Template inheritance

All pages extend `src/layouts/main.njk` which provides the `<head>`, navbar, footer, and the inline i18n bootstrap script. Pages override `{% block content %}` for their body.

### URL helper

The `url()` helper generates `BASE_PATH`-aware internal links at build time:

```njk
<a href="{{ url('/about') }}">About</a>
<!-- With BASE_PATH=/web-pages-starter → href="/web-pages-starter/about" -->
```

Use `url()` for all internal links instead of hardcoded paths.

### Template conventions

- `url()` for all internal links, `isActive()` for navbar active state (runtime `basePath`)
- Macros receive resolved text, not keys (except `form-input.njk` which takes keys and receives `i18n`)
- String concatenation: `~` everywhere in Nunjucks (never `+`)
- `currentYear` from `new Date().getFullYear()` in template params
- No `i18n.text()` — use `i18n.t(key, vars, { raw: true })` for plain strings

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
{% import "hero-section.njk" as hero %}
{% import "section-header.njk" as section %}
{% import "icons.njk" as icon %}
{% import "form-input.njk" as form %}
{% import "info-card.njk" as card %}
{% import "social-link.njk" as social_link %}

{{ hero.hero_section(badge=i18n.t('home:hero.badge'), title_part1=i18n.t('home:hero.title_part1'), title_highlight=i18n.t('home:hero.title_highlight'), description=i18n.t('home:hero.description')) }}
{{ icon.icon('lightning', 'w-8 h-8', size='xl') }}
{{ form.form_input('text', 'contact:contact.form.name', 'contact:contact.form.name_placeholder', 'name', i18n=i18n) }}
```

Pages can also have **local components** in `src/pages/{page}/components/`.

The build auto-detects which components a page uses (via `getUsedComponents()`) and loads only the relevant i18n namespaces at runtime.

## Styling

**Tailwind CSS v4** with CSS-first configuration (no `tailwind.config.*`). PostCSS uses `@tailwindcss/postcss` as the sole plugin.

### Design tokens

CSS custom properties on `:root` in `src/styles/main.css`:

| Token | Purpose |
| --- | --- |
| `--gradient-primary` / `--gradient-primary-subtle` / `--gradient-hero` / `--gradient-violet` | Gradient presets |
| `--elevation-1` / `--elevation-2` / `--elevation-3` | Shadow depth |
| `--shadow-border` / `--shadow-border-hover` | Shadow-as-border for cards (replaces `border` for depth) |
| `--radius-card-*` / `--radius-btn` / `--radius-icon` | Border radii |
| `--font-primary` | Dynamic font (set by i18n writing system) |
| `--dir` | `1` (LTR) / `-1` (RTL) for JS transforms |

### Component classes

Reusable interaction patterns defined in `@layer components`:

- **Animations:** `.entrance-blur`, `.entrance-fade-scale`, `.float-gentle`
- **Press effects:** `.btn-squash`, `.card-squash`, `.icon-squash`, `.anticipate-press`, `.btn-press`, `.input-active`
- **Hover effects:** `.hover-lift`, `.card-hover-lift`
- **Cards:** `.card-border-glow`, `.spotlight-card`, `.ripple-click`, `.sparkle-hover`
- **Toggles:** `.toggle-btn`, `.toggle-knob`
- **Decorative:** `.grid-pattern`, `.noise-texture`
- **Borders:** `.card-border`, `.card-border-hover`
- **Color shift:** `.color-shift`

### RTL strategy

Five layers of RTL support:

1. **HTML `dir` attribute** — set by i18n system based on locale's writing system
2. **CSS logical properties** — `padding-inline`, `margin-inline-start`, `border-inline-end`
3. **Tailwind `ltr:` / `rtl:` variants** — for transforms and asymmetric layouts
4. **`--dir` CSS variable** — `1` (LTR) / `-1` (RTL) for JS-driven transforms
5. **`.is-rtl` class** — toggled on `<html>` by the Alpine i18n store

RTL locales: Arabic (`ar-*`), Hebrew, N'Ko, Adlam.

## UI Polish

Ten principles enforced across all pages:

1. **Transition specificity** — Never use bare `transition` (maps to `all`). Specify exact properties: `transition-[color,background-color]`, `transition-[scale,box-shadow]`.
2. **Scale on press** — Always `scale(0.96)` for press feedback. Never below 0.95.
3. **Optical alignment** — Icon+text buttons get ~2px less padding on the icon side for visual balance.
4. **Shadows over borders** — Cards use `.card-border` / `.card-border-hover` (backed by `--shadow-border` / `--shadow-border-hover`) instead of `border` for depth. Form inputs keep borders for accessibility.
5. **Entrance animations** — Combine `blur(4px)` + `translateY(12px)`. Never `blur(8px)` + `scale`.
6. **Tabular numbers** — Only on dynamically changing numbers (e.g. pricing toggle). Not on static decorative stats.
7. **Font smoothing** — `-webkit-font-smoothing: antialiased` at root.
8. **Text wrapping** — `text-wrap: balance` on headings, `text-wrap: pretty` on body text.
9. **Image outlines** — `rgba(0,0,0,0.1)` light / `rgba(255,255,255,0.1)` dark. Never tinted.
10. **Concentric border radius** — Outer radius = inner radius + padding.

## i18n

The i18n system is the most complex subsystem. Full reference: **[`docs/i18n.md`](docs/i18n.md)**.

87 BCP 47 locales spanning 54 languages. Default locale: `en-US`.

### Data flow

```
src/locales/{locale}/*.json
        │
        ├─► Build time (template.ts)
        │     Resolves keys with the default locale,
        │     emits HTML with data-* attributes
        │
        └─► Runtime (runtime.ts)
              i18next.init() → translatePage() + updateFormattedElements()
              User switches language → Alpine store → in-place DOM update
```

The same key (`i18n.t('home:hero.title')`) renders at build time **and** updates in place at runtime — no full reload.

### At a glance

```njk
<h1>{{ i18n.t('home:hero.title') }}</h1>
<span>{{ i18n.formatNumber(1234.56) }}</span>
<span>{{ i18n.formatCurrency(99, 'USD') }}</span>
<time>{{ i18n.formatDate('2026-06-04', { dateStyle: 'long' }) }}</time>
<span>{{ i18n.formatLocalPrice(plan) }}</span>

<button @click="$store.i18n.change('en-US')">English</button>
```

### Locales

| Group | Codes | Notes |
| --- | --- | --- |
| Indonesian | `id-ID` | |
| English | `en-US`, `en-GB`, `en-CA`, `en-AU`, `en-IN`, `en-NZ`, `en-ZA` | Default, source of truth; region-specific currencies |
| Chinese | `zh-Hans-CN`, `zh-Hans-SG`, `zh-Hans-MY`, `zh-Hant-TW`, `zh-Hant-HK`, `zh-Hant-MO` | Script variants |
| Arabic | `ar-SA`, `ar-AE`, `ar-EG`, `ar-MA`, `ar-TN` | RTL, native digits, six-form plurals |
| Japanese, Korean, Thai, Hindi, Russian | `ja-JP`, `ko-KR`, `ko-KP`, `th-TH`, `hi-IN`, `hi-NP`, `ru-RU` | Native digits where applicable |
| Spanish, Portuguese, French, German | `es-ES`, `es-MX`, `es-AR`, `es-CO`, `es-PE`, `pt-BR`, `pt-PT`, `pt-AO`, `pt-MZ`, `fr-FR`, `fr-CA`, `fr-BE`, `fr-CH`, `de-DE`, `de-AT`, `de-CH` | Latin script |
| European Latin | `nl-NL`, `ca-ES`, `it-IT`, `no-NO`, `fi-FI`, `sv-SE`, `da-DK`, `cs-CZ`, `hu-HU`, `ro-RO`, `pl-PL`, `el-GR` | Region-specific currencies |
| Turkic | `tr-TR`, `az-AZ`, `uz-UZ` | |
| Central Asian Cyrillic | `kk-KZ`, `ky-KG`, `tg-TJ`, `mn-MN`, `uz-AF` | |
| South Asian Indic | `bn-BD`, `bn-IN`, `gu-IN`, `mr-IN`, `pa-IN`, `pa-PK`, `ta-IN`, `ta-LK`, `te-IN`, `kn-IN`, `ml-IN` | Native digits |
| Southeast Asian | `vi-VN` | |
| Middle Eastern / Caucasus | `he-IL`, `fa-IR`, `hy-AM`, `ka-GE` | RTL (he, fa) |
| Slavic / Baltic / Balkan | `uk-UA`, `sr-RS`, `hr-HR`, `sl-SI`, `sk-SK`, `bg-BG` | |
| Baltic | `lt-LT`, `lv-LV`, `ee-EE` | |

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
4. Preload active font
5. Defer font loading via `requestIdleCallback`
6. Register service worker (production only)

## Build Pipeline

### Development

```
sync-system-pages → clean:cache → fetch:rates → generate-i18n → [watch:i18n || rsbuild dev]
```

- Rsbuild dev server on port 8888 with HMR
- File watching for `.njk`, `.json`, `.json5` (page reload on change)
- Dev cache: `generateClientI18nScript` hashes all 87 locale files by mtime — skips ~3,400 file I/O ops on repeat page loads; cache invalidates when any locale file changes
- i18n type regeneration on locale changes via `watch-i18n`

### Production

```
sync-system-pages → clean:cache → fetch:rates → generate-i18n → generate-sitemap → generate-manifest → generate-robots → generate-sw → build
```

1. **sync-system-pages** — renames ALL system page folders to match locale-dependent slugs from `SYSTEM_PAGE_SLUGS` when the default locale changes
2. **clean-cache** — purges `node_modules/.cache`, `.cache`, `dist`
3. **fetch-exchange-rates** — pulls live rates from Frankfurter API (24h cache)
4. **generate-i18n** — generates `generated/i18n.d.ts` type definitions (overwrites stub), checks locale parity (errors fail the build), syncs `i18n-ally.sourceLanguage`/`displayLanguage` from `i18nConfig.defaultLocale`
5. **generate-sitemap** — generates `public/sitemap.xml` from pages and `SITE_URL`
6. **generate-manifest** — generates `public/manifest.json` from `global.json5` + `i18nConfig`, uses `BASE_PATH` for `start_url` and `scope`
7. **generate-robots** — generates `public/robots.txt` from `SITE_URL`
8. **generate-sw** — generates `public/sw.js` dynamically with locale-specific error page URLs from `SYSTEM_PAGE_SLUGS` (cache version v5)
9. **build** — Rsbuild production bundle with:
   - JS + CSS minification
   - HTML minification (`html-minifier-terser`)
   - `home.html` → `index.html` rename (`pluginRootPageAsIndex`)
   - Image compression (AVIF, quality 75)
   - CSS inlined into HTML; small JS inlined (<2048 bytes)
   - Per-page code splitting with shared runtime chunk
   - Content-hashed filenames for JS/CSS/images

### Rsbuild configuration highlights

| Feature | Detail |
| --- | --- |
| Entry discovery | Auto-scans `src/pages/*/index.ts` |
| Root page as index | `pluginRootPageAsIndex` renames `home.html` → `index.html` post-build; dev server uses `historyApiFallback` rewrite to `/home.html` instead |
| `BASE_PATH` support | `source.define` injects `import.meta.env.BASE_PATH` for runtime JS; template param `base_path` for Nunjucks |
| Output paths | `dist/assets/{scripts,styles,images,fonts}` — organized by asset type |
| Static copy | `output.copy` moves `public/` static files (favicon, sw.js, manifest, robots, i18n bundles) to `dist/` |
| Path aliases | `@/` → `src/`, `@components/`, `@assets/`, `@generated/`, `@configs/`, `@data/` — `@generated/` resolves at bundle time; source files use relative paths (`../../../../generated/*`) for jiti compatibility |
| Nunjucks loader | `simple-nunjucks-loader` with search paths: `pages/`, `layouts/`, `components/`, `src/` root; `assetsPaths: src/assets/` |
| Pre-entries | `src/scripts/main.ts` + `src/styles/main.css` loaded before every page |
| Excluded pages | Hardcoded `EXCLUDED_PAGES` set in config (currently empty — all pages built) |

### Preview (`bun run preview`)

Full preview flow — auto-starts tunnel, builds, and serves. Interactive mode prompts for tunnel provider. Use `--tunnel` flag for scripted use:

```bash
bun run preview                                    # Interactive: select ngrok or cloudflared
bun ./tools/preview.ts --tunnel ngrok              # Use ngrok (requires NGROK_AUTHTOKEN)
bun ./tools/preview.ts --tunnel cloudflared        # Use cloudflared
```

**Tunnel providers:**

| Provider | Requirement | Flow |
| --- | --- | --- |
| `ngrok` | `NGROK_AUTHTOKEN` env var | Tunnel → Build → Serve |
| `cloudflared` | `cloudflared` installed | Build → Serve → Tunnel → Replace URLs |

**Flow:**

1. **ngrok**: Starts tunnel first (URL known immediately), builds with correct public URL, serves
2. **cloudflared**: Builds first (uses `HOST:PORT`, default `127.0.0.1:8888`), serves, starts tunnel, **replaces placeholder URLs** in dist/ with tunnel URL

Ideal for Lighthouse audits, mobile testing, or sharing WIP via a public URL.

## Configuration

| File | Purpose |
| --- | --- |
| `src/configs/i18n.ts` | Default locale + font stack |
| `src/configs/pages.ts` | `ROOT_PAGE`, `SYSTEM_PAGE_IDS` (7 system pages), `SYSTEM_PAGE_SLUGS` (locale-dependent URL slugs), slug helpers (`getSystemPageSlug`, `getRootPageSlug`, `getErrorPageSlugs`, `isSystemPageId`, `isSystemPageSlug`) |
| `src/configs/paths.ts` | Filesystem path constants |
| `src/data/global.json5` | Site name, SEO metadata, social links, DNS/prefetch |
| `src/data/menu.json5` | Navigation structure (header menu with children) |
| `.env.development` | `NODE_ENV`, `SITE_URL`, `PORT`, `HOST` |
| `.env.production` | `NODE_ENV`, `SITE_URL` (production domain) |
| `biome.json` | Linting (Tailwind class sorting, organize imports) + formatting (2-space indent, single quotes). Overrides: `main.css` disables `noDescendingSpecificity`/`noImportantStyles`; `common.ts` disables `noExplicitAny` |
| `.vscode/settings.json` | Editor config: Biome formatter, Tailwind IntelliSense, i18n-ally, Peacock color |
| `.vscode/extensions.json` | Workspace extension recommendations (12 extensions) |

### VS Code extensions

Recommended extensions are listed in `.vscode/extensions.json`. Key extensions:

- **Biome** (`biomejs.biome`) — linting and formatting
- **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`) — class autocomplete
- **i18n-ally** (`lokalise.i18n-ally`) — inline translation annotations

> **Note:** i18n-ally's status bar UI (language picker) does not work with this project's custom i18n runtime. After installing, right-click the status bar and hide "i18n Ally" to reduce clutter. The inline annotations (`data-i18n` key display) and review features still work correctly.
| `tsconfig.json` | Strict mode, ESNext, path aliases |

### Environment variables

| Variable | Purpose |
| --- | --- |
| `SITE_URL` | Base URL for sitemap and meta tags |
| `BASE_PATH` | Subpath for GitHub Pages deployment (e.g. `/web-pages-starter/`). Defaults to `/` |
| `PORT` | Server port (default 8888) |
| `HOST` | Server bind address (serve: `0.0.0.0`, preview: `127.0.0.1`) |
| `BUILD_PREVIEW` | Set automatically by preview tool |
| `MINIFY` / `MINIFY_HTML` | Disable minification (`"false"`) |
| `NODE_BINARY` / `RSBUILD_RUNTIME` | Runtime override for build process |
| `NGROK_AUTHTOKEN` | Auth token for ngrok tunnel (preview tool) |

## PWA

- `public/manifest.json` — web app manifest (generated by `tools/generate-manifest.ts` from `global.json5` + `i18nConfig`)
- `public/sw.js` — **generated** by `tools/generate-sw.ts` (not static). Cache-first service worker with network fallback (derives `BASE_PATH` from `self.location`, precaches `index.html`, 6 error pages with locale-dependent URLs from `SYSTEM_PAGE_SLUGS`, and `manifest.json`; offline fallback to `offline.html`). Cache version: v5
- Registered automatically in production builds via `import.meta.env.BASE_PATH`

### Error pages

Six error pages using shared Nunjucks partials (`error-page.njk` and `offline-page.njk`). Each has its own i18n namespace and locale files across all 87 locales. Error page URLs are locale-dependent — the URL slug for each error page is defined per-locale in `SYSTEM_PAGE_SLUGS` (`src/configs/pages.ts`).

| Page | URL | Status | Icon | Gradient | Pattern |
| --- | --- | --- | --- | --- | --- |
| `not-found` | `/not-found` | 404 | search | violet/fuchsia | `{% set %}` + `{% include "error-page.njk" %}` |
| `unauthorized` | `/unauthorized` | 401 | key | yellow/amber | Same |
| `forbidden` | `/forbidden` | 403 | shield | amber/orange | Same |
| `server-error` | `/server-error` | 500 | lightning | rose/red | Same |
| `maintenance` | `/maintenance` | 503 | clock | sky/blue | Same |
| `offline` | `/offline` | — | cloud | slate/zinc | `{% include "offline-page.njk" %}` (reload button) |

Error pages are excluded from sitemap (`generate-sitemap`), disallowed in `robots.txt`, and have `noindex, nofollow` via `page-meta.njk`. The service worker precaches all six and serves `offline.html` when the network is unavailable. Dev server `historyApiFallback` redirects unknown routes to `/not-found.html`.

## Pre-commit Hooks

[Husky](https://typicode.github.io/husky/) + [lint-staged](https://github.com/lintstage/lint-staged) run on every commit:

1. **lint-staged** — runs `biome check --no-errors-on-unmatched --write` on staged files
2. **typecheck** — runs `bunx tsc --noEmit`
3. **test** — runs `bun run test` via rstest

All three must pass for the commit to succeed.

Config: `.husky/pre-commit`, `.lintstagedrc`.

## Code Conventions

- No comments unless explicitly requested
- No deprecated or backward-compat code — remove entirely
- Import paths: relative `../../../../generated/*` in source (jiti compatibility); `@generated/*` in `tsconfig.json` paths and `rsbuild.resolve.alias` for bundling
- Biome for lint + format (not Prettier) — config in `biome.json`
- Pre-commit chain: Husky + lint-staged (Biome) + typecheck + test (`&&`)

## CI/CD

GitHub Actions workflows in `.github/workflows/`:

### CI (`ci.yml`)

Runs on every push and PR to `main`:

1. **checkout** — `actions/checkout@v4`
2. **setup bun** — `oven-sh/setup-bun@v2` (version 1.3.14)
3. **install** — `bun install --frozen-lockfile`
4. **biome ci** — lint + format check (no writes)
5. **typecheck** — `bun run typecheck`
6. **test** — `bun run test` (rstest)
7. **build** — `bun run build` with `NODE_ENV=production`, `BASE_PATH=/web-pages-starter/`, `SITE_URL=https://ledihildawan.github.io/web-pages-starter`
8. **upload artifact** — uploads `dist/` for the deploy workflow

### Deploy (`deploy.yml`)

Runs after CI succeeds on `main`:

1. Downloads the build artifact
2. Deploys to GitHub Pages

**Setup:** repo Settings > Pages > Source must be set to **GitHub Actions** (not "Deploy from a branch").

## Testing

[Rstest](https://rstest.dev) + `happy-dom` + Testing Library.

### Commands

```bash
bun run test                                          # run all tests
bun run test -- --watch                               # watch mode
bun run test -- --coverage                            # with coverage report (terminal + html + lcov)
bun run test -- --coverage --coverage.include "src/scripts/lib/i18n/**"  # coverage for specific paths
```

### Structure

```
tests/
├── rstest.setup.ts          # extends expect with jest-dom matchers
├── tsconfig.json            # test-specific TS config
├── dom.test.ts              # DOM rendering sanity check
└── i18n/
    ├── helpers.test.ts      # locale lookup, fallback, direction, currency
    ├── formatters.test.ts   # formatNumber, formatCurrency, formatDate, formatBytes, cardinal, ordinal
    └── home-data.test.ts    # home page structure + locale key parity (en-US ↔ id-ID)
```

### Coverage

Coverage output goes to `coverage/` (gitignored). Open `coverage/index.html` in a browser for the full HTML report.

| File | Stmts | Notes |
| --- | --- | --- |
| `helpers.ts` | ~85% | Locale lookup, fallback chain, direction, currency |
| `formatters.ts` | ~38% | Core formatters covered; Arabic/Chinese cardinals, scientific, abbreviated need more tests |
| Data files | 100% | All locale data fully imported |
| `runtime.ts`, `template.ts`, `store.ts` | 0% | Browser-only; not testable without DOM integration |

### CLI

Run tests interactively via `bun run cli` → **Test** menu:

- **Run tests** — standard test run
- **Run with coverage** — full coverage report (text + html + lcov)
- **Watch mode** — rerun on file changes

## Commands

| Command | What it does |
| --- | --- |
| `bun run dev` | Sync system pages, clean cache, fetch rates, generate i18n types, watch locales, start Rsbuild dev server |
| `bun run build` | Sync system pages, clean cache, fetch rates, generate i18n types, generate sitemap, manifest, robots, service worker, production build |
| `bun run preview` | Tunnel orchestrator — build and serve via ngrok or cloudflared |
| `bun run serve` | Serve the production build locally |
| `bun run clean:cache` | Remove `node_modules/.cache`, `.cache`, `dist` |
| `bun run typecheck` | Run `tsc --noEmit` type checking |
| `bun run test` | Run tests via `rstest`; supports `--coverage`, `--watch` flags |
| `bun run cli` | Interactive menu for all tools (includes Test with coverage option) |

Direct tool access:

| Command | What it does |
| --- | --- |
| `bun ./tools/generate-page.ts <name>` | Scaffold a new page with 87 locale files |
| `bun ./tools/generate-sitemap.ts` | Generate `public/sitemap.xml` from page directories |
| `bun ./tools/generate-manifest.ts` | Generate `public/manifest.json` from `global.json5` + `i18nConfig` |
| `bun ./tools/generate-robots.ts` | Generate `public/robots.txt` from `SITE_URL` |
| `bun ./tools/generate-sw.ts` | Generate `public/sw.js` with locale-specific error page URLs |
| `bun ./tools/sync-system-pages.ts` | Rename system page folders to match locale-dependent slugs |
| `bun ./tools/sync-locales.ts` | Create missing locale folders from default |
| `bun ./tools/check-locale-parity.ts` | Diff translation keys across all locales |
| `bun ./tools/fetch-exchange-rates.ts` | Fetch exchange rates with 24h cache |
| `bun ./tools/fetch-exchange-rates.ts -- --force` | Force-refresh exchange rates |
| `bun ./tools/generate-i18n.ts` | Generate i18n types, check parity (build error on mismatch), sync i18n-ally config |
| `bun ./tools/lighthouse.ts` | Run Lighthouse audits with interactive configuration |

## Tools

All tools live in `tools/`. They share five modules from `tools/shared/`:

| Module | Purpose |
| --- | --- |
| `shared/logger.ts` | Centralized `log.*()` and `logBox()` for formatted box output |
| `shared/signal-handler.ts` | SIGINT handling, `wrapMainError()`, `handleExitPromptError()`, `createServer()` with EADDRINUSE protection |
| `shared/hono-server.ts` | `createStaticApp()`, `loadHtmlCache()`, `getPageNames()` — shared Hono static server with cache headers |
| `shared/site-url.ts` | `SITE_URL` constant from `process.env` |
| `shared/write-file.ts` | `writeFilePath()` (mkdir + write) and `generatedHeader()` for auto-generated file headers |
| `shared/romanize.ts` | `romanize()` — limax-based romanization for URL-safe slug generation from non-Latin page names |

| Tool | Shared imports | Purpose |
| --- | --- | --- |
| `cli.ts` | log, setupSigintHandler, wrapMainError | Interactive menu for all tools |
| `build.ts` | log, logBox | Production build wrapper (Rsbuild + minification) |
| `preview.ts` | log, createServer, setupSigintHandler, wrapMainError, createStaticApp | Build + serve through public tunnel |
| `serve.ts` | log, createServer, setupSigintHandler, createStaticApp, loadHtmlCache, getPageNames | Serve production build locally |
| `lighthouse.ts` | log, logBox, setupSigintHandler, wrapMainError, SITE_URL | Lighthouse audit runner |
| `generate-page.ts` | log | Scaffold new page with locale files |
| `generate-i18n.ts` | log, logBox, writeFilePath, generatedHeader | Generate i18n types, parity check (build error), sync i18n-ally config |
| `generate-sitemap.ts` | log, logBox, SITE_URL, writeFilePath | Generate sitemap.xml |
| `generate-manifest.ts` | logBox, writeFilePath | Generate manifest.json from global.json5 + i18nConfig |
| `generate-robots.ts` | logBox, SITE_URL, writeFilePath | Generate robots.txt from SITE_URL |
| `generate-sw.ts` | logBox, writeFilePath | Generate `public/sw.js` with locale-specific error page URLs |
| `sync-system-pages.ts` | log, logBox, wrapMainError | Rename ALL system page folders to locale-dependent slugs when default locale changes |
| `sync-locales.ts` | log, logBox | Create missing locale directories |
| `check-locale-parity.ts` | log | Diff translation keys across locales |
| `fetch-exchange-rates.ts` | log, writeFilePath, generatedHeader | Fetch and cache exchange rates |
| `watch-i18n.ts` | log, logBox, setupSigintHandler | Watch locale file changes |
| `clean-cache.ts` | log | Remove cache directories |

## Tech Stack

| Layer | Technology | Version |
| --- | --- | --- |
| Runtime | Bun | `^1.3.14` |
| Bundler | Rsbuild | `^2.0.12` |
| Language | TypeScript | `^6.0.3` |
| Templates | Nunjucks | `^3.2.4` |
| Reactive UI | Alpine.js | `^3.15.12` |
| CSS | Tailwind CSS v4 | `^4.3.0` |
| i18n | i18next | `^26.3.1` |
| Server | Hono | `^4.12.25` |
| Lint/Format | Biome | `^2.4.16` |
| Testing | Rstest | `^0.10.3` |
| HTML minifier | html-minifier-terser | `^7.2.0` |
| Romanization | limax | `^4.2.3` |

## Browser Support

`>= 0.5%, last 2 versions, not dead, not ie 11`

## License

MIT
