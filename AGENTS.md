# Agents

## Setup

```bash
bun install
bun run dev        # http://localhost:8888
bun run build      # production build to ./dist
```

## Code Style

- No comments unless requested
- No deprecated code — remove entirely
- Nunjucks string concat: `~` (never `+`)
- Import paths: relative in source (`../../../../generated/*`), `@generated/*` in tsconfig/alias
- i18n CLI scripts live in `packages/i18n/cli/` (not `scripts/`)

## Build Modes

```bash
bun run build              # minified HTML + CSS/JS (default)
bun run build -- --pretty  # pretty-printed HTML for CMS template porting
bun run build -- --debug   # skip JS/CSS minify
bun run preview            # build (BUILD_PREVIEW=true) + serve via tunnel
```

Postbuild automatically restores dev stub (`generated/active-locales-data.ts` with all 136 locales).

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

## Config Files

- `configs/i18n.ts` — default locale + active locales (`defineI18n`)
- `configs/fonts.ts` — font CSS import + font stack (`defineFontStack`, `sans`/`serif`/`mono` + custom keys)
- `configs/pages.ts` — root page, system page IDs, locale-dependent slugs
- `configs/paths.ts` — filesystem path constants

## Generated Files

All 3 generated files are **tracked in git** (not gitignored):
- `generated/active-locales-data.ts` — filtered locale data (regenerated at build)
- `generated/exchange-rates.ts` — currency rates (24h cache)
- `generated/i18n.d.ts` — TypeScript key types from locale JSON

Biome is configured to skip `generated/**` (formatter + linter disabled).

## Restrictions

- **NEVER** branch, commit, push, or PR without user confirmation
- **ALWAYS** commit local fixes before pushing
- **DESTRUCTIVE git ops** (`reset --hard`, `rebase`) require `git status` first
- **File mods**: use `bun` or script in `temp/` — avoid PowerShell
- **Never add dependency** without user approval
- **After changing `i18nConfig`**: re-run `bun run dev` or `bun run build` to regenerate active locale data and exchange rates
- **Adding a locale to `LOCALES`**: also add entries to `SYSTEM_PAGE_SLUGS` in `configs/pages.ts` (getSystemPageSlug warns in dev if missing)
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
