# Web Pages Starter

> Modern Multi-Page Application framework with i18n, Inline Hydration, and Zero-Touch Automation.

Lightning-fast MPA framework built with **Rsbuild**, **Nunjucks**, **Alpine.js**, and **Tailwind CSS**. Supports **42 locales** with auto RTL, native digits, and locale-specific formatting.

---

## Quick Start

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview
```

Visit [http://localhost:8888](http://localhost:8888)

---

## Generate New Page

```bash
bun run gen:page my-page
```

Creates:
```
src/pages/my-page/
├── index.njk          # Template
├── index.json5        # Page data
├── index.ts           # Page JS
├── index.css          # Page CSS

src/locales/{locale}/my-page.json5  # 42 translation files
```

---

## Project Structure

```
src/
├── configs/           # 🔥 Single source of truth
│   ├── locales.ts      # i18n data & BCP 47 configs
│   └── paths.ts        # Path constants
├── pages/              # 🔥 Routes (auto-detected)
│   └── {page}/
│       ├── index.njk   # Template (required)
│       ├── index.json5 # Page data (optional)
│       ├── index.ts    # Page JS (optional)
│       └── index.css  # Page CSS (optional)
├── components/         # Nunjucks components
├── layouts/            # Base templates
├── locales/{locale}/   # 42 translation files
├── scripts/            # JS modules
└── styles/             # Global styles
```

---

## Key Features

### 🌍 i18n System
- **42 locales** with full translation support
- **Auto RTL** layout for Arabic/Hebrew
- **Native digits** (٠١٢٣ for Arabic, ๐๑๒๓ for Thai)
- **Locale formatting** (numbers, dates, currencies)
- **BCP 47 compliant** naming

```njk
{{ i18n.t('page.title') }}                    <!-- Translation -->
{{ i18n.formatNumber(1234.56) }}             <!-- 1,234.56 -->
{{ i18n.formatCurrency(99.99, 'USD') }}       <!-- $99.99 -->
{{ i18n.formatLocalPrice(plan) }}            <!-- Regional pricing -->
```

### 🚀 Zero-Touch Automation
- **Auto asset injection** - No manual `<link>` or `<script>` tags
- **Auto entry detection** - Every `src/pages/{folder}` becomes a route
- **Auto data injection** - `index.json5` available in templates
- **Auto locale files** - Generated for all 42 languages

### 🎨 Inline Hydration
- Clean HTML with manual tags
- i18n functions output inline `<span>` elements
- Runtime language switching without refresh
- SEO-friendly (content exists at build time)

### ⚡ Performance
- **Rsbuild** for lightning-fast builds
- **Asset hashing** for cache busting
- **Code splitting** for optimal loading
- **Image optimization** with AVIF
- **Font subsetting** for smaller files

---

## Template Usage

```njk
{% extends "main.njk" %}

{% block content %}
  <!-- Include components -->
  {% include "navbar.njk" %}
  {% include "hero.njk" %}

  <!-- Use i18n -->
  <h1>{{ i18n.html('page.title') }}</h1>
  <p>{{ i18n.t('page.description') }}</p>

  <!-- Use page data -->
  <span>{{ page.meta.title }}</span>

  <!-- Include CTA -->
  {% include "cta.njk" %}
{% endblock %}
```

---

## CLI Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server with hot reload |
| `bun run build` | Production build |
| `bun run preview` | Preview production build |
| `bun run gen:page <name>` | Generate new page |
| `bun run gen:i18n` | Generate i18n types |
| `bun run sync:locales` | Copy locale files |
| `bun run check:parity` | Check translation completeness |
| `bun run fetch:rates` | Update exchange rates |
| `bun run clean` | Clean and reinstall |

---

## i18n Quick Reference

### Supported Locales (42)

Indonesian: `id`, `id-ID`
English: `en-US`, `en-GB`, `en-AU`, `en-CA`, `en-IN`, `en-NZ`, `en-ZA`
Arabic: `ar`, `ar-SA`, `ar-AE`, `ar-EG`, `ar-MA`, `ar-TN` (RTL + Native Digits)
Chinese: `zh-CN`, `zh-HK`, `zh-SG`, `zh-TW`
And 25+ more...

### Formatting Functions

```njk
{{ i18n.formatNumber(1234.56) }}              <!-- 1,234.56 -->
{{ i18n.formatCurrency(99.99, 'USD') }}       <!-- $99.99 -->
{{ i18n.formatPercent(0.85) }}                <!-- 85% -->
{{ i18n.formatDate(new Date()) }}             <!-- 6/2/26 -->
{{ i18n.formatTime(date, 'short') }}          <!-- 1:30 PM -->
{{ i18n.formatRelativeTime(-1, {unit: 'day'}) }} <!-- 1 day ago -->
{{ i18n.formatLocalPrice(plan) }}             <!-- Auto currency by locale -->
```

### Options

```njk
{{ i18n.formatNumber(1234, {raw: true}) }}    <!-- Just "1234" -->
{{ i18n.t('page.price', {native: true}) }}     <!-- Native: ٠١٢٣٤ -->
{{ i18n.t('page.price', {universal: true}) }}  <!-- Universal: 1234 -->
{{ i18n.t('page.highlight', {className: 'text-red'}) }}
```

---

## Tech Stack

- **Build Tool:** Rsbuild v2
- **Template:** Nunjucks (autoescape disabled)
- **Reactive:** Alpine.js with plugins
- **Styling:** Tailwind CSS v4
- **i18n:** i18next with browser detector
- **Language:** TypeScript
- **Package Manager:** Bun

---

## Documentation

- **[Architecture Guide](docs/architecture.md)** - Complete system documentation
- **[i18n System Guide](docs/i18n.md)** - Internationalization details

---

## Browser Support

```
last 2 versions, not dead
Edge >= 79, Firefox >= 68, Chrome >= 80
Safari >= 13.1, iOS >= 13.4
```

---

## License

MIT
