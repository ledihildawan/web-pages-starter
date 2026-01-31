# Build Modes Documentation

This project supports two build modes: **SPA (Single-Page Application)** and **MPA (Multi-Page Application)**. Each mode has different characteristics and is suitable for different use cases.

---

## Overview

| Feature | SPA Mode | MPA Mode |
|---------|-----------|----------|
| **Default** | ✅ Yes | ❌ No |
| **Build Output** | Single `index.html` | Multiple HTML files per route & language |
| **URL Structure** | Clean URLs (`/about`, `/en/about`) | With `.html` extension (`/about.html`, `/en/about.html`) |
| **Navigation** | JavaScript routing (client-side) | Regular navigation (page reloads) |
| **Progress Bar** | Network-based tracking | DOM-based tracking (inline) |
| **Server Requirements** | URL rewriting required | Basic static file serving |
| **SEO** | Requires SSR for best results | Better (each page is separate) |
| **Initial Load** | Slower (loads entire app) | Faster (loads only one page) |
| **Subsequent Navigation** | Instant (no reload) | Full page reloads |
| **Memory Management** | More complex (requires cleanup) | Simpler (natural cleanup) |
| **Best For** | Web applications | Content sites, blogs |

---

## Configuration

### Environment Variables

Configure build mode in your `.env` file:

```env
# Build mode: 'spa' or 'mpa'
BUILD_MODE=spa

# Default language: 'id' or 'en'
DEFAULT_LANG=id

# Debug mode (optional)
DEBUG=false
```

### Switching Build Modes

To switch between modes, simply change the `BUILD_MODE` variable and rebuild:

```bash
# Switch to SPA mode
BUILD_MODE=spa npm run build

# Switch to MPA mode
BUILD_MODE=mpa npm run build
```

Or use the provided npm scripts:

```bash
# SPA mode
npm run dev:spa
npm run build:spa
npm run preview:spa

# MPA mode
npm run dev:mpa
npm run build:mpa
npm run preview:mpa
```

---

## SPA Mode (Single-Page Application)

### How It Works

1. **Single Entry Point**: Only one `index.html` file is generated
2. **Client-Side Routing**: JavaScript handles navigation without page reloads
3. **Network-Based Progress Bar**: Tracks fetch requests and resource loading
4. **History API**: Uses `pushState` for clean URL updates

### URL Structure

- Home (Indonesian): `/`
- About (Indonesian): `/about`
- Home (English): `/en/`
- About (English): `/en/about`

### Features

#### Progress Bar Stages

The progress bar tracks 6 stages:

1. **Show**: 0% → 10%
2. **Fetch HTML**: 10% → 30%
3. **Parse HTML**: 30% → 40%
4. **Load CSS**: 40% → 65% (per file)
5. **Load JS**: 65% → 90% (per file)
6. **Finalize**: 90% → 100%

Animation: 0.08s transition with smooth easing.

#### Memory Management

To prevent memory leaks in SPA mode:

- **Alpine.js Cleanup**: Automatically destroys components when elements are removed
- **Event Listener Tracking**: Tracks and removes event listeners on navigation
- **Resource Map Limiting**: Keeps only 5 most recent pages in memory (LRU cache)
- **Fetch Object Cleanup**: Clears fetch objects after processing
- **WeakMap for Components**: Uses WeakMap for automatic garbage collection
- **MutationObserver**: Automatically cleans up when DOM elements are removed
- **Navigation History Limit**: Limits to 10 entries

#### Debug Features

Enable debug mode by setting `DEBUG=true` in `.env`:

```env
DEBUG=true
```

Debug features include:

- **Memory Logging**: Track heap usage before/after operations
- **Navigation Logging**: Log all navigations with timestamps
- **Resource Logging**: Track load/unload/cache-hit operations
- **Error Logging**: Log errors with stack traces
- **Performance Metrics**: Duration tracking and bottleneck detection

Access debug console:
```javascript
// In browser console
debug.logMemory('Navigation');
debug.printMemoryReport();
debug.printFullReport();
```

### Server Configuration

SPA mode requires server-side URL rewriting to handle client-side routing. See `examples/server-configs/` for examples:

- **Nginx**: `nginx-spa.conf`
- **Apache**: `apache-spa.conf` (use as `.htaccess`)
- **Netlify**: `netlify.toml`
- **Vercel**: `vercel.json`

### When to Use SPA Mode

✅ **Good for:**
- Web applications with complex interactions
- Dashboards, admin panels
- Applications requiring smooth, app-like navigation
- When server configuration control is available

