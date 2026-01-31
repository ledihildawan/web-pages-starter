# Five Server Deployment Guide

## MPA Mode (Multi-Page Application)

MPA mode works directly with Five Server without any additional configuration. The built HTML files are served as-is.

### Steps to deploy MPA mode:

1. Build your project:
   ```bash
   npm run build:mpa
   ```

2. The `dist` directory will contain:
   - `index.html` (Indonesian home)
   - `about.html` (Indonesian about)
   - `en/index.html` (English home)
   - `en/about.html` (English about)
   - Static assets (JS, CSS, etc.)

3. Upload the entire `dist` directory to your Five Server hosting.

4. Access your site:
   - Home (ID): `https://your-domain.com/index.html`
   - About (ID): `https://your-domain.com/about.html`
   - Home (EN): `https://your-domain.com/en/index.html`
   - About (EN): `https://your-domain.com/en/about.html`

5. **Note**: Links in MPA mode include `.html` extensions automatically, so navigation works correctly.

### Optional: Clean URLs (without .html)

If you want clean URLs like `/about` instead of `/about.html`, you'll need server-side URL rewriting. Five Server supports URL rewriting through configuration files.

Check the `nginx-mpa.conf` or `apache-mpa.conf` examples for URL rewriting rules that you can adapt for Five Server.

---

## SPA Mode (Single-Page Application)

SPA mode requires a preview server that supports client-side routing. Five Server can be configured to handle this.

### Steps to deploy SPA mode:

1. Build your project:
   ```bash
   npm run build:spa
   ```

2. The `dist` directory will contain a single `index.html` file.

3. **Important**: SPA mode requires server-side configuration to redirect all requests to `index.html`.

4. Configure Five Server for SPA:

   Option 1: Using `.htaccess` (if supported)
   - Copy `examples/server-configs/apache-spa.conf` to your `dist` directory as `.htaccess`
   - This will handle client-side routing automatically

   Option 2: Using server configuration (if Five Server provides this)
   - Add rewrite rules to redirect all routes to `/index.html`
   - Example rule: `RewriteRule ^(.*)$ /index.html [L]`

5. Access your site:
   - Home (ID): `https://your-domain.com/`
   - About (ID): `https://your-domain.com/about`
   - Home (EN): `https://your-domain.com/en/`
   - About (EN): `https://your-domain.com/en/about`

6. All navigation will be handled client-side without page reloads.

### Testing Locally

You can test both modes locally using the preview scripts:

```bash
# Test SPA mode locally
npm run preview:spa

# Test MPA mode locally
npm run preview:mpa
```

The local preview server (`npm run preview`) uses Vite's built-in dev server, which automatically handles SPA routing based on the `BUILD_MODE` setting.

---

## Comparison

| Feature | MPA Mode | SPA Mode |
|---------|----------|----------|
| **Server Requirements** | Basic static file serving | URL rewriting required |
| **URL Structure** | `/about.html` | `/about` |
| **Navigation** | Full page reloads | Client-side routing |
| **Progress Bar** | DOM-based (inline script) | Network-based |
| **SEO** | Better (each page is separate) | Requires SSR for best SEO |
| **Initial Load** | Faster (loads only one page) | Slower (loads entire app) |
| **Subsequent Loads** | Full reloads | Instant (no reload) |

---

## Recommendations

- **Use MPA mode if**:
  - You need maximum SEO
  - Your users have slow internet connections
  - You're deploying to servers without URL rewriting support
  - You want simpler deployment

- **Use SPA mode if**:
  - You want fast, smooth navigation
  - You have server configuration control
  - You're building a web app rather than a content site
  - You want a modern, app-like experience

---

## Troubleshooting

### SPA mode shows 404 on navigation

**Problem**: Navigating to `/about` shows a 404 error.

**Solution**: Ensure your server is configured to redirect all requests to `index.html`. Check the server configuration examples.

### MPA mode links not working

**Problem**: Clicking links doesn't navigate correctly.

**Solution**: Ensure links include `.html` extension or configure URL rewriting for clean URLs.

### Language switcher not working

**Problem**: Changing language doesn't update the URL or content.

**Solution**: Check that the `DEFAULT_LANG` and `BUILD_MODE` are correctly set in your `.env` file.

---

## Additional Resources

- See `examples/server-configs/` for detailed configuration examples
- Check the main project documentation for build options
- Test locally with `npm run dev:spa` or `npm run dev:mpa`
