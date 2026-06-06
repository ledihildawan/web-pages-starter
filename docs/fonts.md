# Font System

This project uses a **hybrid font loading strategy** to support 23 writing systems (Latin, CJK, Arabic, Devanagari, Thai, etc.) without bundling all font files on the first page load.

## How It Works

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Page load (refresh)                          │
│                                                                     │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────┐  │
│  │  Inline script   │    │  Static import   │    │  Preload     │  │
│  │  (template.ts)   │    │  (font-loader)   │    │  (preload)   │  │
│  └────────┬─────────┘    └────────┬─────────┘    └──────┬───────┘  │
│           │                       │                       │         │
│           ▼                       ▼                       ▼         │
│   <html lang="ja-JP">      Noto Sans Latin         <link rel=preload>│
│   data-script="cjk"        (always loaded)         noto-sans-jp.css │
│   --font-primary set                                (high priority)│
└─────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    User changes language                            │
│                                                                     │
│  Alpine store  ──►  <html lang="ar-SA">  ──►  MutationObserver     │
│   .change()          data-script="arabic"      detects change      │
│                                                                     │
│                                      ──►  Dynamic import of        │
│                                           noto-sans-arabic CSS     │
└─────────────────────────────────────────────────────────────────────┘
```

All three layers live in **one file**: `src/scripts/lib/font-loader.ts`.

## Three Layers

### 1. Static (always loaded)
The default font is bundled with the initial JS:

```ts
// src/scripts/lib/font-loader.ts
import '@fontsource-variable/noto-sans';
```

This guarantees the default locale (`id-ID` / Latin) renders correctly even before the JS bundle finishes executing.

### 2. Preload (active locale on refresh)
When the page loads with a non-default locale (e.g. `ja-JP` from localStorage), `preloadActiveFont()` adds a `<link rel="preload">` tag to `<head>` for the corresponding font CSS.

The CSS paths live in the `NOTO_SANS` map (alongside the dynamic loaders, see "Why duplicated" below):

```ts
// src/scripts/lib/font-loader.ts
const NOTO_SANS = {
  jpan: {
    css: '@fontsource-variable/noto-sans-jp/index.css',
    loader: () => import('@fontsource-variable/noto-sans-jp/index.css'),
  },
  // ...
};
```

The browser downloads the CSS (and preloads the woff2) **before** the JS finishes bootstrapping, so the font is ready when needed.

### 3. On-demand (other locales)
When the user switches to a locale whose font hasn't been loaded yet, `watchScriptAndLoadFont()` starts a `MutationObserver` on `<html lang>` and `<html data-script>`. When the user (or programmatic change) updates those attributes, the corresponding font CSS is dynamically imported.

The first switch downloads the font; subsequent switches use the browser cache.

### 4. Fallback primary font (non-Latin initial locale)
For non-Latin initial locales (e.g. `ja-JP` first visit), `loadFallbackFonts()` dynamically imports the primary font (Inter) at default weights. This handles Latin-script UI elements (buttons, navigation) that may coexist with CJK content. Skipped for Latin-based writing systems (Latin, Cyrillic, Greek, Hebrew), which use the statically loaded Noto Sans Variable instead.

## File Map

| Concern | Where |
|---------|-------|
| Primary font config (name, family, weights) | `src/configs/fonts.ts` (`FONT_STACK`) |
| Per-script Noto Sans CSS paths + dynamic loaders | `src/scripts/lib/font-loader.ts` (`NOTO_SANS`) |
| Latin-extended script loaders (uses primary font) | `src/scripts/lib/font-loader.ts` (`PRIMARY_SCRIPT_LOADERS`) |
| Per-numbering-system `fontFamily` (for `--font-primary`) | `src/configs/locales/numbering-systems.ts` (`NUMBERING_SYSTEMS`) |
| Helper to detect Latin-based writing systems | `src/scripts/lib/font-loader.ts` (`isLatinBased`) |
| Public API (called by `main.ts` and `stores/i18n.ts`) | `src/scripts/lib/font-loader.ts` |

The five public exports are:

- `preloadActiveFont()` — runs at bootstrap, emits `<link rel="preload">` for the initial locale
- `watchScriptAndLoadFont()` — starts the MutationObserver for runtime locale changes
- `setupFontStackCSS()` — sets the `--font-primary` CSS variable for the current locale
- `loadLanguageFonts()` — dynamic-imports the locale's font (called at bootstrap and on locale change)
- `loadFallbackFonts()` — dynamic-imports the primary font for non-Latin locales (called at bootstrap)

## Why is each CSS path written twice in `NOTO_SANS`?

Each entry in `NOTO_SANS` looks like:

```ts
jpan: {
  css: '@fontsource-variable/noto-sans-jp/index.css',
  loader: () => import('@fontsource-variable/noto-sans-jp/index.css'),
},
```

The string appears once in `css` (for the preload link) and once inside the loader's `import()` call. **The duplication is required for code splitting.**

`import(constVariable)` (using a top-level const for the path) makes Rsbuild/Rspack merge all 21 fonts into one CSS chunk (~226 kB loaded on the initial page). The literal string in the loader's `import()` is what lets the bundler create per-font chunks that are loaded on demand.

If you add a new entry, copy the string in both places — they must match exactly.

## Font Name Resolution

CSS uses a `--font-primary` variable that must match the `font-family` registered by `@fontsource`:

| Locale | `--font-primary` value | Package |
|--------|------------------------|---------|
| `ja-JP` | `"Noto Sans JP Variable"` | `@fontsource-variable/noto-sans-jp` |
| `zh-Hans-CN` | `"Noto Sans SC Variable"` | `@fontsource-variable/noto-sans-sc` |
| `zh-Hant-TW` | `"Noto Sans TC Variable"` | `@fontsource-variable/noto-sans-tc` |
| `ko-KR` | `"Noto Sans KR Variable"` | `@fontsource-variable/noto-sans-kr` |
| `ar-SA` | `"Noto Sans Arabic Variable"` | `@fontsource-variable/noto-sans-arabic` |
| `hi-IN` | `"Noto Sans Devanagari"` | `@fontsource/noto-sans-devanagari` |
| `th-TH` | `"Noto Sans Thai Variable"` | `@fontsource-variable/noto-sans-thai` |

This mapping is defined per `NumberingSystemCode` in `src/configs/locales/numbering-systems.ts`.

## Architecture Diagram

```
                     ┌────────────────────────────────────┐
                     │  src/configs/locales/              │
                     │  numbering-systems.ts              │
                     │                                    │
                     │  NUMBERING_SYSTEMS[                │
                     │    {                              │
                     │      code: 'jpan',                │
                     │      fontFamily:                  │
                     │        '"Noto Sans JP..."'        │ ◄── per-system font name
                     │    }                              │
                     │  ]                                │
                     └────────────┬───────────────────────┘
                                  │
                ┌─────────────────┼─────────────────────┐
                │                 │                     │
                ▼                 ▼                     ▼
       ┌─────────────┐  ┌────────────────────┐  ┌──────────────┐
       │ template.ts │  │ font-loader.ts     │  │ font-        │
       │ inline      │  │                    │  │ loader.ts    │
       │ script      │  │  NOTO_SANS map     │  │ (same file)  │
       │             │  │  PRIMARY_SCRIPT_   │  │              │
       │             │  │  LOADERS           │  │              │
       └──────┬──────┘  └────────┬───────────┘  └──────┬───────┘
              │                  │                     │
              ▼                  ▼                     ▼
       --font-primary      <link rel=preload>    import('.../index.css')
       (set via                                  (per-locale dynamic
       setupFontStackCSS)                        import on change)
