# Font System

This project uses a **hybrid font loading strategy** to support 22 writing systems (Latin, CJK, Arabic, Devanagari, Thai, etc.) without bundling 32MB of fonts on the first page load.

## How It Works

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Page load (refresh)                          │
│                                                                     │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────┐  │
│  │  Inline script   │    │  Static imports  │    │  Preload     │  │
│  │  (template.ts)   │    │  (main.ts)       │    │  (preloader) │  │
│  └────────┬─────────┘    └────────┬─────────┘    └──────┬───────┘  │
│           │                       │                       │         │
│           ▼                       ▼                       ▼         │
│   <html lang="ja-JP">      Noto Sans Latin       <link rel=preload>│
│   data-script="cjk"        (always loaded)        noto-sans-jp.css │
│   --font-primary set                                (high priority)│
│                                                                     │
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

## Three Layers

### 1. Static (always loaded)
The default font is bundled with the initial JS:

```ts
// src/scripts/main.ts
import '@fontsource-variable/noto-sans';
```

This guarantees the default locale (`id-ID` / Latin) renders correctly even before the JS bundle finishes executing.

### 2. Preload (active locale on refresh)
When the page loads with a non-default locale (e.g. `ja-JP` from localStorage), a `<link rel="preload">` tag is added to `<head>` for the corresponding font CSS:

```ts
// src/scripts/lib/font-preloader.ts
const PRELOAD_FONTS: Partial<Record<NumberingSystemCode, string>> = {
  jpan: '@fontsource-variable/noto-sans-jp/index.css',
  hans: '@fontsource-variable/noto-sans-sc/index.css',
  // ...
};
```

The browser downloads the CSS (and preloads the woff2) **before** the JS finishes bootstrapping, so the font is ready when needed.

### 3. On-demand (other locales)
When the user switches to a locale whose font hasn't been loaded yet, a MutationObserver detects the `lang` or `data-script` attribute change and triggers a dynamic import:

```ts
// src/scripts/lib/font-watcher.ts
const SCRIPT_FONT_LOADERS = {
  jpan: () => import('@fontsource-variable/noto-sans-jp/index.css'),
  arab: () => import('@fontsource-variable/noto-sans-arabic/index.css'),
  // ...
};

const observer = new MutationObserver((mutations) => {
  // When <html lang> changes, dynamically import the new font
});
```

The first switch downloads the font; subsequent switches use the browser cache.

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

This mapping is defined per `NumberingSystemCode` in `src/configs/locales.ts`. To add a new writing system, add an entry to `NUMBERING_SYSTEMS` with the correct `fontFamily` and a loader to both `SCRIPT_FONT_LOADERS` (in `font-watcher.ts`) and `PRELOAD_FONTS` (in `font-preloader.ts`).

## Architecture Diagram

```
                    ┌──────────────────────────────┐
                    │   src/configs/locales.ts     │
                    │                              │
                    │  NUMBERING_SYSTEMS[          │
                    │    {                        │
                    │      code: 'jpan',          │
                    │      fontFamily:            │
                    │        '"Noto Sans JP..."'  │ ◄── single source of truth
                    │    }                        │
                    │  ]                          │
                    └──────────────┬───────────────┘
                                   │
                  ┌────────────────┼────────────────┐
                  │                │                │
                  ▼                ▼                ▼
         ┌─────────────┐  ┌──────────────┐  ┌──────────────┐
         │ template.ts │  │ font-        │  │ font-        │
         │ inline      │  │ preloader.ts │  │ watcher.ts   │
         │ script      │  │              │  │              │
         └──────┬──────┘  └──────┬───────┘  └──────┬───────┘
                │                │                │
                ▼                ▼                ▼
         --font-primary    <link rel=     import('.../index.css')
                          preload>
```

## Troubleshooting

### Wrong font rendered (e.g. system font instead of Noto Sans JP)

**Symptom:** Switching to `ja-JP` shows text in Yu Gothic / Hiragino Sans instead of Noto Sans JP.

**Cause:** The `fontFamily` string in `NUMBERING_SYSTEMS` does not match the `font-family` declared by the `@fontsource` package.

**Fix:**
1. Open `node_modules/@fontsource-variable/noto-sans-jp/index.css`
2. Find the `@font-face { font-family: '...' }` declaration
3. Compare the font name with the `fontFamily` value in `src/configs/locales.ts` for `jpan`
4. Update `fontFamily` to match exactly (including `"Variable"` suffix for variable fonts)

```ts
// src/configs/locales.ts
{
  code: 'jpan',
  fontFamily: '"Noto Sans JP Variable", sans-serif', // ← must match @font-face
}
```

### Font doesn't load on page refresh

**Symptom:** Switching to `ar-SA` works, but refreshing the page shows tofu (□) for a moment before the font loads.

**Cause:** The `PRELOAD_FONTS` map in `font-preloader.ts` is missing the entry, or the active locale's numbering system isn't in the map.

**Fix:**
1. Check `localStorage.getItem('i18nextLocale')` in DevTools to confirm the stored locale
2. Verify the locale's `nativeNumberingSystem` is in `PRELOAD_FONTS`
3. If missing, add the entry with the correct package path

### FOUT (Flash of Unstyled Text) on language switch

**Symptom:** Brief moment where text renders in fallback font before the new font loads.

**Cause:** The dynamic import in `SCRIPT_FONT_LOADERS` hasn't run yet (first switch to a locale).

**Fix:** Add the entry to `PRELOAD_FONTS` so the font is preloaded on the next page refresh. For the first-time experience, this is unavoidable unless you preload all fonts (which inflates the bundle).

### "Module not found" error during build

**Symptom:** `Module not found: Can't resolve '@fontsource-variable/noto-sans-XXX'`

**Cause:** The package isn't in `package.json` dependencies, or the variable vs non-variable path is wrong.

**Fix:**
- Variable fonts: `@fontsource-variable/<name>/index.css`
- Non-variable fonts (e.g. Devanagari): `@fontsource/<name>/<weight>.css`

Add the missing package to `package.json` and run `bun install`.

## Adding a New Writing System

Example: Adding Bengali (`beng`).

1. **Add the package to `package.json`:**
   ```json
   "@fontsource-variable/noto-sans-bengali": "^5.2.10"
   ```

2. **Add the entry to `NUMBERING_SYSTEMS`** in `src/configs/locales.ts`:
   ```ts
   {
     code: 'beng',
     label: 'Bengali',
     writingSystem: WRITING_SYSTEM.BENGALI,
     digits: ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'],
     fontFamily: '"Noto Sans Bengali Variable", sans-serif',
   }
   ```

3. **Add to `SCRIPT_FONT_LOADERS`** in `src/scripts/lib/font-watcher.ts`:
   ```ts
   beng: () => import('@fontsource-variable/noto-sans-bengali/index.css'),
   ```

4. **Add to `PRELOAD_FONTS`** in `src/scripts/lib/font-preloader.ts`:
   ```ts
   beng: '@fontsource-variable/noto-sans-bengali/index.css',
   ```

5. **Add at least one locale** with `nativeNumberingSystem: NUMBERING_SYSTEM_CODE.BENG` in `LOCALES` (in `src/configs/locales/data.ts`).

6. **Run `bun run build`** to verify the font bundle is created in `dist/assets/fonts/`.
