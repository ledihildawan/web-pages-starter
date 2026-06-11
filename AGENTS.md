# Agents

## Reference
- Project structure: [README.md#project-structure](README.md#project-structure)
- Tech stack, i18n, styling: [README.md#tech-stack](README.md#tech-stack)
- All commands: [README.md#commands](README.md#commands)
- TypeScript: [tsconfig.json](tsconfig.json)
- Formatting: [biome.json](biome.json)

## Conventions

### Writing Style
- Professional tone: concise, direct, to the point
- No emojis in tool output
- Imperative for user guidance, past tense for results

### Messages
- Prefix: `Error:`, `Done:`, `Warning:`
- Detail separator: ` — ` (em dash)
- Example: `Error: Please provide a page name` | `Done: Page generated`

### Generated Files
- JSDoc header: tool name, timestamp, `WARNING: DO NOT EDIT MANUALLY`
- Principle: One source of truth — each concept lives in exactly one place
