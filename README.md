# Web Pages Starter

A multi-page starter for content sites built with **Rsbuild + Nunjucks + Alpine.js + Tailwind CSS v4 + i18next**. Ships 136 locales out of the box with SSG rendering, runtime language switching, locale-aware formatting, RTL support, and regional pricing.

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
│   ├── env.ts             #   type-safe env validation (@t3-oss/env-core + Zod) → env, IS_DEV, IS_PROD, IS_NODE
│   ├── i18n.ts            #   defaultLocale + active locales
│   ├── fonts.ts           #   font stack (CSS import + family config)
│   └── rsbuild.ts         #   Rsbuild build configuration (real config; rsbuild.config.ts is a jiti wrapper)
├── constants.ts           # browser-safe root constants — IS_NODE, IS_PROD, ROOT_PATH (no node: imports)
├── utils/                 # shared utilities (flattened from packages/core) — common, json5, microtask-queue, types
│   └── paths.ts           #   resolveRoot() — centralizes all filesystem path resolution
├── types/                 # ambient type declarations (env.d.ts, global.d.ts, globals.d.ts)
├── data/                  # global site data
│   ├── global.json5       #   site_name, seo, social, dns, preconnect
│   └── menu.json5         #   navigation structure (header links + dropdowns)
├── pages/                 # routes — one folder per page
│   └── {page}/
│       ├── index.njk      #   Nunjucks template (required)
│       ├── index.json5    #   page data — colors, icons, layout (optional)
│       ├── index.ts       #   page entry (auto-imported by Rsbuild)
│       ├── index.css      #   page styles (optional)
│       └── _components/    #   page-local components (underscore = not a page)
├── shared/                # reusable Nunjucks UI + layouts (cross-page)
│   ├── seo/               #   page-meta.njk macro
│   ├── ui/                #   icons, form-input, info-card, social-link
│   ├── layout/            #   cta, footer, hero-section, section-header
│   ├── nav/               #   navbar
│   └── error/             #   error-page, offline-page
├── features/              # domain logic by capability
│   ├── contact-form/      #   contact form validation
│   └── carousel/          #   carousel init
├── layouts/
│   └── main.njk           # base template (SEO, navbar, footer, scripts)
├── locales/               # translation source of truth (136 locales)
│   └── {locale}/
│       ├── common.json    #   shared copy (nav, footer, labels, plurals)
│       ├── {page}.json    #   page-specific copy
│       └── {shared}.json  #   shared locale copy (e.g. cta.json)
├── styles/
│   ├── tokens.css         #   design tokens (CSS custom properties)
│   ├── components.css      #   component classes
│   └── main.css           #   Tailwind v4 entry (imports tokens + components)
├── assets/                # images, fonts, raw assets
├── bootstrap.ts           # app entry — store registration, initIntl, Alpine.start(), fonts, SW
├── scripts/               # build-time CLI scripts (build, generate-*, serve, cli)
│   └── lib/               #   logger, signal-handler, hono-server, write-file, romanize
├── packages/
│   ├── i18n/              #   self-contained i18n package (data, formatting, runtime, strategies, fonts)
│   │   ├── index.ts       #     public API barrel
│   │   ├── data/          #     master data — 136 locales, 93 languages (build-time only)
│   │   ├── engine/        #     formatters, helpers, active-locales (client)
│   │   ├── strategies/    #     per-language cardinal/ordinal (code-split async)
│   │   ├── fonts/         #     font loading system
│   │   ├── runtime/       #     i18next init, Alpine store
│   │   └── config/        #     types, defineI18n/defineFont/defineFontStack
│   └── page-engine/       #   page system (SSR rendering, scanner, system pages, CLI). Depends on @i18n (one-way)
│       ├── index.ts       #     public API barrel
│       ├── system-pages.ts #     ROOT_PAGE, SYSTEM_PAGE_IDS, SYSTEM_PAGE_SLUGS, slug helpers
│       ├── scanner.ts     #     scanPages(), isGroup(), isSlugDir()
│       ├── template.ts    #     Nunjucks SSR: createTemplateParams(), generateClientI18nScript(), scanSharedLocales()
│       └── cli/           #     sync-system-pages.ts
├── public/                # static assets (favicon, generated sw.js/manifest/robots/sitemap)
│   └── assets/i18n/       #   pre-compiled i18n JSON bundles (generated)
├── generated/             # auto-generated active-locales-data + exchange rates + i18n types (tracked in git; regenerated at build)
├── tests/                 # general DOM sanity check (rstest)
├── docs/                  # documentation
```

## Pages & Routing

File-system based, zero-config routing. Drop a folder under `pages/` and it becomes a route. The root page (`home` by default) is output as `index.html` via the `pluginRootPageAsIndex` Rsbuild plugin.

`ROOT_PAGE` lives in `packages/page-engine/system-pages.ts`. System pages (root + 6 error pages) have locale-dependent folder names driven by `SYSTEM_PAGE_SLUGS` — `page_id` (from `index.json5`) is the stable identifier, decoupled from the folder name. When the default locale changes, `sync-system-pages` renames ALL system page folders to the new locale's slugs. Locale files stay keyed by `page_id` (`home.json`, `not-found.json`, etc.) and are never renamed.

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
bun ./scripts/generate-page.ts pricing
```