❌ **Not recommended for:**
- Content-heavy sites (blogs, documentation)
- Sites requiring maximum SEO
- Deployments without URL rewriting support
- Users with slow internet connections

---

## MPA Mode (Multi-Page Application)

### How It Works

1. **Multiple HTML Files**: Separate HTML for each route and language
2. **Regular Navigation**: Page reloads on navigation
3. **DOM-Based Progress Bar**: Inline script tracks DOM ready state
4. **Server-Side Routing**: Each URL serves a separate HTML file

### URL Structure

- Home (Indonesian): `/index.html`
- About (Indonesian): `/about.html`
- Home (English): `/en/index.html`
- About (English): `/en/about.html`

**Note**: URLs include `.html` extension for direct file serving.

### Features

#### Progress Bar Stages

The progress bar tracks 4 DOM stages (via inline script):

1. **HTML Parsed**: 25%
2. **CSS Loaded**: 50%
3. **JS Loaded**: 75%
4. **DOM Ready**: 100%

The progress bar fades out after reaching 100% (200ms wait + 300ms fade).

#### Inline Progress Bar

In MPA mode, the progress bar is embedded directly in the HTML `<head>`:

```html
<script>
  (function() {
    var progress = 0;
    var progressBar = document.createElement('div');
    progressBar.id = 'page-progress';
    // ... progress tracking logic ...
  })();
</script>
```

This ensures the progress bar works even before any JavaScript is loaded.

### Server Configuration

MPA mode works with basic static file serving. No special configuration required.

**Optional: Clean URLs**

If you want clean URLs without `.html` extension (e.g., `/about` instead of `/about.html`), you need URL rewriting:

- **Nginx**: `nginx-mpa.conf`
- **Apache**: `apache-mpa.conf` (use as `.htaccess`)

### When to Use MPA Mode

✅ **Good for:**
- Content sites, blogs, documentation
- Sites requiring maximum SEO
- Deployments without URL rewriting support
- Users with slow internet connections
- Simple navigation requirements

❌ **Not recommended for:**
- Complex web applications
- Sites requiring smooth, app-like navigation
- Heavy use of client-side state management

---

## Development

### Development Server

Run development server with specific build mode:

```bash
# SPA mode development
npm run dev:spa

# MPA mode development
npm run dev:mpa
```

The development server automatically:
- Enables HMR (Hot Module Replacement)
- Serves assets with proper headers
- Handles routing based on `BUILD_MODE`

### Building for Production

```bash
# Build SPA
npm run build:spa

# Build MPA
npm run build:mpa
```

Output directory: `dist/`

### Preview Production Build

```bash
# Preview SPA
npm run preview:spa

# Preview MPA
npm run preview:mpa
```

### Type Checking

Always run type checking before building:

```bash
npm run build  # Includes tsc type checking
```

---

## Migration Guide

### From SPA to MPA

1. Update `.env`:
   ```env
   BUILD_MODE=mpa
   ```

2. Rebuild:
   ```bash
   npm run build:mpa
   ```

3. Deploy `dist/` directory to your server

4. Update any hardcoded URLs to include `.html` extension (or configure URL rewriting)

### From MPA to SPA

1. Update `.env`:
   ```env
   BUILD_MODE=spa
   ```

2. Rebuild:
   ```bash
   npm run build:spa
   ```

3. Configure server for SPA routing (see `examples/server-configs/`)

4. Deploy `dist/` directory to your server

---

## Troubleshooting

### SPA Mode Issues

#### Navigation shows 404 error

**Problem**: Clicking links shows a 404 Not Found error.

**Solution**: Your server is not configured to redirect all requests to `index.html`. Check server configuration examples in `examples/server-configs/`.

#### Progress bar not showing

**Problem**: The yellow progress bar doesn't appear during navigation.

**Solution**: This is expected in production builds. The progress bar is only visible in development mode (`import.meta.env.DEV`).

#### Memory usage increasing over time

**Problem**: Browser memory usage keeps growing during navigation.

**Solution**: Enable debug mode to identify leaks:

```env
DEBUG=true
```

Then check browser console for memory logs. Common causes:
- Event listeners not removed
- Alpine components not cleaned up
- Resource map not limited

#### Language switcher not working

**Problem**: Changing language doesn't update the URL or content.

**Solution**: Check that:
- `DEFAULT_LANG` is correctly set in `.env`
- Translation files exist in `locales/` directory
- Language codes match (`id`, `en`)

### MPA Mode Issues

#### Links include `.html` but you want clean URLs

