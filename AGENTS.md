# Agents

## Reference
- Project structure: [README.md#project-structure](README.md#project-structure)
- Tech stack, i18n, styling: [README.md#tech-stack](README.md#tech-stack)
- All commands: [README.md#commands](README.md#commands)
- TypeScript: [tsconfig.json](tsconfig.json)
- Formatting: [biome.json](biome.json)

## Git Policy

- **NEVER** create branches, commit, stage files, push, or create PRs to origin without explicit user confirmation
- Always present the planned git actions first and wait for approval before executing
- **ALWAYS commit local fixes before pushing** — if CI errors are found and fixed locally, commit the fix before pushing. Do not leave fixes dangling in the working tree.

## CI Fixes Flow

1. Run `bunx biome ci` (and other CI checks) to verify changes
2. If errors found: fix them immediately
3. Re-run CI to confirm pass
4. Commit the fix before pushing or starting new work
5. Never push with uncommitted changes that contain fixes for issues found in the same session

## Conventions

### Writing Style

#### Docs
- Principle: One source of truth — each concept lives in exactly one place
- Professional tone: concise, direct, to the point
- Imperative for user guidance, past tense for results

#### Code
- No comments unless explicitly requested
- Let the code speak for itself — naming and structure over explanation

#### Messages
- No emojis in tool output
- Prefix: `Error:`, `Done:`, `Warning:`
- Detail separator: ` — ` (em dash)
- Example: `Error: Please provide a page name` | `Done: Page generated`

### Generated Files
- File header: tool name, timestamp, `WARNING: DO NOT EDIT MANUALLY` — applies to `tools/generate-*.ts` output files that support comments (e.g. `generated/*.ts`, `generated/*.js`, `generated/*.css`, `generated/*.html`)
