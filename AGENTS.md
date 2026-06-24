# Agents

## Setup

```bash
bun install
bun run dev        # http://localhost:8888
bun run build      # production build to ./dist
```

Requires [Python 3](https://python.org) with `fonttools` + `brotli` (`pip install fonttools brotli`) for font subsetting.

## Simplicity First

- Prefer the simplest solution that correctly solves the problem.
- Do not over-engineer.
- Avoid unnecessary abstractions, dependencies, and architectural complexity.
- Favor readability, maintainability, and clarity.
- Every added layer of complexity must have a clear and documented benefit.

## Documentation First

- Always use the official documentation as the primary source of truth.
- Never invent, assume, or hallucinate APIs, functions, configuration options, behaviors, or features.
- Verify all code examples, API names, parameters, return values, and configuration options against the official documentation before using them.
- If the official documentation does not mention a feature, assume it does not exist.
- If the required information cannot be found in the official documentation, explicitly state that it could not be verified.
- Prefer saying "I don't know" over providing unverified information.
- Do not rely solely on model memory when official documentation is available.
- When documentation links are provided, review them before generating code, explanations, or recommendations.

## Constrained Creativity

- You may propose alternative implementations, improvements, refactoring ideas, or architectural suggestions.
- Any proposed solution must remain compatible with the documented APIs and features.
- Do not invent new APIs, methods, configuration options, or framework capabilities.
- Creative solutions are allowed only within the constraints of the official documentation.
- Before suggesting an approach, verify that it can be implemented using documented functionality.
- If an idea requires undocumented behavior, clearly label it as an assumption and do not present it as a valid implementation.

## Code Style

* **General:**
  * No comments unless explicitly requested.
  * Remove all deprecated code entirely.
  * Write modern JS/TS (ECMAScript 2022+). No CommonJS, polyfills, or legacy patterns.
* **Nunjucks:** Use `~` for string concatenation (never `+`).
* **Project Structure:**
  * **CLI Scripts:** Must reside in their respective package folders (e.g., `packages/i18n/cli/`, `packages/env/cli/`), not in a global `scripts/` directory.
  * **Rsbuild Config:** `rsbuild.config.ts` is strictly a Jiti wrapper. The actual configuration lives in `configs/rsbuild.ts`.
* **Imports & Path Aliases:**
  * Use predefined aliases everywhere (`@i18n`, `@template-engine`, `@page-system`, `@config/*`, `@cli/*`, `@core/*`, `@constants/*`, `@utils/*`, `@shared/*`, `@shared/ui/*`, `@generated/*`, `@assets/*`, `@data/*`, `@dist/*`, `@locales/*`, `@pages/*`, `@public/*`, `@layouts/*`).
  * Use `@generated/env` for environment imports (never `@utils/env`).
  * Use `@generated/paths` for path helpers (`lookup()`, `find()`, `alias`).
  * `tsconfig.json` is the single source of truth for aliases (`packages/cli/generators/paths.ts` reads and auto-derives them into `generated/paths.ts` for Jiti/bundlers).


## Build Modes

```bash
bun run build              # minified HTML + CSS/JS + Brotli/Gzip compression (default)
bun run build -- --pretty  # pretty-printed HTML + CSS external in /assets/styles/ + JS not minified
bun run build -- --debug   # skip JS/CSS minify
bun run preview            # build (BUILD_PREVIEW=true, SITE_URL=tunnel) + serve via tunnel
bun run cli                # interactive CLI menu (all available commands)
bun run clean:cache        # remove temp/pipeline cache
```

**CLI menu** (`bun run cli`) — flat list, single-step navigation:

```
  Web Pages Starter CLI
  ---------------------

  [ Develop ]
    1. Dev Server         Start dev server with hot reload
    2. Test               Run unit tests

  [ Build ]
    3. Production Build   Minified production build
    4. Pretty Build      Beautified HTML + external CSS for inspection
    5. Debug Build       No minification, source maps enabled
    6. Preview Tunnel    Build + tunnel preview (ngrok/cloudflared)
    7. Serve Dist        Build + serve production dist locally

  [ Pages ]
    8. Generate Page     Scaffold a new page with locale files
    9. Delete Page       Remove a page and its locale files

  [ i18n ]
   10. Check Parity      Verify translation key parity across locales
   11. Sync Locales      Sync missing keys from default locale

  [ Performance ]
   12. Lighthouse        Run Lighthouse audit (desktop + mobile)

  [ Utilities ]
   13. Subset Fonts     Regenerate subsetted font files
   14. Clean Cache      Remove temp/pipeline cache
   15. Lint             Run biome linter
   16. Typecheck        Run TypeScript checker
```

Pretty mode (`--pretty`):
- HTML beautified with 2-space indent via `js-beautify`
- CSS stays external in `/assets/styles/` (not inlined into `<style>`)
- LightningCSS targets: `Chrome >= 111, Safari >= 15.4, Firefox >= 113, Edge >= 111`
- Color features excluded: `labColors`, `oklabColors`, `p3Colors`, `colorFunction` (eliminates hex+lab duplicates)
- CSS minified (LightningCSS default), JS not minified
- Source maps enabled for debugging
- `preload-chunks` still runs normally

Build pipeline: `generate-paths → generate-pricing-types → generate-env → generate-active-locales → sync-system-pages → fetch-exchange-rates → generate-fonts-css → subset-fonts → sync-locales → generate-types → generate-images → [rsbuild-wrapper] → [copy-locale-assets]`

**SERVE generators** (run inside rsbuild-wrapper before rsbuild): `generate-sitemap → generate-manifest → generate-robots → generate-service-worker`

**rsbuild-wrapper** runs rsbuild then applies post-build steps in order: `copy-to-dist → root-page-as-index → pretty-html → inline-css → preload-chunks → compress`

Cache behavior:
- Cache hit (marker exists + hash matches + dist exists): silent exit, no output
- Rebuild triggers: dist missing, source changed, or FORCE_REBUILD=true

## Testing

Tests are colocated with source in `__tests__/` directories:

```bash
bun run test              # all tests (auto-discovers __tests__/**/*.test.ts)
bun run test -- --watch   # watch mode
bunx biome ci             # lint check (no write)
bun run typecheck         # tsc --noEmit
```

Tests use native rstest assertions (`expect().not.toBeNull()`, `.toBe()`, etc.) — no jest-dom matchers.

## i18n Key Patterns

```
i18n.t('home:hero.title')          → locales/{locale}/home.json
i18n.t('common:nav.home')          → locales/{locale}/common.json
i18n.t('cta:heading')              → locales/{locale}/cta.json
i18n.t('site_name')                → common:site_name (bare keys resolve to common)
```

Shared locales are auto-detected by scanning templates for `i18n.t('namespace:...')` usage. No declaration needed.

## Template Conventions

- `url()` for all internal links (no `.html` extension — clean URLs)
- `isActive()` for navbar active state (normalizes `.html` and `/index`)
- Macros receive resolved text, not keys (except `form-input.njk`)
- Error pages: `{% set %}` + `{% include "shared/ui/patterns/error-page.njk" %}`
- Quick links: string-encoded `'/|home,/features|features'`
- No inline `<style>` in templates manually — all CSS via `styles/main.css`. CSS is auto-inlined post-build by `inlineCssOnDist()` in rsbuild-wrapper (production only; pretty mode keeps CSS external in `/assets/styles/`).

## Page Routing Conventions

```
pages/
  _ui/            ← underscore prefix = NOT a page (page-local UI)
  _features/      ← underscore prefix = NOT a page (page-local capability modules)
  (marketing)/   ← parentheses = group folder (stripped from URL)
    home/         ← /home
    about/        ← /about
  services/       ← nested folder = /services
    web/          ← /services/web
  blog/
    [slug]/       ← dynamic page (generates from data.json5)
      index.njk
    data.json5     ← { items: [{ slug: "getting-started", title: "..." }] }
```

### Page file convention (traditional web inspired)

Each page folder contains optional files — only `index.njk` is required:

```
pages/home/
  index.njk        ← template (required, like index.html)
  script.ts        ← page-specific JS (optional, like script.js)
  style.css        ← page-specific CSS (optional, like style.css)
  data.json5       ← page metadata: page_id, SEO (optional)
  _ui/            ← page-local UI components (underscore = not a page)
  _features/      ← page-local capability modules (underscore = not a page)
```

- No `script.ts` → no page JS loaded
- No `style.css` → no page-specific CSS chunk
- 0-byte `style.css` → skipped from build entries
- Bootstrap + CSS auto-injected by `packages/page-system/page-inject-loader.cjs` (no manual imports needed)

### Entry system

- `page-inject-loader.cjs` auto-injects bootstrap + CSS into every page entry via loader options
- Bootstrap (`scripts/bootstrap.ts`) imports `main.css` + Alpine + plugins + fonts + SW
- `splitChunks.bootstrap` extracts bootstrap to a separate cached chunk to prevent duplication across pages
- Pages with small JS (< 2 KB) → inlined in HTML; larger → separate file
- Pages without `script.ts` → only shared bootstrap chunk referenced, no page JS file

## Config Files

- `configs/i18n.ts` — default locale + active locales (`defineI18n`)
- `configs/fonts.ts` — font stack config (`defineFontStack`). Font CSS imported via `bootstrap.ts` (not here directly)
- `generated/env.ts` — fully generated env system: schema + engine + validation + singleton. Auto-generated from `.env` files by `packages/env/cli/generate-env.ts`. Reads `process.env` (server) or `import.meta.env` (browser). Runtime type validation with warnings. `PRIVATE_` prefix marks server-only keys (browser-safe by default). Stage pipeline: `dev → qa → uat → preprod → prod`
- `packages/env/preload.ts` — Bun preload script (`bunfig.toml`), loads `.env` + `.env.{stage}` into `process.env` before any module runs
- `bunfig.toml` — `preload = ["./packages/env/preload.ts"]`
- `.env` — general env vars shared across all stages. Required. Gitignored. `PRIVATE_` prefix = server-only (not exposed to browser). No prefix = browser-safe (public by default). Edit this file to add/change env vars — `packages/env/cli/generate-env.ts` auto-generates `generated/env.ts` from it
- `.env.{stage}` — per-stage overrides. Active: `.env.dev`, `.env.prod`. Gitignored. Stage pipeline: `dev → qa → uat → preprod → prod`
- `configs/rsbuild.ts` — Rsbuild build configuration (loaded via the jiti wrapper in `rsbuild.config.ts`). Includes `pluginHotReloadContent` (actual RsbuildPlugin that adds contextDependencies for HMR), splitChunks cacheGroups (CHUNK_NAMES constant), htmlPlugin minification config, lightningcssLoader config, and page-inject-loader for bootstrap/CSS injection. Path aliases from `tsconfig.json` via `generated/paths.ts`. `import.meta.env` define includes `SINGLE_LOCALE`, `DEFAULT_LOCALE`, `FLAG_CDN_BASE`.
- `generated/paths.ts` — auto-generated alias type + map + `lookup()`/`find()` helpers. Reads `tsconfig.json` paths. Single source of truth: edit `tsconfig.json` paths → jiti + bundler auto-sync.

## Packages

- `@web-pages-starter/core` — base utilities (json5, pathe, logger, signal-handler, pipeline-cache). No external dependencies.
- `@web-pages-starter/fonts` — @fontsource/* packages (24 font packages). Depends on `@web-pages-starter/core` + `@web-pages-starter/i18n` (for locale/writing-system data).
- `@web-pages-starter/i18n` — i18n engine (data, formatting, runtime, strategies). Pure engine — ZERO imports from `configs/` or `page-system` in runtime. Depends on `@web-pages-starter/core`.
- `@web-pages-starter/page-system` — page system (scanner, system pages, dynamic routes, CLI, page-inject-loader). Standalone. Depends on `@web-pages-starter/core` + `@web-pages-starter/i18n`.
- `@web-pages-starter/template-engine` — SSR template rendering (`createTemplateParams`, `scanSharedLocales`). Depends on `@web-pages-starter/core` + `@web-pages-starter/i18n` + `@web-pages-starter/page-system`.
- `@web-pages-starter/cli` — CLI tools (inquirer, js-beautify, sharp, @ngrok/ngrok). Depends on all packages.
- `packages/env/` — env system. Auto-generates `generated/env.ts` from `.env` files. `PRIVATE_` prefix = server-only.
  - `cli/generate-env.ts` — scans `.env` files, infers types, generates schema + engine
  - `preload.ts` — Bun preload script (`bunfig.toml`), loads `.env` before any module

## Build Optimizations

- **splitChunks**: 6 cacheGroups — `bootstrap` (enforce, priority 40), `i18next` (enforce, priority 30), `alpinePlugins` (async, priority 25), `alpineCore` (enforce, priority 20), `i18nFormatters` (async, priority 15), `vendors` (priority 5), `default` (`minChunks: 2`, priority -10). `minSize: 20000` (webpack default). `enforce: true` ensures critical chunks always split regardless of size.
- **CSS inlining**: `inlineCssOnDist()` function in rsbuild-wrapper post-builds converts all `<link rel="stylesheet">` to `<style nonce="...">` with relative URL rewriting. Eliminates render-blocking CSS requests. Skipped in pretty mode (CSS stays external). Nonce extracted from CSP meta tag.
- **JS chunk preload**: `preloadChunksOnDist()` function in rsbuild-wrapper scans for named chunks (matching `CHUNK_NAMES`), adds `<link rel="preload" as="script">` for chunks NOT already in `<script defer>`. Uses `preload` (not `modulepreload`) for HTTP cache dedup with rspack's classic script loading.
- **Font woff2 preload**: Generated by template engine (`template.ts`) from `fontsConfig.sans.name`. Reads `fonts.css` at SSR time, extracts latin woff2 URL, passes as `font_preload_url` template param → `<link rel="preload" as="font">` in `main.njk`.
- **webpackPreload magic comments**: `bootstrap.ts` dynamic imports use `/* webpackPreload: true */` for critical chunks (alpine, i18next, i18n-formatters).
- **Brotli + Gzip**: `packages/cli/generators/compress.ts` generates `.br` + `.gz` files post-build
- **Font subsetting**: `packages/cli/generators/subset-fonts.ts` uses `pyftsubset` (fonttools CLI) to strip hinting and unused OpenType tables from woff2 files
- **JS**: `sideEffects: true` for `bootstrap.ts` + `script.ts` (prevent tree-shaking of entry files)
- **Single-locale i18n skip**: stub Alpine store, skip i18next init when only 1 locale
- **Alpine.start() decoupled**: For default locale, Alpine starts immediately without waiting for i18next init (background). For non-default locales, waits for `initIntl()` to prevent flash of wrong language.
- **Service Worker v6**: stale-while-revalidate for assets, network-first for navigation
- **Tailwind v4 theme pruning**: `@theme` disables unused utility namespaces (`--perspective-*`, `--drop-*`, `--inset-shadow-*`, `--grayscale-*`, `--invert-*`, `--saturate-*`, `--sepia-*`, `--contrast-*`, `--brightness-*`, `--hue-rotate-*`, `--outline-*`, `--skew-*`)
- **OKLCH colors**: All CSS colors use `oklch()`. No hex or rgba for colored values. Neutral black/white `rgba()` acceptable. Lightning CSS generates sRGB fallbacks automatically.

## Generated Files

All generated files are **tracked in git** (not gitignored):
- `generated/env.ts` — auto-generated env system (schema + engine + validation). Regenerated from `.env` files by `packages/env/cli/generate-env.ts`
- `generated/active-locales-data.ts` — filtered locale data (always uses `i18nConfig.locales`, no dev stub)
- `generated/exchange-rates.ts` — currency rates (24h cache)
- `generated/i18n.d.ts` — TypeScript key types from locale JSON
- `generated/image-manifest.ts` — image manifest
- `generated/paths.ts` — alias type + map + `lookup()`/`find()` path helpers

Biome is configured to skip `generated/**` (formatter + linter disabled).

### Comment headers

All generated files include a standard header comment via `generatedHeader()` from `@core/utils/write-file`:

```
/**
 * Generated by: <generator-script-path>
 * Generated at: <ISO-timestamp>
 *
 * WARNING: DO NOT EDIT MANUALLY
 * This file is automatically updated.
 */
```

Files in `COMMENT_EXCLUDED_FILES` (in `@core/utils/write-file`) are excluded from comment headers — these are SEO/browser-critical files served directly to clients/crawlers: `sitemap.xml`, `robots.txt`, `manifest.json`, `favicon.svg`, `og-image.svg`. Use `shouldAddComment(filePath)` to check before adding a header.

### Generator templates

Generators use templates from `packages/cli/templates/`:
- Templates are loaded directly via `fs.readFileSync` with relative paths
- `inject(template, values)` — replaces `{{codegen:key}}` placeholders with values

Templates: `paths.ts`, `env.ts`, `service-worker.js`, `sitemap.xml`, `manifest.json`, `robots.txt`. Templates that support comments embed the header with `{{codegen:generated_at}}` as the timestamp placeholder.

## Shared Constants

- `shared/constants/asset-paths.ts` — `ASSET_PATHS` (locales, fonts, fontsCss, images, scripts, styles). Import via `@shared/constants` or `@constants` barrel.
- `shared/constants/public-filenames.ts` — `PUBLIC_FILENAMES` (serviceWorker, robots, sitemap, manifest, faviconSvg, faviconIco), `PUBLIC_DIRS` (locales, assets, fonts, images). Import via `@shared/constants` or `@constants` barrel.
- `packages/i18n/constants.ts` — `DEFAULT_NAMESPACE` (`'common'`), `CSP_NONCE_PLACEHOLDER`. Imported via `@i18n` barrel.
- `packages/page-system/system-pages.ts` — `FALLBACK_LOCALE` (derived from `i18nConfig.defaultLocale`) for slug lookup fallback.
- `configs/rsbuild.ts` — `CHUNK_NAMES` constant (shared between splitChunks cacheGroups + `preloadChunksOnDist()` in rsbuild-wrapper).
- `shared/utils/write-file.ts` — `COMMENT_EXCLUDED_FILES` (files excluded from comment headers). Values sourced from `PUBLIC_FILENAMES`.

## Restrictions

- **NEVER** branch, commit, push, or PR without user confirmation
- **ALWAYS** commit local fixes before pushing
- **DESTRUCTIVE git ops** (`reset --hard`, `rebase`) require `git status` first
- **File mods**: use `bun` or script in `temp/` — avoid PowerShell
- **Never add dependency** without user approval
- **After changing `i18nConfig`**: re-run `bun run dev` or `bun run build` to regenerate active locale data, font CSS, and exchange rates
- **Adding a locale to `LOCALES`**: also add entries to `SYSTEM_PAGE_SLUGS` in `packages/page-system/system-pages.ts` (getSystemPageSlug warns in dev if missing). `FALLBACK_LOCALE` auto-derives from `i18nConfig.defaultLocale`.
- **No hardcoded values**: all config must be dynamic. Font names from `fontsConfig`, locale codes from `i18nConfig`, chunk names from `CHUNK_NAMES`, namespaces from `DEFAULT_NAMESPACE`, asset paths from `I18N_ASSET_DIR`/`FONTS_CSS_PATH`. Flag CDN from `global.json5` → `import.meta.env.FLAG_CDN_BASE`.
- Husky pre-commit: Biome → typecheck → test (all must pass)

## CI Fixes Flow

1. `bunx biome ci` / `bun run typecheck` / `bun run test`
2. Fix errors immediately
3. Re-run to confirm pass
4. Commit fix before push — never leave fixes dangling

## Reference

- Full docs: [README.md](README.md)
- i18n system: [docs/i18n.md](docs/i18n.md)
- Tech stack, commands: [README.md#tech-stack](README.md#tech-stack), [README.md#commands](README.md#commands)