```

## Troubleshooting

### Wrong font rendered (e.g. system font instead of Noto Sans JP)

**Symptom:** Switching to `ja-JP` shows text in Yu Gothic / Hiragino Sans instead of Noto Sans JP.

**Cause:** The `fontFamily` string in `NUMBERING_SYSTEMS` does not match the `font-family` declared by the `@fontsource` package.

**Fix:**
1. Open `node_modules/@fontsource-variable/noto-sans-jp/index.css`
2. Find the `@font-face { font-family: '...' }` declaration
3. Compare the font name with the `fontFamily` value in `src/configs/locales/numbering-systems.ts` for `jpan`
4. Update `fontFamily` to match exactly (including `"Variable"` suffix for variable fonts)

```ts
// src/configs/locales/numbering-systems.ts
{
  code: 'jpan',
  fontFamily: '"Noto Sans JP Variable", sans-serif', // ← must match @font-face
}
```

### Font doesn't load on page refresh

**Symptom:** Switching to `ar-SA` works, but refreshing the page shows tofu (□) for a moment before the font loads.

**Cause:** The `NOTO_SANS` map in `font-loader.ts` is missing the entry, or the active locale's numbering system isn't in the map.

**Fix:**
1. Check `localStorage.getItem('i18nextLocale')` in DevTools to confirm the stored locale
2. Verify the locale's `nativeNumberingSystem` has an entry in `NOTO_SANS`
3. If missing, add the entry with the correct package path (remember: both `css` and `loader`)

### FOUT (Flash of Unstyled Text) on language switch

**Symptom:** Brief moment where text renders in fallback font before the new font loads.

**Cause:** The dynamic import in `SCRIPT_FONT_LOADERS` hasn't run yet (first switch to a locale).

**Fix:** This is unavoidable for the first-time experience unless you preload all fonts (which inflates the bundle). The browser cache handles subsequent switches.

### "Module not found" error during build

**Symptom:** `Module not found: Can't resolve '@fontsource-variable/noto-sans-XXX'`

