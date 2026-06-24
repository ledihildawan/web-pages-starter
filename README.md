# Web Pages Starter

A multi-page starter for content sites built with **Rsbuild + Nunjucks + Alpine.js + Tailwind CSS v4 + i18next**. Includes 136 locales out of the box with SSG rendering, runtime language switching, locale-aware formatting, RTL support, and regional pricing.

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
├── configs/               # app configuration
│   ├── i18n.ts            #   defaultLocale + active locales
│   ├── fonts.ts           #   font stack config (CSS imported via bootstrap.ts)
│   └── rsbuild.ts         #   Rsbuild build configuration (real config; rsbuild.config.ts is a jiti wrapper)
├── features/              # GLOBAL features (truly reusable across pages)
├── shared/                # ALL cross-page code (centralized infrastructure)
│   ├── ui/               #   ALL cross-page UI (primitives, composites, patterns, layouts)
│   │   ├── primitives/  #     icons, form-input (basic building blocks)
│   │   ├── composites/  #     navbar, hero, cta, footer, info-card, etc. (composed from primitives)
│   │   ├── patterns/    #     error-page (reusable UI pattern)
│   │   └── layouts/     #     main.njk (page templates)
│   ├── macros/           #   Nunjucks macros (page-meta for SEO)
│   ├── constants/        #   centralized constants (single source of truth)
│   ├── utils/           # shared utilities (logger, signal-handler, write-file, json5, etc.)
│   └── types/           # ambient type declarations (global.d.ts, modules.d.ts, alpinejs-csp.d.ts)
├── data/                  # global site data
│   ├── global.json5       #   site_name, seo, social, dns, preconnect
│   └── menu.json5         #   navigation structure (header links + dropdowns)
├── pages/                 # routes — one folder per page
│   └── {page}/
│       ├── index.njk      #   Nunjucks template (required)
│       ├── data.json5     #   page data — page_id, SEO, layout (optional)
│       ├── script.ts      #   page-specific JS (optional, auto-injects bootstrap)
│       ├── style.css      #   page styles (optional, auto-loaded if exists)
│       ├── _ui/           #   page-local UI components (underscore = not a page)
│       └── _features/     #   page-local capability modules (carousel, contact-form, etc.)
├── locales/               # translation source of truth (136 locales)
│   └── {locale}/
│       ├── common.json    #   shared copy (nav, footer, labels, plurals)
│       ├── {page}.json    #   page-specific copy
│       └── {shared}.json #   shared locale copy (e.g. cta.json)
├── styles/
│   ├── tokens.css         #   design tokens (CSS custom properties)
│   ├── components.css     #   component classes
│   └── main.css          #   Tailwind v4 entry (imports tokens + components)
├── assets/                # images, fonts, raw assets
├── bootstrap.ts          # app entry — global CSS (main.css), Alpine + collapse/focus plugins, i18n store/initIntl, fonts, SW. Auto-injected via page-inject-loader (scripts/bootstrap.ts)
├── bunfig.toml          # Bun config — preload packages/env/preload.ts for .env.{stage} loading
├── packages/
│   ├── cli/               #   @web-pages-starter/cli — inquirer, js-beautify, sharp, @ngrok/ngrok
│   │   ├── generators/     #     build generators: env, paths, sitemap, manifest, robots, service-worker, compress, images, fonts-css, subset-fonts, pricing-types, sync-locales, active-locales, exchange-rates, types
│   │   ├── scripts/        #     build scripts: build.ts, dev.ts, serve.ts, rsbuild-wrapper.ts, clean-cache.ts, fetch-exchange-rates.ts
│   │   └── tools/          #     tools: preview.ts, lighthouse.ts, menu.ts
│   ├── core/              #   @web-pages-starter/core — json5, pathe, logger, signal-handler, pipeline-cache (no external deps)
│   ├── fonts/             #   @web-pages-starter/fonts — @fontsource/* packages (24 fonts). Depends on core + i18n
│   ├── i18n/              #   @web-pages-starter/i18n — i18next, pluralize, chokidar (for i18n watch CLI)
│   │   ├── index.ts       #     public API barrel
│   │   ├── data/          #     master data — 136 locales, 93 languages (build-time only)
│   │   ├── engine/        #     formatters, helpers, active-locales (client)
│   │   ├── strategies/    #     per-language cardinal/ordinal (code-split async)
│   │   ├── runtime/       #     i18next init, Alpine store
│   │   └── config/        #     types, defineI18n
│   ├── page-system/       #   @web-pages-starter/page-system — limax, page system (scanner, dynamic routes, CLI, page-inject-loader). Depends on core + i18n
│   │   ├── index.ts       #     public API barrel
│   │   ├── system-pages.ts #     ROOT_PAGE, SYSTEM_PAGE_IDS, SYSTEM_PAGE_SLUGS, slug helpers
│   │   ├── scanner.ts     #     scanPages(), isGroup(), isSlugDir(), isPrivateDir()
│   │   ├── dynamic-routes.ts #  generateDynamicEntries() — [slug] discovery from data.json5
│   │   ├── page-inject-loader.cjs # auto-injects bootstrap + CSS via loader options
│   │   └── cli/           #     sync-system-pages.ts, generate-page.ts, delete-page.ts
│   ├── template-engine/   #   @web-pages-starter/template-engine — Nunjucks SSR rendering. Depends on core + i18n + page-system
│   │   ├── index.ts       #     public API barrel: exports createTemplateParams, scanSharedLocales
│   │   └── template.ts    #     Nunjucks i18n.* API: createTemplateParams(), generateClientI18nScript(), scanSharedLocales()
│   └── env/               #   env system (auto-generates generated/env.ts from .env files)
│       ├── cli/            #     generate-env.ts (scans .env → schema + engine + validation)
│       └── preload.ts      #     Bun preload (loads .env before any module via bunfig.toml)
├── public/                # static assets (favicon, generated sw.js/manifest/robots/sitemap)
│   └── assets/i18n/       #   pre-compiled i18n JSON bundles (generated)
├── generated/             # auto-generated: env.ts (env system), active-locales-data, exchange rates, i18n types, image-manifest (6 files tracked in git, regenerated at build)
├── tests/                 # general DOM sanity check (rstest)
├── docs/                  # documentation
```

## Pages & Routing

File-system based, zero-config routing. Drop a folder under `pages/` and it becomes a route. The root page (`home` by default) is output as `index.html` via the `pluginRootPageAsIndex` Rsbuild plugin.

`ROOT_PAGE` lives in `packages/page-system/system-pages.ts`. System pages (root + 6 error pages) have locale-dependent folder names managed by `SYSTEM_PAGE_SLUGS` — `page_id` (from `data.json5`) is the stable identifier, decoupled from the folder name. When the default locale changes, `sync-system-pages` renames ALL system page folders to the new locale's slugs. Locale files stay keyed by `page_id` (`home.json`, `not-found.json`, etc.) and are never renamed.

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

### Generate a new page

```bash
bun ./packages/page-system/cli/generate-page.ts pricing
```

Creates the page folder, Nunjucks template, entry files, and locale files for active locales. Available at `/pricing` immediately.

### Page data

Each page has an optional `data.json5` for structural/layout data (page_id, SEO, colors, icons, ordering). Text content comes from locale files. This separates content from presentation.

| Variable | Source | Access |
| --- | --- | --- |
| `global.*` | `data/global.json5` + `menu.json5` | site name, SEO, social, navigation |
| `page.*` | `pages/{page}/data.json5` | page-specific layout data |
| `i18n.*` | `locales/{locale}/*.json` | translated text (see [i18n](#i18n)) |
| `lang` | `i18nConfig.defaultLocale` | current locale code |
| `base_path` | `env.BASE_PATH` | subpath prefix for asset URLs (default `/`) |
| `localeConfig` | `LOCALES` lookup | current locale's `dir`, `writingSystem`, etc. |
| `clientI18nScript` | `packages/template-engine/template.ts` | inline `<script>` for i18n bootstrap |
| `page_id` | `params.entryName` | stable page identifier (decoupled from folder name; folder uses locale-dependent slug) |

### Template inheritance

All pages extend `layouts/main.njk` which provides the `<head>`, navbar, footer, and the inline i18n bootstrap script. Pages override `{% block content %}` for their body.

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

Shared Nunjucks partials are located in `shared/`. Two usage patterns:

**Include partials** (self-contained blocks):
```njk
{% include "shared/ui/composites/navbar.njk" %}
{% include "shared/ui/composites/footer.njk" %}
{% include "shared/ui/composites/cta.njk" %}
```

**Import macros** (parameterized, reusable):
```njk
{% import "shared/ui/composites/hero-section.njk" as hero %}
{% import "shared/ui/composites/section-header.njk" as section %}
{% import "shared/ui/primitives/icons.njk" as icon %}
{% import "shared/ui/primitives/form-input.njk" as form %}
{% import "shared/ui/composites/info-card.njk" as card %}
{% import "shared/ui/social-link.njk" as social_link %}

{{ hero.hero_section(badge=i18n.t('home:hero.badge'), title_part1=i18n.t('home:hero.title_part1'), title_highlight=i18n.t('home:hero.title_highlight'), description=i18n.t('home:hero.description')) }}
{{ icon.icon('lightning', 'w-8 h-8', size='xl') }}
{{ form.form_input('text', 'contact:contact.form.name', 'contact:contact.form.name_placeholder', 'name', i18n=i18n) }}
```

Shared locale namespaces (e.g. `cta`) are auto-detected by `scanSharedLocales()` which scans templates for `i18n.t('namespace:...')` usage and recursively follows `{% include %}` / `{% import %}` chains. No manual declaration is required — just use `i18n.t('cta:heading')` in a shared template and include it in a page.

## Styling

**Tailwind CSS v4** with CSS-first configuration (no `tailwind.config.*`). PostCSS uses `@tailwindcss/postcss` as the sole plugin.

### Design tokens

CSS custom properties on `:root` in `styles/main.css`:

| Token | Purpose |
| --- | --- |
| `--gradient-primary` / `--gradient-primary-subtle` / `--gradient-hero` / `--gradient-violet` | Gradient presets |
| `--elevation-1` / `--elevation-2` / `--elevation-3` | Shadow depth |
| `--shadow-border` / `--shadow-border-hover` | Shadow-as-border for cards (replaces `border` for depth) |
| `--radius-card-*` / `--radius-btn` / `--radius-icon` | Border radii |
| `--font-sans` | Dynamic font (set by i18n writing system; Tailwind v4 `@theme` variable) |
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

136 BCP 47 locales spanning 93 languages. Default locale: `en-US`.

### Data flow

```
locales/{locale}/*.json
        │
        ├─► Build time (packages/template-engine/template.ts)
        │     Resolves keys with the default locale,
        │     emits HTML with data-* attributes
        │
        └─► Runtime (packages/i18n/runtime/runtime.ts)
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

The i18n store provides reactive locale switching. Registered in `packages/i18n/runtime/store.ts`.

| Property | Type | Purpose |
| --- | --- | --- |
| `languages` | `{code, label, flag}[]` | Available locales |
| `current` | `string` | Active locale code |
| `change(code)` | method | Full locale switch (persist, translate, fonts) |

### Alpine data components

| Component | Location | Purpose |
| --- | --- | --- |
| `navbar` | `shared/nav/navbar.njk` (inline script) | Mobile menu, scroll-aware hide/show, language picker dropdown, touch gestures |
| `contactForm` | `pages/contact/index.ts` | Form validation with field-level error messages |
| `pricing` | `pages/pricing/index.njk` (inline `x-data`) | Monthly/yearly toggle |

### Bootstrap sequence (`bootstrap.ts`)

1. Import `styles/main.css` (global CSS)
2. Load Alpine CSP + fonts module in parallel (`/* webpackPreload: true */` magic comments for critical chunks)
3. **Single-locale**: register stub i18n store → `Alpine.start()` immediately → skip i18next entirely
4. **Multi-locale (default locale)**: register i18n store + navbar → `Alpine.start()` immediately → i18next initializes in background
5. **Multi-locale (non-default locale)**: register store + navbar → `initIntl(locale)` → `Alpine.start()` (prevents flash of wrong language)
6. Font CSS loaded via `<link>` in template head. `injectFontFaceRules()` in `fonts.ts` checks for existing `CSSFontFaceRule` in `document.styleSheets` — skips if rules already present from inlined CSS. `watchScriptAndLoadFont()` sets up `MutationObserver` for locale changes.
7. Register service worker (production only)

Bootstrap is auto-injected into every page entry via `packages/page-system/page-inject-loader.cjs` — no manual `import` needed in page `script.ts` files.

See [docs/i18n.md](docs/i18n.md#runtime) for detailed bootstrap flow.

## Build Pipeline

### Development

```
generate-paths → generate-pricing-types → generate-env → sync-system-pages → fetch-exchange-rates → generate-active-locales → generate-fonts-css → subset-fonts → sync-locales → generate-types → generate-images → [watch || rsbuild dev]
```

- `generate-paths` + `generate-env` must run first (all generators depend on their outputs)
- Rsbuild dev server on port 8888 with HMR
- Hot reload for `.njk`, `.json`, `.json5` files via `pluginHotReloadContent` (Rspack watches `locales/`, `data/`, `pages/`, `shared/`, `layouts/`, `generated/` — triggers full rebuild + page reload)
- Dev cache: `generateClientI18nScript` hashes active locale files by mtime — cache invalidates when any locale file changes
- Locale file watcher (`packages/i18n/cli/watch.ts`) — runs separately in dev mode, watches locale JSON files + `configs/i18n.ts` + `generated/`; auto-regenerates active-locales → sync-locales → generate-types --no-check on locale or config change

### Production

```
generate-paths → generate-pricing-types → generate-env → sync-system-pages → fetch-exchange-rates → generate-active-locales → generate-fonts-css → subset-fonts → sync-locales → generate-types → generate-images → rsbuild-wrapper → copy-locale-assets
```

**SERVE generators** (inside rsbuild-wrapper, before rsbuild): `generate-sitemap → generate-manifest → generate-robots → generate-service-worker`

**rsbuild-wrapper** executes: rsbuild → copy-to-dist → root-page-as-index → pretty-html → inline-css → preload-chunks → compress

`build.ts` orchestrates the final steps with `NODE_ENV=production`:
1. Cleans `dist/`
2. Runs SERVE generators (sitemap, manifest, robots, sw) with production env vars
3. Spawns rsbuild-wrapper which runs Rsbuild for production bundle

**Post-build:**
- **copy-locale-assets** — copies locale JSON files from `locales/` to `public/assets/locales/` and `dist/assets/locales/`

**Pre-build steps** (run before rsbuild):
0. **generate-paths** — generates `generated/paths.ts` from `tsconfig.json` paths (alias map + `lookup()`/`find()` helpers). Must run first.
1. **generate-pricing-types** — extracts currency codes from `data/pricing.json5` → generates `generated/pricing.d.ts`
2. **generate-env** — regenerates `generated/env.ts` from `.env` files (schema + engine + runtime validation + singleton). Must run before any tool importing `@generated/env`
3. **generate-active-locales** — generates `generated/active-locales-data.ts` with filtered locale/language/numbering/writing-system/font data. Production mode (`--prod`) outputs only active locale entries; dev mode outputs all entries.
4. **sync-system-pages** — renames ALL system page folders to match locale-dependent slugs from `SYSTEM_PAGE_SLUGS` when the default locale changes
5. **fetch-exchange-rates** — pulls live rates from Frankfurter API (24h cache)
6. **generate-fonts-css** — generates `public/assets/fonts/fonts.css` with font-face rules for active locales (subset-filtered by writing system)
7. **subset-fonts** — uses `pyftsubset` (fonttools CLI) to strip hinting and unused OpenType tables from woff2 font files
8. **sync-locales** — creates missing locale directories and syncs missing `.json` files from the default locale
9. **generate-types** — generates `generated/i18n.d.ts` type definitions (overwrites stub), checks locale parity (errors fail the build; dev mode uses `--no-check` to skip parity), syncs `i18n-ally.sourceLanguage`/`displayLanguage` from `i18nConfig.defaultLocale`
10. **generate-images** — compresses images (AVIF, 3 sizes: 400/800/1600w, quality 50), generates `generated/image-manifest.ts`

**SERVE generators** (run inside rsbuild-wrapper before rsbuild):
11. **generate-sitemap** — generates `public/sitemap.xml` from pages and `SITE_URL`
12. **generate-manifest** — generates `public/manifest.json` from `global.json5` + `i18nConfig`, uses `BASE_PATH` for `start_url` and `scope`
13. **generate-robots** — generates `public/robots.txt` from `SITE_URL`
14. **generate-service-worker** — generates `public/service-worker.js` dynamically with locale-specific error page URLs from `SYSTEM_PAGE_SLUGS`

**rsbuild-wrapper** executes:
- Runs rsbuild for production bundle with JS + CSS minification, HTML minification
- `home.html` → `index.html` rename
- Image compression (AVIF)
- `inlineCssOnDist()` — CSS inlined into `<style nonce="...">` (production only; skipped in pretty mode)
- `preloadChunksOnDist()` — adds `<link rel="preload">` for named JS chunks
- Font woff2 preload from `fontsConfig`
- Content-hashed filenames for JS/CSS/images
- Brotli + Gzip compression (`compress.ts`)

**Post-build:**
- **copy-locale-assets** — copies locale JSON files from `locales/` to `public/assets/locales/` and `dist/assets/locales/`

### Rsbuild configuration highlights

| Feature | Detail |
| --- | --- |
| Entry discovery | Recursive scan: `pages/**/script.ts` (optional). `_` prefix (skip), `()` groups (strip from URL), `[slug]` (dynamic from data.json5) |
| Page entry injection | `page-inject-loader.cjs` auto-injects bootstrap + CSS via loader options — zero manual imports |
| Bootstrap shared chunk | `splitChunks.bootstrap` (priority 40, enforce: true) extracts bootstrap to single cached chunk. No duplication across pages |
| Resource hints | `preloadChunksOnDist()` (in rsbuild-wrapper) injects `<link rel="preload" as="script">` for named async chunks (excludes `<script defer>` chunks). Font woff2 preload from template engine. CSS inlined via `inlineCssOnDist()` with nonce + URL rewriting (production only; skipped in pretty mode) |
| Root page as index | `rootPageAsIndex()` function in rsbuild-wrapper renames `home.html` → `index.html` post-build |
| Clean URLs | Dev server `historyApiFallback` with per-page rewrites: `/pricing` → `pricing.html`, `/about` → `about.html`, etc. |
| Hot reload | `pluginHotReloadContent` adds `compilation.contextDependencies` for `locales/`, `data/`, `pages/`, `shared/`, `layouts/` — Rspack rebuilds on any file change in these dirs |
| `import.meta.env` | `source.define` replaces `import.meta.env` with full env object (browser-safe keys only). `PRIVATE_` prefix in `.env` excludes secrets from browser bundle |
| Output paths | `dist/assets/{scripts,styles,images,fonts}` — organized by asset type |
| Static copy | `output.copy` moves `public/` static files (favicon, sw.js, manifest, robots, i18n bundles) to `dist/` |
| Path aliases | Single source: `tsconfig.json` paths → `generated/paths.ts` auto-derives bundler format for jiti + Rsbuild. `@i18n`, `@template-engine`, `@page-system`, `@config/*`, `@cli/*`, `@core/*`, `@utils/*`, `@generated/*`, `@assets/*`, `@data/*`, `@dist/*`, `@layouts/*`, `@locales/*`, `@pages/*`, `@public/*`, `@shared/*`. Edit `tsconfig.json` only — all consumers auto-sync |
| Nunjucks loader | `simple-nunjucks-loader` with search paths: `pages/`, `layouts/`, `.` (root); `assetsPaths: assets/` |
| Pre-entries | Bootstrap + main.css auto-injected via `page-inject-loader.cjs` |

### Preview (`bun run preview`)

Full preview flow — runs `bun run build` with `BUILD_PREVIEW=true`, then starts a local server and tunnel for external testing. Interactive mode prompts for tunnel provider. Use `--tunnel` flag for scripted use:

```bash
bun run preview                                    # Interactive: select ngrok or cloudflared
bun ./packages/cli/tools/preview.ts --tunnel ngrok              # Use ngrok (requires NGROK_AUTHTOKEN)
bun ./packages/cli/tools/preview.ts --tunnel cloudflared        # Use cloudflared
```

**Tunnel providers:**

| Provider | Requirement | Flow |
| --- | --- | --- |
| `ngrok` | `NGROK_AUTHTOKEN` env var | Tunnel → Build → Serve |
| `cloudflared` | `cloudflared` installed | Build → Serve → Tunnel → Replace URLs |

**Flow:**

1. **ngrok**: Starts tunnel first (URL known immediately), builds with correct public URL, serves
2. **cloudflared**: Builds first (uses `HOST:PORT`, default `127.0.0.1:8888`), serves, starts tunnel, **replaces placeholder URLs** in dist/ with tunnel URL

Ideal for Lighthouse audits, mobile testing, or sharing work in progress via a public URL.

## Configuration

| File | Purpose |
| --- | --- |
| `generated/env.ts` | Auto-generated env system: schema + engine + runtime validation + singleton. Generated from `.env` files by `packages/env/cli/generate-env.ts`. `PRIVATE_` prefix = server-only (browser-safe by default). Stage pipeline: `dev → qa → uat → preprod → prod` |
| `packages/env/preload.ts` | Bun preload script (`bunfig.toml`), loads `.env` + `.env.{stage}` into `process.env` before any module runs |
| `bunfig.toml` | `preload = ["./packages/env/preload.ts"]` |
| `.env` | General defaults shared across all stages. Required. Real file gitignored, `.env.example` template git-tracked |
| `.env.{stage}` | Per-stage overrides. Active: `.env.dev`, `.env.prod`. Templates: `.env.{stage}.example` (git-tracked). Real files gitignored. Stage pipeline: `dev → qa → uat → preprod → prod` |
| `configs/i18n.ts` | Default locale + active locales |
| `configs/fonts.ts` | Font stack — family config (`sans`/`serif`/`mono` + custom keys). Drives `generate-fonts-css.ts` (font CSS generation) and template engine font preload |
| `configs/rsbuild.ts` | Rsbuild build configuration (real config; `rsbuild.config.ts` is a thin jiti wrapper) |
| `packages/page-system/system-pages.ts` | `ROOT_PAGE`, `SYSTEM_PAGE_IDS` (7 system pages), `SYSTEM_PAGE_SLUGS` (locale-dependent URL slugs), slug helpers (`getSystemPageSlug`, `getRootPageSlug`, `getErrorPageSlugs`, `isSystemPageId`, `isSystemPageSlug`) |
| `data/global.json5` | Site name, SEO metadata, social links, DNS/prefetch |
| `data/menu.json5` | Navigation structure (header menu with children) |
| `biome.json` | Linting (Tailwind class sorting, organize imports) + formatting (2-space indent, single quotes). Overrides: `main.css` disables `noDescendingSpecificity`/`noImportantStyles`; `common.ts` disables `noExplicitAny` |
| `.vscode/settings.json` | Editor config: Biome formatter, Tailwind IntelliSense, i18n-ally, Peacock color |
| `.vscode/extensions.json` | Workspace extension recommendations (12 extensions) |
| `tsconfig.json` | Strict mode, ESNext, path aliases (single source of truth — `generated/paths.ts` auto-derives for jiti + bundler) |

### VS Code extensions

Recommended extensions are listed in `.vscode/extensions.json`. Key extensions:

- **Biome** (`biomejs.biome`) — linting and formatting
- **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`) — class autocomplete
- **i18n-ally** (`lokalise.i18n-ally`) — inline translation annotations

> **Note:** i18n-ally's status bar UI (language picker) does not work with this project's custom i18n runtime. After installing, right-click the status bar and hide "i18n Ally" to reduce clutter. The inline annotations (`data-i18n` key display) and review features still work correctly.

### Environment variables

All variables are auto-generated from `.env` files into `generated/env.ts` by `packages/env/cli/generate-env.ts`. Runtime type validation warns on mismatches. `PRIVATE_` prefix in `.env` marks server-only keys (browser-safe by default — like TypeScript class members). Types are inferred from values (`true`/`false` → boolean, digits → number, else → string).

| Variable | Purpose |
| --- | --- |
| `STAGE` | Current stage: `dev`, `qa`, `uat`, `preprod`, `prod` |
| `SITE_URL` | Base URL for sitemap and meta tags (required) |
| `BASE_PATH` | Subpath for deployment (e.g. `/web-pages-starter/`). Defaults to `/` |
| `PORT` | Server port (default 8888) |
| `HOST` | Server bind address |
| `MINIFY` | Enable JS/CSS minification (default `true`) |
| `BUILD_PREVIEW` | Set automatically by preview tool (default `false`) |
| `PRETTY_HTML` | Pretty-print HTML output (default `false`) |
| `NGROK_AUTHTOKEN` | Auth token for ngrok tunnel (preview) |
| `NODE_BINARY` / `RSBUILD_RUNTIME` | Runtime override for build process |
| `LIGHTHOUSE_OUTPUT_DIR` | Custom output directory for Lighthouse reports |
| `SITEMAP_DEFAULT_PRIORITY` | Default priority for sitemap URLs |
| `SITEMAP_DEFAULT_CHANGEFREQ` | Default change frequency for sitemap URLs |

## PWA

- `public/manifest.json` — web app manifest (generated by `packages/cli/generators/manifest.ts` from `global.json5` + `i18nConfig`)
- `public/service-worker.js` — **generated** by `packages/cli/generators/service-worker.ts` (not static). Stale-while-revalidate service worker with navigation cache and asset caching. Derives `BASE_PATH` from `self.location`, precaches `index.html`, 6 error pages, `manifest.json`. Offline fallback to `offline.html`. Cache version: dynamic — `starter-<base36 timestamp>`, regenerated each build
- Registered automatically in production builds via `import.meta.env.BASE_PATH`

### Error pages

Six error pages using shared Nunjucks partials (`shared/ui/patterns/error-page.njk`). Each has its own i18n namespace and locale files across all 136 locales. Error page URLs are locale-dependent — the URL slug for each error page is defined per-locale in `SYSTEM_PAGE_SLUGS` (`packages/page-system/system-pages.ts`).

| Page | URL | Status | Icon | Gradient | Pattern |
| --- | --- | --- | --- | --- | --- |
| `not-found` | `/not-found` | 404 | search | violet/fuchsia | `{% set %}` + `{% include "shared/ui/patterns/error-page.njk" %}` |
| `unauthorized` | `/unauthorized` | 401 | key | yellow/amber | Same |
| `forbidden` | `/forbidden` | 403 | shield | amber/orange | Same |
| `server-error` | `/server-error` | 500 | lightning | rose/red | Same |
| `maintenance` | `/maintenance` | 503 | clock | sky/blue | Same |
| `offline` | `/offline` | — | cloud | slate/zinc | Inline content (reload button) |

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
- Import paths: `tsconfig.json` is single source of truth → `generated/paths.ts` auto-derives for jiti + bundler. Aliases: `@i18n`, `@template-engine`, `@page-system`, `@config/*`, `@cli/*`, `@core/*`, `@utils/*`, `@generated/*`, `@assets/*`, `@data/*`, `@dist/*`, `@layouts/*`, `@locales/*`, `@pages/*`, `@public/*`, `@shared/*`
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

[Rstest](https://rstest.dev) + `happy-dom` + `@testing-library/dom`.

### Commands

```bash
bun run test                                          # run all tests
bun run test -- --watch                               # watch mode
bun run test -- --coverage                            # with coverage report (terminal + html + lcov)
bun run test -- --coverage --coverage.include "packages/i18n/**"  # coverage for specific paths
```

### Structure

Tests are colocated with source in `__tests__/` directories:

```
tests/
└── dom.test.ts              # DOM rendering sanity check

packages/i18n/__tests__/
├── helpers.test.ts          # locale lookup, fallback, direction, currency
├── formatters.test.ts       # formatNumber, formatCurrency, formatDate, formatBytes, cardinal, ordinal
└── home-data.test.ts        # home page structure + locale key parity (en-US ↔ id-ID)

packages/page-system/__tests__/
└── system-pages.test.ts     # ROOT_PAGE, SYSTEM_PAGE_SLUGS, slug helpers

shared/utils/__tests__/
└── romanize.test.ts         # limax romanization
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

### Interactive menu

```bash
bun run cli   # interactive menu with categorized sections
```

Menu sections:

| Section | Tools |
|---|---|
| **Develop** | Dev Server, Test |
| **Build** | Production Build, Pretty Build, Debug Build, Preview Tunnel, Serve Dist |
| **Pages** | Generate Page, Delete Page |
| **i18n** | Check Parity, Sync Locales |
| **Performance** | Lighthouse |
| **Utilities** | Subset Fonts, Clean Cache, Lint, Typecheck |

### Package scripts

| Command | What it does |
| --- | --- |
| `bun run dev` | Development server (PRE_BUILD_DEV pipeline: types without parity check) |
| `bun run build` | Production build: minified HTML + CSS/JS, sitemap, manifest, robots, SW |
| `bun run build -- --pretty` | Pretty HTML for CMS template porting (CSS external, readable output) |
| `bun run build -- --debug` | Debug build: JS/CSS not minified, source maps enabled |
| `bun run preview` | Build (SITE_URL=tunnel) + serve via ngrok or cloudflared tunnel |
| `bun run serve` | Serve the production build locally |
| `bun run clean:cache` | Remove `node_modules/.cache`, `.cache`, `dist`, `public/assets/i18n` |
| `bun run typecheck` | Run `tsc --noEmit` type checking |
| `bun run test` | Run tests via `rstest`; supports `--coverage`, `--watch` flags |
| `bun run cli` | Interactive CLI menu (all 16 commands) |
| `bunx biome ci` | Lint check (no write) |

### Direct tool access

Every tool supports `--help`:

| Command | What it does |
| --- | --- |
| `bun ./packages/page-system/cli/generate-page.ts --help` | Usage, options, examples for generate-page |
| `bun ./packages/page-system/cli/delete-page.ts --help` | Usage, options, examples for delete-page |
| `bun ./packages/i18n/cli/check-parity.ts --help` | Usage, options, exit codes for check-parity |
| `bun ./packages/i18n/cli/sync-locales.ts --help` | Usage, options for sync-locales |
| `bun ./packages/i18n/cli/generate-types.ts --help` | Usage, options, exit codes for generate-types |
| `bun run cli --help` | CLI menu help |
| `bun ./packages/cli/tools/lighthouse.ts --help` | Lighthouse audit options |
| `bun ./packages/cli/scripts/clean-cache.ts --help` | Cache cleaning options |

## Tools

Tools live in their respective packages. Shared utilities are in `packages/core/utils/`:

| Module | Purpose |
| --- | --- |
| `packages/core/utils/logger.ts` | Centralized `log.*()` and `logBox()` for formatted box output |
| `packages/core/utils/signal-handler.ts` | SIGINT handling, `wrapMainError()`, `handleExitPromptError()`, `createServer()` with EADDRINUSE protection |
| `packages/core/utils/hono-server.ts` | `createStaticApp()`, `loadHtmlCache()`, `getPageNames()` — Hono static server with cache headers |
| `packages/core/utils/write-file.ts` | `writeFilePath()` (mkdir + write), `generatedHeader()`, `shouldAddComment()`, `withGeneratedHeader()` for auto-generated file headers |
| `shared/utils/romanize.ts` | `romanize()` — limax-based romanization for URL-safe slug generation from non-Latin page names |

| Tool | Shared imports | Purpose |
| --- | --- | --- |
| `packages/cli/scripts/build.ts` | log, logBox, lookup, runStep, PIPELINE_STEPS | Production build wrapper (runs full pipeline: PRE_BUILD → rsbuild-wrapper → POST_BUILD) |
| `packages/cli/tools/preview.ts` | log, createServer, setupSigintHandler, wrapMainError, createStaticApp | Build + serve through public tunnel (ngrok/cloudflared); passes SITE_URL to build |
| `packages/cli/scripts/serve.ts` | log, createServer, setupSigintHandler, createStaticApp, loadHtmlCache, getPageNames | Serve production build locally |
| `packages/cli/tools/lighthouse.ts` | log, logBox, setupSigintHandler, wrapMainError, env.SITE_URL | Lighthouse audit runner |
| `packages/cli/tools/menu.ts` | log, setupSigintHandler, wrapMainError, lookup, inquirer | Interactive CLI menu: workflow tools + manual tools |
| `packages/page-system/cli/generate-page.ts` | log, lookup, find, scanner | Generate new page with locale files for active locales |
| `packages/i18n/cli/generate-types.ts` | log, logBox, writeFilePath, generatedHeader | Generate i18n types, parity check (fails build), `--no-check` skips parity in dev mode, syncs i18n-ally config |
| `packages/cli/generators/service-worker.ts` | logBox, writeFilePath, loadTemplate, inject | Generate `public/service-worker.js` with locale-specific error page URLs |
| `packages/env/cli/generate-env.ts` | log, loadTemplate, inject | Regenerate env schema from `.env` files |
| `packages/page-system/cli/sync-system-pages.ts` | log, logBox, wrapMainError | Rename ALL system page folders to locale-dependent slugs when default locale changes |
| `packages/i18n/cli/sync-locales.ts` | log, logBox | Create missing locale directories; sync missing files in existing directories |
| `packages/page-system/cli/delete-page.ts` | log | Delete a page (folder + locale files across all locale dirs); scans for broken URL references before deletion; system pages protected |
| `packages/i18n/cli/check-parity.ts` | log | Diff translation keys across locales |
| `packages/cli/scripts/fetch-exchange-rates.ts` | log, writeFilePath, generatedHeader, loadTemplate, inject | Fetch and cache exchange rates |
| `packages/i18n/cli/watch.ts` | log, logBox, setupSigintHandler | Watch locale file changes |
| `packages/cli/scripts/clean-cache.ts` | log | Remove cache directories |

## Tech Stack

| Layer | Technology | Version |
| --- | --- | --- |
| Runtime | Bun | `>= 1.3.14` |
| Bundler | Rsbuild | `^2.0.14` |
| Language | TypeScript | `^6.0.3` |
| Templates | Nunjucks | `^3.2.4` |
| Reactive UI | Alpine.js | `^3.15.12` |
| CSS | Tailwind CSS v4 | `^4.3.1` |
| i18n | i18next | `^26.3.1` |
| Server | Hono | `^4.12.25` |
| Lint/Format | Biome | `^2.5.0` |
| Testing | Rstest | `^0.10.4` |
| HTML minifier | html-minifier-terser | `^7.2.0` |
| HTML beautifier | js-beautify | `^1.15.4` |
| Romanization | limax | `^4.2.3` |

## Browser Support

`>= 0.5%, last 2 versions, not dead, not ie 11`

## License

MIT
