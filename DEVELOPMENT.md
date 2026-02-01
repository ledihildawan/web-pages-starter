# Development Guide

## Quick Start

```bash
npm run dev    # Start development server
npm run build  # Build for production
```

## Creating New Pages

Adding a new page is simple - just create a new directory under `pages/`:

```
pages/
├── home/
│   ├── home.njk
│   ├── home.ts
│   └── home.css
├── about/
│   ├── about.njk
│   ├── about.ts
│   └── about.css
└── your-page/      # ← Add your new page here
    ├── your-page.njk
    ├── your-page.ts
    └── your-page.css
```

### Example: Adding "Contact" page

1. Create directory:
```bash
mkdir pages/contact
```

2. Create `pages/contact/contact.njk`:
```nunjucks
{% extends "./../../layouts/base.njk" %}
{% block styles %}
  <link rel="stylesheet" href="{{ cssPath }}">
{% endblock styles %}
{% block content %}
  <section class="min-h-screen">
    <h1>Contact Us</h1>
    <p>Your content here</p>
  </section>
{% endblock content %}
{% block scripts %}
  <script type="module" src="{{ jsPath }}"></script>
{% endblock scripts %}
```

3. Create `pages/contact/contact.ts`:
```typescript
console.log('Contact page loaded');
// Your TypeScript code
```

4. Create `pages/contact/contact.css`:
```css
/* Your CSS styles */
```

5. Access at: `http://localhost:3000/contact`

## Development Mode

- TypeScript files are automatically transpiled on-the-fly
- Changes are hot-reloaded
- Access pages at `/{page-name}` (e.g., `/home`, `/about`, `/contact`)

## Production Build

- Files are bundled and minified
- Assets get hashed filenames for caching
- All pages are built to `dist/` directory

## Project Structure

```
├── pages/           # All page components
│   ├── home/        # Home page
│   └── about/       # About page
├── layouts/         # Shared layouts
├── shared/          # Shared utilities
├── server.ts        # Development server
└── vite.config.js   # Build configuration
```

## Tips

1. Use TypeScript for all page scripts
2. Keep page-specific assets in their page directory
3. Use Nunjucks template inheritance with `extends`
4. Server automatically discovers all pages - no config needed
