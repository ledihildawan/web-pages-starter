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
│   └── site.ts            #   ROOT_PAGE constant
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
├── components/            # 10 shared Nunjucks partials + macros
├── layouts/               # base templates (main.njk) + macros/ (page-meta.njk)
├── locales/               # translation source of truth (87 locales)
│   └── {locale}/
│       ├── common.json5   #   shared copy (nav, footer, labels, plurals)
│       ├── {page}.json5   #   page-specific copy
│       └── components/{name}.json5
├── scripts/
│   ├── lib/i18n/          #   i18n engine (20 files)
│   ├── lib/utils/         #   shared utilities (microtask queue)
│   ├── utils/             #   build-time utilities (json5, common, types)
│   └── main.ts            #   app bootstrap
├── styles/
│   └── main.css           #   Tailwind v4 entry + design tokens + component classes
├── assets/                #   images, fonts, raw assets
└── *.d.ts                 #   TS type declarations (env, global, globals, linkedom)

tools/                     #   build-time CLI scripts
  └── shared/              #   shared modules (logger, signal-handler, hono-server, site-url, write-file)
public/                    #   static assets (favicon, sw.js, generated manifest/robots/sitemap)
  └── assets/i18n/         #   pre-compiled i18n JSON bundles (generated)
generated/                 #   auto-generated (i18n.d.ts, exchange-rates.ts)
docs/                      #   documentation
```

## Pages & Routing

File-system based, zero-config routing. Drop a folder under `src/pages/` and it becomes a route. The root page (`home` by default) is output as `index.html` via the `pluginRootPageAsIndex` Rsbuild plugin.

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
bun ./tools/generate-page.ts pricing
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
| `base_path` | `process.env.BASE_PATH` | subpath prefix for asset URLs (default `/`) |
| `localeConfig` | `LOCALES` lookup | current locale's `dir`, `writingSystem`, etc. |
| `clientI18nScript` | `template.ts` | inline `<script>` for i18n bootstrap |
| `page_id` | `params.entryName` | current page identifier |

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
4. Preload active font
5. Defer font loading via `requestIdleCallback`
6. Register service worker (production only)

## Build Pipeline

### Development

```
clean:cache → fetch:rates → [watch:i18n || rsbuild dev]
```

- Rsbuild dev server on port 8888 with HMR
- File watching for `.njk`, `.json5`, `.json`, `.css` (polling 100ms)
- i18n type regeneration on locale changes

### Production

```
sync-root-page → clean:cache → fetch:rates → generate-i18n → generate-sitemap → generate-manifest → generate-robots → build
```

1. **sync-root-page** — ensures root page folder matches `ROOT_PAGE` config
2. **clean-cache** — purges `node_modules/.cache`, `.cache`, `dist`
3. **fetch-exchange-rates** — pulls live rates from Frankfurter API (24h cache)
4. **generate-i18n** — walks default locale, writes `generated/i18n.d.ts`
5. **generate-sitemap** — generates `public/sitemap.xml` from pages and `SITE_URL`
6. **generate-manifest** — generates `public/manifest.json` from `global.json5` + `i18nConfig`
7. **generate-robots** — generates `public/robots.txt` from `SITE_URL`
8. **build** — Rsbuild production bundle with:
   - JS + CSS minification
   - HTML minification (`html-minifier-terser`)
   - `home.html` → `index.html` rename (`pluginRootPageAsIndex`)
   - Image compression (AVIF, quality 75)
   - CSS inlined into HTML; small JS inlined (<2KB)
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
| Path aliases | `@/` → `src/`, `@components/`, `@assets/`, `@generated/`, `@configs/`, `@data/` |
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
| `src/configs/site.ts` | `ROOT_PAGE` — which page serves at `/` |
| `src/configs/paths.ts` | Filesystem path constants |
| `src/data/global.json5` | Site name, SEO metadata, social links, DNS/prefetch |
| `src/data/menu.json5` | Navigation structure (header menu with children) |
| `.env.development` | `NODE_ENV`, `SITE_URL`, `PORT`, `HOST` |
| `.env.production` | `NODE_ENV`, `SITE_URL` (production domain) |
| `biome.json` | Linting (Tailwind class sorting, organize imports) + formatting (2-space indent, single quotes). Overrides: `main.css` disables `noDescendingSpecificity`/`noImportantStyles`; `common.ts` disables `noExplicitAny` |
| `.vscode/settings.json` | Editor config: Biome formatter, Tailwind IntelliSense, i18n-ally, Peacock color |
| `.vscode/extensions.json` | Workspace extension recommendations (11 extensions) |
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
- `public/sw.js` — cache-first service worker with network fallback (derives `BASE_PATH` from `self.location`, precaches `index.html` and `404.html`)
- Registered automatically in production builds via `import.meta.env.BASE_PATH`
- Offline fallback to `404.html` for navigation requests

## Pre-commit Hooks

[Husky](https://typicode.github.io/husky/) + [lint-staged](https://github.com/lintstage/lint-staged) run on every commit:

1. **lint-staged** — runs `biome check --no-errors-on-unmatched --write` on staged files
2. **typecheck** — runs `bunx tsc --noEmit`

Config: `.husky/pre-commit`, `.lintstagedrc`.

## CI/CD

GitHub Actions workflows in `.github/workflows/`:

### CI (`ci.yml`)

Runs on every push and PR to `main`:

1. **checkout** — `actions/checkout@v4`
2. **setup bun** — `oven-sh/setup-bun@v2` (version 1.3.14)
3. **install** — `bun install --frozen-lockfile`
4. **biome ci** — lint + format check (no writes)
5. **build** — `bun run build` with `BASE_PATH=/web-pages-starter/`, `SITE_URL=https://ledihildawan.github.io/web-pages-starter`
6. **upload artifact** — uploads `dist/` for the deploy workflow

