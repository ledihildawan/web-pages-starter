# Multi-Language i18n Implementation

## Overview
Complete vanilla TypeScript implementation for multi-language websites with URL-based locale management.

## Features

### 1. URL Structure
- `/en/page` - English pages
- `/id/page` - Indonesian pages
- `/fr/page` - French pages
- `/page` - Redirects based on detection logic

### 2. Detection Priority
1. URL locale (highest priority)
2. Cookie 'lang'
3. Browser language (`navigator.language`)
4. Default locale ('id')

### 3. Core Functions

```typescript
import {
  getCurrentLocale,
  getLocaleFromURL,
  setLocaleCookie,
  switchLocale,
  getLocalizedPath,
  getAvailableLocales,
  createLanguageSwitcher,
  initI18n,
  t
} from './utils/i18n';
```

### 4. Usage Examples

#### Initialize i18n (main.ts)
```typescript
import { initI18n } from './utils/i18n';

// Auto-detect locale
await initI18n();

// Or force specific locale
await initI18n('en');
```

#### Language Switcher (Alpine.js)
```typescript
import { i18nPlugin } from './utils/i18n-alpine';

Alpine.plugin(i18nPlugin);
```

#### Template (Nunjucks)
```nunjucks
<!-- Language switcher with all locales -->
<div x-data="i18n" class="flex items-center gap-2">
  <template x-for="locale in availableLocales" :key="locale">
    <a :href="languageSwitcher[locale]">
      <span x-text="flagEmoji"></span>
    </a>
  </template>
</div>
```

#### Navigation Links
```typescript
// Current locale automatically preserved
window.location.href = getLocalizedPath('/about');

// Force specific locale
window.location.href = getLocalizedPath('en', '/about');
```

## Installation

1. Add translations to `locales/`:
   - `locales/en/translation.json`
   - `locales/id/translation.json`
   - `locales/fr/translation.json`

2. Update `vite.config.js` entry points:
```javascript
rollupOptions: {
  input: {
    main: path.resolve(__dirname, 'scripts/main.ts'),
    // ... other entries
  }
}
```

3. Initialize in `scripts/main.ts`:
```typescript
import { initI18n } from '../utils/i18n';

await initI18n();
```

## Migration from Old System

### Before (URL query parameter)
```typescript
// ❌ Old approach
const url = new URL(window.location.href);
url.searchParams.set('lang', 'en');
window.location.href = url.toString();
```

### After (URL path)
```typescript
// ✅ New approach
import { switchLocale } from './utils/i18n';
switchLocale('en');
```

## Compatibility

### Multi-Page Applications (MPA)
Works automatically - each page handles locale independently.

### Single-Page Applications (SPA)
Need to integrate with your router:

```typescript
// Example with custom router
router.beforeEach((to: any, from: any, next: any) => {
  const locale = getLocaleFromURL() || getCurrentLocale();

  if (!to.path.startsWith(`/${locale}`)) {
    next(`/${locale}${to.path}`);
  } else {
    next();
  }
});
```

## API Reference

### `getCurrentLocale(): Locale`
Returns current active locale based on detection logic.

### `getLocaleFromURL(): Locale | null`
Extracts locale from URL path, returns null if not found.

### `setLocaleCookie(locale: Locale): void`
Sets 'lang' cookie with 365-day expiration.

### `switchLocale(locale: Locale): void`
Changes locale, sets cookie, and redirects to localized path.

### `getLocalizedPath(locale: Locale, path?: string): string`
Builds localized URL path:
```typescript
getLocalizedPath('en', '/about')  // → '/en/about'
getLocalizedPath('id', '/')       // → '/id/'
```

### `getAvailableLocales(): Locale[]`
Returns array of supported locales: `['en', 'id', 'fr']`.

### `createLanguageSwitcher(currentLocale: Locale): Record<Locale, string>`
Creates object with all locale paths:
```typescript
{
  en: '/en/about',
  id: '/id/about',
  fr: '/fr/about'
}
```

### `t(key: string, options?: Record<string, any>): string`
Translation function (i18next wrapper).

## Testing

```typescript
import {
  getCurrentLocale,
  getLocalizedPath,
  switchLocale
} from './utils/i18n';

// Test locale detection
console.log(getCurrentLocale()); // 'id'

// Test path generation
console.log(getLocalizedPath('en', '/about')); // '/en/about'

// Test locale switching
// switchLocale('fr'); // Redirects to /fr/current-path
```

## Best Practices

1. **Always use utility functions** - Don't manually construct locale URLs
2. **Preserve current locale** - Use `getLocalizedPath()` without locale parameter
3. **Handle 404** - Server should redirect `/unknown-page` to `/{locale}/unknown-page`
4. **SEO** - Add `<link rel="alternate" hreflang="...">` for each locale
5. **Accessibility** - Use proper `aria-label` on language switchers

## Server Configuration

### Nginx Example
```nginx
location / {
  # Try files with locale prefix
  try_files $uri $uri/ /index.html;
}
```

### Vite Plugin Update
For SSR/SSG, update the plugin to handle locale paths:

```typescript
server.middlewares.use(async (req, res, next) => {
  const url = req.url?.split('?')[0] || '/';
  const locale = getLocaleFromURL(url) || getCurrentLocale();

  // Render with locale
  const rendered = renderTemplate({ locale, ... });
});
```
