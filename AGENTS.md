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

## Testing

```bash
bun run test              # all tests
bun run test -- --watch   # watch mode
bunx biome ci             # lint check (no write)
bun run typecheck         # tsc --noEmit
```

## i18n Key Patterns

```
i18n.t('home:hero.title')          → src/locales/{locale}/home.json
i18n.t('common:nav.home')          → src/locales/{locale}/common.json
i18n.t('components.cta:heading')   → src/locales/{locale}/components.cta.json
i18n.t('site_name')                → common:site_name (bare keys resolve to common)
```

## Template Conventions

- `url()` for all internal links
- `isActive()` for navbar active state
- Macros receive resolved text, not keys (except `form-input.njk`)
- Error pages: `{% set %}` + `{% include "error-page.njk" %}`
- Quick links: string-encoded `'/|home,/features|features'`

## Restrictions

- **NEVER** branch, commit, push, or PR without user confirmation
- **ALWAYS** commit local fixes before pushing
- **DESTRUCTIVE git ops** (`reset --hard`, `rebase`) require `git status` first
- **File mods**: use `bun` or script in `temp/` — avoid PowerShell
- **Never add dependency** without user approval
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