**Problem**: URLs show `/about.html` but you want `/about`.

**Solution**: Configure URL rewriting on your server. See `nginx-mpa.conf` or `apache-mpa.conf` for examples.

#### Progress bar not showing

**Problem**: The inline progress bar doesn't appear on page load.

**Solution**: Check that the inline script is being generated in the HTML `<head>`. This should be automatic in MPA mode.

#### Wrong language loaded

**Problem**: Loading `/en/about.html` shows Indonesian content.

**Solution**: Check that:
- Build was run with correct `BUILD_MODE=mpa`
- Translation files exist and are correct
- URLs match language structure (`/en/about.html`)

### Common Issues

#### Build fails

**Problem**: Build command fails with errors.

**Solution**:
1. Check TypeScript compilation: `npx tsc --noEmit`
2. Verify `.env` file exists and has valid values
3. Ensure all dependencies are installed: `npm install`
4. Check Vite configuration in `vite.config.js`

#### HMR not working in development

**Problem**: Changes don't reflect without manual refresh.

**Solution**:
1. Check that development server is running (`npm run dev:spa` or `npm run dev:mpa`)
2. Ensure browser extensions aren't blocking HMR
3. Check browser console for HMR connection errors

---

## Performance Optimization

### SPA Mode

1. **Lazy Loading**: Implement route-based code splitting
2. **Resource Caching**: Leverage browser caching for static assets
3. **Prefetching**: Prefetch likely routes
4. **Service Worker**: Cache HTML responses for offline support

### MPA Mode

1. **Asset Optimization**: Minify and compress JS/CSS
2. **CDN**: Serve static assets from CDN
3. **HTTP/2**: Use HTTP/2 for multiplexing
4. **Cache Headers**: Set proper cache headers for assets

---

## Best Practices

### General

1. **Test Both Modes**: Test your application in both SPA and MPA modes
2. **Use Environment Variables**: Configure mode via `.env`, not code
3. **Version Control**: Commit `.env.example`, ignore `.env`
4. **Debug in Development**: Use `DEBUG=true` during development
5. **Test Locally**: Use preview scripts before deploying

### SPA Mode

1. **Clean Up Resources**: Always remove unused event listeners and data
2. **Limit Memory**: Use the built-in LRU cache for page resources
3. **Monitor Memory**: Use debug tools to track memory usage
4. **Test Navigation**: Test back/forward button behavior
5. **Handle Errors**: Gracefully handle navigation failures

### MPA Mode

1. **Use Server-Side Redirects**: Configure clean URLs on the server
2. **Optimize Assets**: Minify and compress all static files
3. **Set Cache Headers**: Cache assets with long expiration times
4. **Test Direct URLs**: Ensure all pages can be accessed directly
5. **Monitor Performance**: Use tools like Lighthouse for performance insights

---

## Examples

See `examples/` directory for:

- **Server Configurations**: `examples/server-configs/`
  - Nginx configurations (SPA & MPA)
  - Apache configurations (SPA & MPA)
  - Netlify configuration
  - Vercel configuration
  - Five Server deployment guide

---

## API Reference

### Config Functions

```typescript
// Get build configuration
import { getBuildConfig } from '@config/build';

const config = getBuildConfig();
console.log(config.BUILD_MODE); // 'spa' | 'mpa'
console.log(config.DEFAULT_LANG); // 'id' | 'en'
console.log(config.DEBUG); // boolean

// Helper functions
import { isSPAMode, isMPAMode, getDefaultLang, isDebugMode } from '@config/build';

isSPAMode(); // boolean
isMPAMode(); // boolean
getDefaultLang(); // 'id' | 'en'
isDebugMode(); // boolean
```

### Debug API

```typescript
import { debug } from '@utils/debug';

// Memory
debug.logMemory('Before operation');
debug.printMemoryReport();

// Navigation
debug.logNavigation('/old', '/new');
debug.printNavigationHistory();

// Resources
debug.logResource('load', '/script.js');
debug.logResource('unload', '/script.js');
debug.logResource('cache-hit', '/script.js');
debug.printResourceSummary();

// Performance
debug.timeStart('operation');
// ... do something ...
debug.timeEnd('operation');

// Errors
debug.logError('TypeError', new Error('Something went wrong'));
debug.printErrorLog();

// Full report
debug.printFullReport();
```

---

## Support

For issues, questions, or contributions:

1. Check the main project documentation
2. Review example configurations
3. Enable debug mode for troubleshooting
4. Review server logs and browser console

---

## License

This project is licensed as specified in the main project LICENSE file.