**Cause:** The package isn't in `package.json` dependencies, or the variable vs non-variable path is wrong.

**Fix:**
- Variable fonts: `@fontsource-variable/<name>/index.css`
- Non-variable fonts (e.g. Devanagari): `@fontsource/<name>/<weight>.css`

Add the missing package to `package.json` and run `bun install`.

### Fonts bundled into one big CSS chunk (~226 kB)

**Symptom:** The build produces a single large CSS file containing all 21 Noto Sans fonts instead of separate per-font chunks.

**Cause:** The `import()` call in a `NOTO_SANS` loader uses a variable instead of a literal string. This breaks code splitting.

**Fix:** Restore the literal string inside the `import()` call. See the "Why is each CSS path written twice?" section above.

## Adding a New Writing System

Example: Adding Bengali (`beng`).

1. **Add the package to `package.json`:**
   ```json
   "@fontsource-variable/noto-sans-bengali": "^5.2.10"
   ```

2. **Add the entry to `NUMBERING_SYSTEMS`** in `src/configs/locales/numbering-systems.ts`:
   ```ts
   {
     code: 'beng',
     label: 'Bengali',
     type: 'numeric' as const,
     writingSystem: 'bengali',
     digits: ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'],
     fontFamily: '"Noto Sans Bengali Variable", sans-serif',
   }
   ```
   (Add the corresponding `bengali` writing system to `src/configs/locales/writing-systems.ts` if it doesn't exist yet.)

3. **Add an entry to `NOTO_SANS`** in `src/scripts/lib/font-loader.ts` (remember: both `css` and `loader` need the literal string):
   ```ts
   beng: {
     css: '@fontsource-variable/noto-sans-bengali/index.css',
     loader: () => import('@fontsource-variable/noto-sans-bengali/index.css'),
   },
   ```
   The `SCRIPT_FONT_LOADERS` and `SCRIPT_FONT_CSS` maps are derived from this automatically.

4. **Add at least one locale** with `nativeNumberingSystem: NUMBERING_SYSTEM_CODE.BENG` in `src/configs/locales/data.ts`.

5. **Run `bun run build`** to verify the font bundle is created in `dist/assets/fonts/`.
