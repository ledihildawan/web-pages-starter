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

- No comments unless requested
- No deprecated code — remove entirely
- Nunjucks string concat: `~` (never `+`)
- Import paths: `@i18n`, `@template-engine`, `@page-system`, `@config/*`, `@scripts/*`, `@utils/*`, `@generated/*` aliases used everywhere (including the rsbuild config chain). `rsbuild.config.ts` is a thin jiti wrapper that loads `configs/rsbuild.ts` with tsconfig path aliases — real config lives in `configs/rsbuild.ts`.
- i18n CLI scripts live in `packages/i18n/cli/` (not `scripts/`). Page-system CLI lives in `packages/page-system/cli/`.

## Build Modes

```bash
bun run build              # minified HTML + CSS/JS + Brotli/Gzip compression (default)
bun run build -- --pretty  # pretty-printed HTML for CMS template porting
bun run build -- --debug   # skip JS/CSS minify
bun run preview            # build (BUILD_PREVIEW=true) + serve via tunnel
```

Build pipeline: `sync-system-pages → clean-cache → fetch-exchange-rates → generate-active-locales → generate-fonts-css → sync-locales → generate-types → build.ts → subset-fonts → compress`

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
- Error pages: `{% set %}` + `{% include "shared/error/error-page.njk" %}`
- Quick links: string-encoded `'/|home,/features|features'`
- No inline `<style>` in templates — all CSS via `styles/main.css`

## Page Routing Conventions

```
pages/
  _components/     ← underscore prefix = NOT a page (skipped by scanner)
  (marketing)/     ← parentheses = group folder (stripped from URL)
    home/          ← /home
    about/         ← /about
  services/        ← nested folder = /services
    web/           ← /services/web
  blog/
    [slug]/        ← dynamic page (generates from data.json5)
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
```

- No `script.ts` → uses `shared/page-entry.ts` as fallback entry
- No `style.css` → no page-specific CSS chunk
- 0-byte `style.css` → skipped from build entries
- Bootstrap + CSS auto-injected by `packages/page-system/page-inject-loader.cjs` (no manual imports needed)

### Entry system

- `page-inject-loader.cjs` auto-injects `import '../../bootstrap'` + `import './style.css'` into every `script.ts` and `page-entry.ts`
- Bootstrap (`bootstrap.ts`) imports `main.css` + Alpine + plugins + fonts + SW
- splitChunks extracts shared bootstrap code to a single cached chunk
- Pages with small JS (< 2 KB) → inlined in HTML; larger → separate file
- Pages without `script.ts` → only shared chunk referenced, no page JS file

## Config Files

- `configs/i18n.ts` — default locale + active locales (`defineI18n`)
- `configs/fonts.ts` — font stack config (`defineFontStack`). Font CSS imported via `bootstrap.ts` (not here directly)
- `configs/env.ts` — env config: schema keys array + `readEnv()` (sync, no Zod on client). Manual type coercion for PORT (number), MINIFY/BUILD_PREVIEW/PRETTY_HTML (boolean). Defaults: `MINIFY=true`, `BUILD_PREVIEW=false`, `PRETTY_HTML=false`. All values from `.env` (general) + `.env.{stage}` (stage-specific). Stage pipeline: `dev → qa → uat → preprod → prod`
- `packages/env/` — env engine: `readEnv(keys)` reads `process.env` (server) or `import.meta.env` (client via Rsbuild define). Sync — no top-level await. Server env file loading via `packages/env/server.ts` (`loadServerEnvFiles()`)
- `shared/env-preload.ts` — Bun preload script (`bunfig.toml`), loads `.env` + `.env.{stage}` into `process.env` before any module runs
- `bunfig.toml` — `preload = ["./shared/env-preload.ts"]`
- `.env` — general defaults shared across all stages. Required. Real file gitignored, `.env.example` template git-tracked
- `.env.{stage}` — per-stage overrides (stage-specific keys: `STAGE`, `NODE_ENV`, `SITE_URL`, `BASE_PATH`, optional secrets). Active: `.env.dev`, `.env.prod`. Templates: `.env.{stage}.example` (git-tracked). Real files gitignored. Stage pipeline: `dev → qa → uat → preprod → prod`
- `configs/rsbuild.ts` — Rsbuild build configuration (loaded via the jiti wrapper in `rsbuild.config.ts`). Includes splitChunks cacheGroups, resource hints plugin, page-inject-loader rule
- `configs/paths.ts` — `ROOT_PATH` + `resolveRoot()` centralizes all path resolution

## Packages

- `packages/env/` — env engine (readEnv, server loader). No Zod dependency. Sync readEnv.
- `packages/i18n/` — i18n engine (data, formatting, runtime, strategies, fonts). Pure engine — ZERO imports from `configs/` or `page-system` in runtime.
- `packages/template-engine/` — SSR template rendering (`createTemplateParams`, `scanSharedLocales`). Depends on `@i18n` + `@page-system`.
  - `template.ts` — SSR rendering: `createTemplateParams()`, `generateClientI18nScript()`, `scanSharedLocales()`
- `packages/page-system/` — page system (scanner, system pages, dynamic routes, CLI, page-inject-loader). Standalone.
  - `system-pages.ts` — root page, system page IDs, locale-dependent slugs (`ROOT_PAGE`, `SYSTEM_PAGE_IDS`, `SYSTEM_PAGE_SLUGS`)
  - `scanner.ts` — `scanPages()`, `isGroup()`, `isSlugDir()` (jiti-safe)
  - `dynamic-routes.ts` — `generateDynamicEntries()` — [slug] discovery from `data.json5`
  - `page-inject-loader.cjs` — auto-injects bootstrap + page CSS into entry files
  - `cli/` — `sync-system-pages.ts`, `generate-page.ts`, `delete-page.ts`

## Build Optimizations

- **splitChunks**: `minSize: 0` + `default` cacheGroup with `minChunks: 2` — extracts shared bootstrap to single cached chunk
- **Brotli + Gzip**: `scripts/compress.ts` generates `.br` + `.gz` files post-build
- **Font subsetting**: `scripts/subset-fonts.ts` uses `pyftsubset` to strip hinting/tables
- **Resource hints**: `pluginResourceHints` injects modulepreload, LCP image preload
- **CSS**: render-blocking (`rel="stylesheet"`), minified in production
- **JS**: `sideEffects: true` for `bootstrap.ts` + `script.ts` (prevent tree-shaking of entry files)
- **Single-locale i18n skip**: stub Alpine store, skip i18next init when only 1 locale
- **Service Worker v6**: stale-while-revalidate for assets, network-first for navigation

## Generated Files

All 3 generated files are **tracked in git** (not gitignored):
- `generated/active-locales-data.ts` — filtered locale data (always uses `i18nConfig.locales`, no dev stub)
- `generated/exchange-rates.ts` — currency rates (24h cache)
- `generated/i18n.d.ts` — TypeScript key types from locale JSON

Biome is configured to skip `generated/**` (formatter + linter disabled).

## Restrictions

- **NEVER** branch, commit, push, or PR without user confirmation
- **ALWAYS** commit local fixes before pushing
- **DESTRUCTIVE git ops** (`reset --hard`, `rebase`) require `git status` first
- **File mods**: use `bun` or script in `temp/` — avoid PowerShell
- **Never add dependency** without user approval
- **After changing `i18nConfig`**: re-run `bun run dev` or `bun run build` to regenerate active locale data, font CSS, and exchange rates
- **Adding a locale to `LOCALES`**: also add entries to `SYSTEM_PAGE_SLUGS` in `packages/page-system/system-pages.ts` (getSystemPageSlug warns in dev if missing)
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