### Deploy (`deploy.yml`)

Runs after CI succeeds on `main`:

1. Downloads the build artifact
2. Deploys to GitHub Pages

**Setup:** repo Settings > Pages > Source must be set to **GitHub Actions** (not "Deploy from a branch").

## Testing

[Rstest](https://rstest.dev) + `happy-dom` + Testing Library.

```bash
bun test
```

Tests live in `tests/`. The setup extends `expect` with `@testing-library/jest-dom` matchers.

## Commands

| Command | What it does |
| --- | --- |
| `bun run dev` | Clean cache, fetch rates, watch JSON5, start Rsbuild dev server |
| `bun run build` | Sync root page, clean cache, fetch rates, generate i18n types, generate sitemap, manifest, robots, production build |
| `bun run preview` | Tunnel orchestrator — build and serve via ngrok or cloudflared |
| `bun run serve` | Serve the production build locally |
| `bun run clean:cache` | Remove `node_modules/.cache`, `.cache`, `dist` |
| `bun run typecheck` | Run `tsc --noEmit` type checking |
| `bun run cli` | Interactive menu for all tools |

Direct tool access:

| Command | What it does |
| --- | --- |
| `bun ./tools/generate-page.ts <name>` | Scaffold a new page with 87 locale files |
| `bun ./tools/generate-sitemap.ts` | Generate `public/sitemap.xml` from page directories |
| `bun ./tools/generate-manifest.ts` | Generate `public/manifest.json` from `global.json5` + `i18nConfig` |
| `bun ./tools/generate-robots.ts` | Generate `public/robots.txt` from `SITE_URL` |
| `bun ./tools/sync-locales.ts` | Create missing locale folders from default |
| `bun ./tools/check-locale-parity.ts` | Diff translation keys across all locales |
| `bun ./tools/fetch-exchange-rates.ts` | Fetch exchange rates with 24h cache |
| `bun ./tools/fetch-exchange-rates.ts -- --force` | Force-refresh exchange rates |
| `bun ./tools/generate-i18n.ts` | Regenerate `generated/i18n.d.ts` type definitions |
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

| Tool | Shared imports | Purpose |
| --- | --- | --- |
| `cli.ts` | log, setupSigintHandler, wrapMainError | Interactive menu for all tools |
| `build.ts` | log, logBox | Production build wrapper (Rsbuild + minification) |
| `preview.ts` | log, createServer, setupSigintHandler, wrapMainError, createStaticApp | Build + serve through public tunnel |
| `serve.ts` | log, createServer, setupSigintHandler, createStaticApp, loadHtmlCache, getPageNames | Serve production build locally |
| `lighthouse.ts` | log, logBox, setupSigintHandler, wrapMainError, SITE_URL | Lighthouse audit runner |
| `generate-page.ts` | log | Scaffold new page with locale files |
| `generate-i18n.ts` | log, logBox, writeFilePath, generatedHeader | Generate i18n TypeScript type definitions |
| `generate-sitemap.ts` | log, logBox, SITE_URL, writeFilePath | Generate sitemap.xml |
| `generate-manifest.ts` | logBox, writeFilePath | Generate manifest.json from global.json5 + i18nConfig |
| `generate-robots.ts` | logBox, SITE_URL, writeFilePath | Generate robots.txt from SITE_URL |
| `sync-root-page.ts` | log, logBox, wrapMainError | Sync root page folder with config |
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

## Browser Support

`>= 0.5%, last 2 versions, not dead, not ie 11`

## License

MIT