Creates the page folder, Nunjucks template, entry files, and locale files for active locales. Available at `/pricing` immediately.

### Page data

Each page has an optional `index.json5` for structural/layout data (colors, icons, ordering). Text content comes from locale files. This separates content from presentation.

| Variable | Source | Access |
| --- | --- | --- |
| `global.*` | `data/global.json5` + `menu.json5` | site name, SEO, social, navigation |
| `page.*` | `pages/{page}/index.json5` | page-specific layout data |
| `i18n.*` | `locales/{locale}/*.json` | translated text (see [i18n](#i18n)) |
| `lang` | `i18nConfig.defaultLocale` | current locale code |
| `base_path` | `env.BASE_PATH` | subpath prefix for asset URLs (default `/`) |
| `localeConfig` | `LOCALES` lookup | current locale's `dir`, `writingSystem`, etc. |
| `clientI18nScript` | `packages/page-engine/template.ts` | inline `<script>` for i18n bootstrap |
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

Shared Nunjucks partials live in `shared/`. Two usage patterns:

**Include partials** (self-contained blocks):
```njk
{% include "shared/nav/navbar.njk" %}
{% include "shared/layout/footer.njk" %}
{% include "shared/layout/cta.njk" %}
```

**Import macros** (parameterized, reusable):
```njk
{% import "shared/layout/hero-section.njk" as hero %}
{% import "shared/layout/section-header.njk" as section %}
{% import "shared/ui/icons.njk" as icon %}
{% import "shared/ui/form-input.njk" as form %}
{% import "shared/ui/info-card.njk" as card %}
{% import "shared/ui/social-link.njk" as social_link %}

{{ hero.hero_section(badge=i18n.t('home:hero.badge'), title_part1=i18n.t('home:hero.title_part1'), title_highlight=i18n.t('home:hero.title_highlight'), description=i18n.t('home:hero.description')) }}
{{ icon.icon('lightning', 'w-8 h-8', size='xl') }}
{{ form.form_input('text', 'contact:contact.form.name', 'contact:contact.form.name_placeholder', 'name', i18n=i18n) }}
```

Shared locale namespaces (e.g. `cta`) are auto-detected by `scanSharedLocales()` which scans templates for `i18n.t('namespace:...')` usage and recursively follows `{% include %}` / `{% import %}` chains. No manual declaration needed — just use `i18n.t('cta:heading')` in a shared template and include it in a page.

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
        ├─► Build time (packages/page-engine/template.ts)
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

1. Load Alpine + i18n store in parallel, register store
2. Initialize i18next (`initIntl`) — load locale resources, translate page
3. Call `Alpine.start()` (after i18next is ready)
4. Preload active font, defer remaining font loading via `requestIdleCallback`
5. Register service worker (production only)

See [docs/i18n.md](docs/i18n.md#runtime) for detailed bootstrap flow.

## Build Pipeline

### Development

```
sync-system-pages → clean:cache → fetch:rates → generate-active-locales → sync-locales → generate-types → [watch || rsbuild dev]
```

- Rsbuild dev server on port 8888 with HMR
- Hot reload for `.njk`, `.json`, `.json5` files via `pluginHotReloadContent` (Rspack watches `locales/`, `data/`, `pages/`, `shared/`, `layouts/` — triggers full rebuild + page reload)
- Dev cache: `generateClientI18nScript` hashes active locale files by mtime — cache invalidates when any locale file changes
- Locale file watcher (`watch.ts`) — logs when locale JSON files change; run `bun ./packages/i18n/cli/generate-types.ts` manually to refresh types

### Production

```
sync-system-pages → clean:cache → fetch:rates → generate-active-locales --prod → sync-locales → generate-types → generate-sitemap → generate-manifest → generate-robots → generate-sw → build
```

1. **sync-system-pages** — renames ALL system page folders to match locale-dependent slugs from `SYSTEM_PAGE_SLUGS` when the default locale changes
2. **clean-cache** — purges `node_modules/.cache`, `.cache`, `dist`
3. **fetch-exchange-rates** — pulls live rates from Frankfurter API (24h cache)
4. **generate-active-locales** — generates `generated/active-locales-data.ts` with filtered locale/language/numbering/writing-system/font data. Production mode (`--prod`) outputs only active locale entries; dev mode outputs all entries.
5. **sync-locales** — creates missing locale directories and syncs missing `.json` files from the default locale
6. **generate-types** — generates `generated/i18n.d.ts` type definitions (overwrites stub), checks locale parity (errors fail the build), syncs `i18n-ally.sourceLanguage`/`displayLanguage` from `i18nConfig.defaultLocale`
7. **generate-sitemap** — generates `public/sitemap.xml` from pages and `SITE_URL`
8. **generate-manifest** — generates `public/manifest.json` from `global.json5` + `i18nConfig`, uses `BASE_PATH` for `start_url` and `scope`
9. **generate-robots** — generates `public/robots.txt` from `SITE_URL`
10. **generate-sw** — generates `public/sw.js` dynamically with locale-specific error page URLs from `SYSTEM_PAGE_SLUGS` (cache version v5)
11. **build** — Rsbuild production bundle with:
    - JS + CSS minification (Rspack)
    - HTML minification (`html-minifier-terser` — collapse, sort, minify inline CSS/JS, minify JSON-LD)
    - `home.html` → `index.html` rename (`pluginRootPageAsIndex`)
    - Image compression (AVIF, quality 75)
    - CSS inlined into HTML; small JS inlined (<2048 bytes)
    - Per-page code splitting with shared runtime chunk
    - Content-hashed filenames for JS/CSS/images

   **Build flags:**
   - `--pretty` — pretty-print HTML instead of minifying (for CMS template porting)
   - `--debug` — disable JS/CSS minification

12. **postbuild** — restores dev stub (`generate-active-locales` without `--prod`) so local dev/test environment stays functional

### Rsbuild configuration highlights

| Feature | Detail |
| --- | --- |
| Entry discovery | Recursive scan: `pages/**/index.ts` with `_` prefix (skip), `()` groups (strip from URL), `[slug]` (dynamic from data.json5) |
| Root page as index | `pluginRootPageAsIndex` renames `home.html` → `index.html` post-build |
| Clean URLs | Dev server `historyApiFallback` with per-page rewrites: `/pricing` → `pricing.html`, `/about` → `about.html`, etc. |
| Hot reload | `pluginHotReloadContent` adds `compilation.contextDependencies` for `locales/`, `data/`, `pages/`, `shared/`, `layouts/` — Rspack rebuilds on any file change in these dirs |
| `BASE_PATH` support | `source.define` injects `import.meta.env.BASE_PATH` for runtime JS; template param `base_path` for Nunjucks |
| Output paths | `dist/assets/{scripts,styles,images,fonts}` — organized by asset type |
| Static copy | `output.copy` moves `public/` static files (favicon, sw.js, manifest, robots, i18n bundles) to `dist/` |
| Path aliases | `@i18n` / `@i18n/*` → `packages/i18n/`, `@page-engine` / `@page-engine/*` → `packages/page-engine/`, `@config/*` → `configs/`, `@constants` → `constants.ts`, `@utils/*` → `utils/`, `@scripts/*` → `scripts/`, `@generated/*` → `generated/`. Rsbuild resolves `@generated`, `@i18n`, `@constants` at bundle time; CLI scripts (run via Bun) resolve all aliases through `tsconfig.json`. `rsbuild.config.ts` is a thin jiti wrapper that loads `configs/rsbuild.ts` with tsconfig path aliases (`@core` is gone — use `@utils/*` / `@constants`) |
| Nunjucks loader | `simple-nunjucks-loader` with search paths: `pages/`, `layouts/`, `.` (root); `assetsPaths: assets/` |
| Pre-entries | `bootstrap.ts` + `styles/main.css` loaded before every page |

### Preview (`bun run preview`)

Full preview flow — runs `bun run build` with `BUILD_PREVIEW=true`, then starts a local server and tunnel for external testing. Interactive mode prompts for tunnel provider. Use `--tunnel` flag for scripted use:

```bash
bun run preview                                    # Interactive: select ngrok or cloudflared
bun ./scripts/preview.ts --tunnel ngrok              # Use ngrok (requires NGROK_AUTHTOKEN)
bun ./scripts/preview.ts --tunnel cloudflared        # Use cloudflared
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
| `configs/env.ts` | Type-safe env validation (`@t3-oss/env-core` + Zod) → `env`, `IS_DEV`, `IS_PROD`, `IS_NODE`; `SITE_URL` required (no default), `PORT` defaults to 8888, `HOST` defaults to localhost |
| `configs/i18n.ts` | Default locale + active locales |
| `configs/fonts.ts` | Font stack — CSS import + family config (`sans`/`serif`/`mono` + custom keys) |
| `configs/rsbuild.ts` | Rsbuild build configuration (real config; `rsbuild.config.ts` is a thin jiti wrapper) |
| `packages/page-engine/system-pages.ts` | `ROOT_PAGE`, `SYSTEM_PAGE_IDS` (7 system pages), `SYSTEM_PAGE_SLUGS` (locale-dependent URL slugs), slug helpers (`getSystemPageSlug`, `getRootPageSlug`, `getErrorPageSlugs`, `isSystemPageId`, `isSystemPageSlug`) |
| `constants.ts` | Browser-safe root constants — `IS_NODE`, `IS_PROD`, `ROOT_PATH` (no `node:` imports) |
| `utils/paths.ts` | `resolveRoot()` — centralizes all filesystem path resolution |
| `data/global.json5` | Site name, SEO metadata, social links, DNS/prefetch |
| `data/menu.json5` | Navigation structure (header menu with children) |
| `.env.development` | `NODE_ENV`, `SITE_URL`, `PORT`, `HOST` |
| `.env.production` | `NODE_ENV`, `SITE_URL` (production domain) |
| `biome.json` | Linting (Tailwind class sorting, organize imports) + formatting (2-space indent, single quotes). Overrides: `main.css` disables `noDescendingSpecificity`/`noImportantStyles`; `common.ts` disables `noExplicitAny` |
| `.vscode/settings.json` | Editor config: Biome formatter, Tailwind IntelliSense, i18n-ally, Peacock color |
| `.vscode/extensions.json` | Workspace extension recommendations (12 extensions) |
| `tsconfig.json` | Strict mode, ESNext, path aliases |

### VS Code extensions

Recommended extensions are listed in `.vscode/extensions.json`. Key extensions:

- **Biome** (`biomejs.biome`) — linting and formatting
- **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`) — class autocomplete
- **i18n-ally** (`lokalise.i18n-ally`) — inline translation annotations

> **Note:** i18n-ally's status bar UI (language picker) does not work with this project's custom i18n runtime. After installing, right-click the status bar and hide "i18n Ally" to reduce clutter. The inline annotations (`data-i18n` key display) and review features still work correctly.

### Environment variables

All variables are validated at load time by `configs/env.ts` via `@t3-oss/env-core` + Zod into a typed `env` object; invalid or missing required values fail fast. `SITE_URL` is required (no default).

| Variable | Purpose |
| --- | --- |
| `SITE_URL` | Base URL for sitemap and meta tags (required — no default) |
| `BASE_PATH` | Subpath for GitHub Pages deployment (e.g. `/web-pages-starter/`). Defaults to `/` |
| `PORT` | Server port (default 8888) |
| `HOST` | Server bind address (serve: `0.0.0.0`, preview: `127.0.0.1`) |
| `BUILD_PREVIEW` | Set automatically by preview tool |
| `MINIFY` | Disable JS/CSS minification (`"false"`) |
| `PRETTY_HTML` | Pretty-print HTML output instead of minifying (`"true"`). Set automatically by `bun run build -- --pretty` |
| `NODE_BINARY` / `RSBUILD_RUNTIME` | Runtime override for build process |
| `NGROK_AUTHTOKEN` | Auth token for ngrok tunnel (preview tool) |
| `LIGHTHOUSE_OUTPUT_DIR` | Custom output directory for Lighthouse reports |
| `SITEMAP_DEFAULT_PRIORITY` | Default priority for sitemap URLs (default `0.8`) |
| `SITEMAP_DEFAULT_CHANGEFREQ` | Default change frequency for sitemap URLs (default `weekly`) |

## PWA

- `public/manifest.json` — web app manifest (generated by `scripts/generate-manifest.ts` from `global.json5` + `i18nConfig`)
- `public/sw.js` — **generated** by `scripts/generate-sw.ts` (not static). Cache-first service worker with network fallback (derives `BASE_PATH` from `self.location`, precaches `index.html`, 6 error pages with locale-dependent URLs from `SYSTEM_PAGE_SLUGS`, and `manifest.json`; offline fallback to `offline.html`). Cache version: v5
- Registered automatically in production builds via `import.meta.env.BASE_PATH`

### Error pages

Six error pages using shared Nunjucks partials (`shared/error/error-page.njk` and `shared/error/offline-page.njk`). Each has its own i18n namespace and locale files across all 136 locales. Error page URLs are locale-dependent — the URL slug for each error page is defined per-locale in `SYSTEM_PAGE_SLUGS` (`packages/page-engine/system-pages.ts`).

| Page | URL | Status | Icon | Gradient | Pattern |
| --- | --- | --- | --- | --- | --- |
| `not-found` | `/not-found` | 404 | search | violet/fuchsia | `{% set %}` + `{% include "shared/error/error-page.njk" %}` |
| `unauthorized` | `/unauthorized` | 401 | key | yellow/amber | Same |
| `forbidden` | `/forbidden` | 403 | shield | amber/orange | Same |
| `server-error` | `/server-error` | 500 | lightning | rose/red | Same |
| `maintenance` | `/maintenance` | 503 | clock | sky/blue | Same |
| `offline` | `/offline` | — | cloud | slate/zinc | `{% include "shared/error/offline-page.njk" %}` (reload button) |

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
- Import paths: `@i18n`, `@page-engine`, `@config/*`, `@constants`, `@scripts/*`, `@utils/*`, `@generated/*` aliases used consistently (including the rsbuild config chain); `rsbuild.config.ts` is a thin jiti wrapper that loads `configs/rsbuild.ts` with tsconfig path aliases. `@core` is gone — use `@utils/*` / `@constants`
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

packages/page-engine/__tests__/
└── system-pages.test.ts     # ROOT_PAGE, SYSTEM_PAGE_SLUGS, slug helpers

scripts/lib/__tests__/
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

| Command | What it does |
| --- | --- |
| `bun run dev` | Sync system pages, clean cache, fetch rates, generate i18n types, watch locales, start Rsbuild dev server |
| `bun run build` | Production build: minified HTML + CSS/JS, `--prod` active locales, sitemap, manifest, robots, SW |
| `bun run build -- --pretty` | Same as build but HTML is pretty-printed (for CMS template porting) |
| `bun run build -- --debug` | Same as build but JS/CSS not minified (for debugging) |
| `bun run preview` | Run production build (`BUILD_PREVIEW=true`) + serve via ngrok or cloudflared tunnel |
| `bun run serve` | Serve the production build locally |
| `bun run clean:cache` | Remove `node_modules/.cache`, `.cache`, `dist` |
| `bun run typecheck` | Run `tsc --noEmit` type checking |
| `bun run test` | Run tests via `rstest`; supports `--coverage`, `--watch` flags |
| `bun run cli` | Interactive menu for all tools (includes Test with coverage option) |

Direct tool access:

| Command | What it does |
| --- | --- |
| `bun ./scripts/generate-page.ts <name>` | Scaffold a new page with locale files for active locales |
| `bun ./scripts/generate-sitemap.ts` | Generate `public/sitemap.xml` from page directories |
| `bun ./scripts/generate-manifest.ts` | Generate `public/manifest.json` from `global.json5` + `i18nConfig` |
| `bun ./scripts/generate-robots.ts` | Generate `public/robots.txt` from `SITE_URL` |
| `bun ./scripts/generate-sw.ts` | Generate `public/sw.js` with locale-specific error page URLs |
| `bun ./packages/page-engine/cli/sync-system-pages.ts` | Rename system page folders to match locale-dependent slugs |
| `bun ./packages/i18n/cli/sync-locales.ts` | Sync missing locale directories and files from default |
| `bun ./scripts/delete-page.ts [name]` | Delete a page and its locale files across all locale directories (system pages protected) |
| `bun ./packages/i18n/cli/check-parity.ts` | Diff translation keys across all locales |
| `bun ./scripts/fetch-exchange-rates.ts` | Fetch exchange rates with 24h cache |
| `bun ./scripts/fetch-exchange-rates.ts -- --force` | Force-refresh exchange rates |
| `bun ./packages/i18n/cli/generate-types.ts` | Generate i18n types, check parity (build error on mismatch), sync i18n-ally config |
| `bun ./scripts/lighthouse.ts` | Run Lighthouse audits with interactive configuration |

## Tools

Most tools live in `scripts/`; i18n-specific CLI tools live in `packages/i18n/cli/`, page-engine CLI in `packages/page-engine/cli/`. They share modules from `scripts/lib/`:

| Module | Purpose |
| --- | --- |
| `lib/logger.ts` | Centralized `log.*()` and `logBox()` for formatted box output |
| `lib/signal-handler.ts` | SIGINT handling, `wrapMainError()`, `handleExitPromptError()`, `createServer()` with EADDRINUSE protection |
| `lib/hono-server.ts` | `createStaticApp()`, `loadHtmlCache()`, `getPageNames()` — shared Hono static server with cache headers |
| `lib/write-file.ts` | `writeFilePath()` (mkdir + write) and `generatedHeader()` for auto-generated file headers |
| `lib/romanize.ts` | `romanize()` — limax-based romanization for URL-safe slug generation from non-Latin page names |

| Tool | Shared imports | Purpose |
| --- | --- | --- |
| `cli.ts` | log, setupSigintHandler, wrapMainError | Interactive menu for all tools |
| `build.ts` | log, logBox | Production build wrapper (Rsbuild + minification) |
| `preview.ts` | log, createServer, setupSigintHandler, wrapMainError, createStaticApp | Build + serve through public tunnel |
| `serve.ts` | log, createServer, setupSigintHandler, createStaticApp, loadHtmlCache, getPageNames | Serve production build locally |
| `lighthouse.ts` | log, logBox, setupSigintHandler, wrapMainError, env.SITE_URL | Lighthouse audit runner |
| `scripts/generate-page.ts` | log | Scaffold new page with locale files |
| `packages/i18n/cli/generate-types.ts` | log, logBox, writeFilePath, generatedHeader | Generate i18n types, parity check (build error), sync i18n-ally config |
| `scripts/generate-sitemap.ts` | log, logBox, env.SITE_URL, writeFilePath | Generate sitemap.xml |
| `scripts/generate-manifest.ts` | logBox, writeFilePath | Generate manifest.json from global.json5 + i18nConfig |
| `scripts/generate-robots.ts` | logBox, env.SITE_URL, writeFilePath | Generate robots.txt from env.SITE_URL |
| `scripts/generate-sw.ts` | logBox, writeFilePath | Generate `public/sw.js` with locale-specific error page URLs |
| `packages/page-engine/cli/sync-system-pages.ts` | log, logBox, wrapMainError | Rename ALL system page folders to locale-dependent slugs when default locale changes |
| `packages/i18n/cli/sync-locales.ts` | log, logBox | Create missing locale directories; sync missing files in existing directories |
| `scripts/delete-page.ts` | log | Delete a page (folder + locale files across all locale dirs); scans for broken URL references before deletion; system pages protected |
| `packages/i18n/cli/check-parity.ts` | log | Diff translation keys across locales |
| `scripts/fetch-exchange-rates.ts` | log, writeFilePath, generatedHeader | Fetch and cache exchange rates |
| `packages/i18n/cli/watch.ts` | log, logBox, setupSigintHandler | Watch locale file changes |
| `scripts/clean-cache.ts` | log | Remove cache directories |

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
