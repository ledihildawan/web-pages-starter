import Alpine from 'alpinejs';
import { initI18n } from '../config/i18n';
import { parseUrl } from '../config/router';
import { isMPAMode, isDebugMode } from '../config/build';
import { debug } from '../utils/debug';

const isProduction = import.meta.env.PROD;
const isMPA = isMPAMode();
const isDebug = isDebugMode();

declare global {
  interface Window {
    Alpine: typeof Alpine;
    changeLanguage?: (lang: string) => Promise<void>;
    pageResources?: Map<string, Set<string>>;
    isProduction?: boolean;
  }
}

window.isProduction = isProduction;

const pageResources = new Map<string, Set<string>>();
window.pageResources = pageResources;

const MAX_PAGES_IN_MEMORY = 5;
const NAVIGATION_HISTORY_LIMIT = 10;

const cleanupAlpine = (element: Element): void => {
  if (!element || !window.Alpine) return;

  const alpineData = (element as any)._x_dataStack;
  if (alpineData) {
    const scope = alpineData[0];
    if (typeof scope.destroy === 'function') {
      scope.destroy();
    }
  }

  const properties = ['_x_dataStack', '_x_bindings', '_x_transition', '_x_partials'];
  properties.forEach(prop => {
    if ((element as any)[prop]) {
      delete (element as any)[prop];
    }
  });

  if (isDebug) {
    console.log(`[Alpine] Cleaned up element:`, element);
  }
};

class EventManager {
  private listeners: Array<{
    target: EventTarget;
    event: string;
    handler: EventListener;
  }> = [];

  add(target: EventTarget, event: string, handler: EventListener): void {
    target.addEventListener(event, handler);
    this.listeners.push({ target, event, handler });
  }

  removeAll(): void {
    this.listeners.forEach(({ target, event, handler }) => {
      target.removeEventListener(event, handler);
    });
    this.listeners = [];
    
    if (isDebug) {
      console.log(`[EventManager] Removed all event listeners`);
    }
  }

  count(): number {
    return this.listeners.length;
  }
}

const eventManager = new EventManager();

const limitResources = (): void => {
  const entries = Array.from(pageResources.entries());
  const globalEntry = entries.find(([key]) => key === 'global');
  const pageEntries = entries.filter(([key]) => key !== 'global');

  if (pageEntries.length <= MAX_PAGES_IN_MEMORY) return;

  const toRemove = pageEntries.slice(0, pageEntries.length - MAX_PAGES_IN_MEMORY);
  
  toRemove.forEach(([pageUrl]) => {
    const resources = pageResources.get(pageUrl);
    if (!resources) return;

    resources.forEach((key) => {
      const [, url] = key.split(':');

      if (url.includes('/main.') || url.includes('/styles/main')) {
        return;
      }

      const element = document.querySelector(`[data-resource="${key}"]`);
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });

    pageResources.delete(pageUrl);
    
    if (isDebug) {
      console.log(`[Memory] Removed resources for: ${pageUrl}`);
    }
  });
};

let currentFetch: { response: Response | null; text: string | null; doc: Document | null } = {
  response: null,
  text: null,
  doc: null
};

const cleanupFetch = (): void => {
  currentFetch.response = null;
  currentFetch.text = null;
  currentFetch.doc = null;
};

const componentCache = new WeakMap<Element, any>();

const measureMemory = (stage: string): void => {
  debug.logMemory(stage);
};

let navigationHistory: string[] = [];

const trackResource = (pageUrl: string, resourceType: string, resourceUrl: string): void => {
  const key = `${resourceType}:${resourceUrl}`;

  if (!pageResources.has(pageUrl)) {
    pageResources.set(pageUrl, new Set());
  }
  pageResources.get(pageUrl)!.add(key);

  const globalSet = pageResources.get('global') || new Set();
  globalSet.add(key);
  pageResources.set('global', globalSet);
};

const untrackResources = (pageUrl: string): void => {
  const resources = pageResources.get(pageUrl);
  if (!resources) return;

  resources.forEach((key) => {
    const [, url] = key.split(':');

    if (url.includes('/main.') || url.includes('/styles/main')) {
      return;
    }

    const isUsedElsewhere = Array.from(pageResources.entries())
      .filter(([p]) => p !== pageUrl && p !== 'global')
      .some(([, set]) => set.has(key));

    if (!isUsedElsewhere) {
      const element = document.querySelector(`[data-resource="${key}"]`);
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }
  });

  pageResources.delete(pageUrl);
};

const loadCSS = async (url: string, pageUrl: string): Promise<void> => {
  if (isProduction) return Promise.resolve();

  const key = `css:${url}`;
  const existing = document.querySelector(`[data-resource="${key}"]`);

  if (existing) {
    debug.logResource('cache-hit', url);
    const href = (existing as HTMLLinkElement).href;
    if (href && !href.includes('node_modules')) {
      const newUrl = href.split('?')[0] + '?t=' + Date.now();
      (existing as HTMLLinkElement).href = newUrl;
    }
    return Promise.resolve();
  }

  debug.logResource('load', url);
  debug.timeStart(`load-css:${url}`);

  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.dataset.resource = key;

    link.onload = () => {
      debug.timeEnd(`load-css:${url}`);
      updateProgress(1);
      resolve();
    };

    link.onerror = () => {
      debug.logError('CSS Load', new Error(`Failed to load CSS: ${url}`));
      debug.timeEnd(`load-css:${url}`);
      updateProgress(1);
      reject(new Error(`Failed to load CSS: ${url}`));
    };

    document.head.appendChild(link);
    trackResource(pageUrl, 'css', url);
  });
};

const executeScript = async (url: string, pageUrl: string): Promise<void> => {
  if (isProduction) return Promise.resolve();

  const key = `js:${url}`;

  if (document.querySelector(`[data-resource="${key}"]`)) {
    debug.logResource('cache-hit', url);
    return Promise.resolve();
  }

  debug.logResource('load', url);
  debug.timeStart(`load-js:${url}`);

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = url;
    script.dataset.resource = key;

    script.onload = () => {
      debug.timeEnd(`load-js:${url}`);
      updateProgress(1);
      resolve();
    };

    script.onerror = () => {
      debug.logError('JS Load', new Error(`Failed to load JS: ${url}`));
      debug.timeEnd(`load-js:${url}`);
      updateProgress(1);
      resolve();
    };

    document.body.appendChild(script);
    trackResource(pageUrl, 'js', url);
  });
};

let totalResources = 0;
let loadedResources = 0;
let currentProgress = 0;

const updateProgressTo = (target: number): void => {
  const animate = () => {
    if (currentProgress < target) {
      currentProgress += Math.min((target - currentProgress) * 0.3, 10);
      if (currentProgress > target) currentProgress = target;

      const progressBar = document.getElementById('page-progress');
      if (progressBar) {
        progressBar.style.width = `${currentProgress}%`;
      }

      if (currentProgress < target - 0.5) {
        requestAnimationFrame(animate);
      }
    }
  };

  requestAnimationFrame(animate);
};

const updateProgress = (increment: number): void => {
  loadedResources += increment;
  const targetProgress = totalResources > 0
    ? Math.min(40 + (loadedResources / totalResources) * 50, 90)
    : 40;

  const animate = () => {
    if (currentProgress < targetProgress) {
      currentProgress += Math.min((targetProgress - currentProgress) * 0.3, 10);
      if (currentProgress > targetProgress) currentProgress = targetProgress;

      const progressBar = document.getElementById('page-progress');
      if (progressBar) {
        progressBar.style.width = `${currentProgress}%`;
      }

      if (currentProgress < targetProgress - 0.5) {
        requestAnimationFrame(animate);
      }
    }
  };

  requestAnimationFrame(animate);
};

const loadPageResources = async (doc: Document, pageUrl: string): Promise<void> => {
  if (isProduction) return Promise.resolve();

  const cssLinks = doc.querySelectorAll('link[href$=".css"]');
  const jsScripts = doc.querySelectorAll('script[src$=".ts"][type="module"]');

  totalResources = cssLinks.length + jsScripts.length;
  loadedResources = 0;
  updateProgressTo(40);

  const cssPromises = Array.from(cssLinks).map((link) => {
    const href = (link as HTMLLinkElement).href;
    return loadCSS(href, pageUrl);
  });

  const jsPromises = Array.from(jsScripts).map((script) => {
    const src = (script as HTMLScriptElement).src;
    return executeScript(src, pageUrl);
  });

  await Promise.all([...cssPromises, ...jsPromises]);
};

const showProgressBar = (): void => {
  if (isProduction || isMPA) return;

  let progressBar = document.getElementById('page-progress');
  if (!progressBar) {
    progressBar = document.createElement('div');
    progressBar.id = 'page-progress';
    progressBar.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      height: 3px;
      background: linear-gradient(90deg, #ffd722 0%, #f5c900 50%, #d4a800 100%);
      z-index: 9999;
      transition: width 0.08s linear, opacity 0.3s ease;
      width: 0%;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    `;
    document.body.appendChild(progressBar);
  }
  progressBar.style.opacity = '1';
  progressBar.style.background = 'linear-gradient(90deg, #ffd722 0%, #f5c900 50%, #d4a800 100%)';
  currentProgress = 0;
  updateProgressTo(10);
};

const hideProgressBar = (): void => {
  if (isProduction || isMPA) return;

  const progressBar = document.getElementById('page-progress');
  if (!progressBar) return;

  progressBar.style.width = '100%';
  currentProgress = 100;

  setTimeout(() => {
    if (progressBar) {
      progressBar.style.opacity = '0';
      setTimeout(() => {
        if (progressBar && progressBar.parentNode) {
          progressBar.parentNode.removeChild(progressBar);
        }
      }, 300);
    }
  }, 200);
};

const navigate = async (url: string): Promise<void> => {
  if (isMPA) {
    window.location.href = url;
    return Promise.resolve();
  }

  const oldUrl = window.location.pathname;
  showProgressBar();

  debug.timeStart('navigation');
  debug.logNavigation(oldUrl, url);
  measureMemory('Before navigation');

  try {
    currentFetch.response = await fetch(url);
    updateProgressTo(30);

    currentFetch.text = await currentFetch.response.text();
    updateProgressTo(40);

    const parser = new DOMParser();
    currentFetch.doc = parser.parseFromString(currentFetch.text, 'text/html');

    const mainContent = currentFetch.doc.querySelector('main');
    if (mainContent) {
      const oldMain = document.querySelector('main');
      if (oldMain) {
        const alpineElements = oldMain.querySelectorAll('[x-data]');
        alpineElements.forEach(el => cleanupAlpine(el));
        oldMain.replaceWith(mainContent);
      }
    }

    const title = currentFetch.doc.querySelector('title');
    if (title) {
      document.title = title.textContent || '';
    }

    await loadPageResources(currentFetch.doc, url);

    const newLang = parseUrl(url).lang;
    const oldLang = parseUrl(oldUrl).lang;

    if (newLang !== oldLang) {
      await initI18n(newLang);
    }

    const appElement = document.querySelector('[x-data="app"]') as HTMLElement;
    if (appElement && window.Alpine) {
      const data = window.Alpine.$data(appElement) as { language?: string };
      if (data && 'language' in data) {
        data.language = newLang;
      }
    }

    window.history.pushState({}, '', url);
    updateProgressTo(95);

    untrackResources(oldUrl);
    limitResources();

    navigationHistory.push(oldUrl);
    if (navigationHistory.length > NAVIGATION_HISTORY_LIMIT) {
      navigationHistory.shift();
    }

    cleanupFetch();
    debug.timeEnd('navigation');
    measureMemory('After navigation');
  } catch (error) {
    debug.logError('Navigation', error as Error);
    console.error('Navigation error:', error);
    const progressBar = document.getElementById('page-progress');
    if (progressBar) {
      progressBar.style.background = 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)';
      updateProgressTo(100);
      setTimeout(() => {
        if (progressBar && progressBar.parentNode) {
          progressBar.style.opacity = '0';
          setTimeout(() => {
            if (progressBar && progressBar.parentNode) {
              progressBar.parentNode.removeChild(progressBar);
            }
          }, 300);
        }
      }, 1000);
    }
    cleanupFetch();
    debug.timeEnd('navigation');
    return;
  } finally {
    hideProgressBar();
  }
};

const handlePopState = async (): Promise<void> => {
  if (isMPA) {
    return Promise.resolve();
  }

  const url = window.location.pathname;
  const oldUrl = window.location.pathname;
  showProgressBar();

  if (isDebug) {
    measureMemory('Before popstate');
  }

  try {
    currentFetch.response = await fetch(url);
    updateProgressTo(30);

    currentFetch.text = await currentFetch.response.text();
    updateProgressTo(40);

    const parser = new DOMParser();
    currentFetch.doc = parser.parseFromString(currentFetch.text, 'text/html');

    const mainContent = currentFetch.doc.querySelector('main');
    if (mainContent) {
      const oldMain = document.querySelector('main');
      if (oldMain) {
        const alpineElements = oldMain.querySelectorAll('[x-data]');
        alpineElements.forEach(el => cleanupAlpine(el));
        oldMain.replaceWith(mainContent);
      }
    }

    const title = currentFetch.doc.querySelector('title');
    if (title) {
      document.title = title.textContent || '';
    }

    await loadPageResources(currentFetch.doc, url);

    const lang = parseUrl(url).lang;

    const appElement = document.querySelector('[x-data="app"]') as HTMLElement;
    if (appElement && window.Alpine) {
      const data = window.Alpine.$data(appElement) as { language?: string };
      if (data && 'language' in data) {
        data.language = lang;
      }
    }

    updateProgressTo(95);

    untrackResources(oldUrl);
    limitResources();

    navigationHistory.push(oldUrl);
    if (navigationHistory.length > NAVIGATION_HISTORY_LIMIT) {
      navigationHistory.shift();
    }

    cleanupFetch();
    
    if (isDebug) {
      measureMemory('After popstate');
    }
  } catch (error) {
    console.error('Popstate error:', error);
    const progressBar = document.getElementById('page-progress');
    if (progressBar) {
      progressBar.style.background = 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)';
      updateProgressTo(100);
      setTimeout(() => {
        if (progressBar && progressBar.parentNode) {
          progressBar.style.opacity = '0';
          setTimeout(() => {
            if (progressBar && progressBar.parentNode) {
              progressBar.parentNode.removeChild(progressBar);
            }
          }, 300);
        }
      }, 1000);
    }
    cleanupFetch();
    return;
  } finally {
    hideProgressBar();
  }
};

const setupRouter = (): void => {
  if (isMPA) {
    return;
  }

  document.addEventListener('click', (e) => {
    const link = (e.target as HTMLElement).closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('#')) return;

    if (isProduction) {
      return;
    }

    e.preventDefault();
    navigate(href);
  });

  if (!isProduction) {
    window.addEventListener('popstate', handlePopState);
  }

  if (import.meta.hot) {
    import.meta.hot.accept(() => {
      console.log('🔥 HMR: App updated, reloading...');
    });

    import.meta.hot.on('vite:beforeUpdate', (payload: any) => {
      const updates = payload.updates || [];
      updates.forEach((update: any) => {
        const type = update.type === 'css-change' ? 'CSS' : 'JS';
        console.log(`🔥 HMR: ${type} updated - ${update.path}`);
      });
    });
  }
};

const changeLanguage = async (newLang: string): Promise<void> => {
  const { path } = parseUrl(window.location.pathname);
  
  if (isMPA) {
    const baseName = path === '/' ? 'index' : path.replace(/^\//, '');
    const htmlFile = `${baseName}.html`;
    const finalPath = newLang === 'id' ? `/${htmlFile}` : `/${newLang}/${htmlFile}`;
    window.location.href = finalPath;
    return Promise.resolve();
  }
  
  const newPath = newLang === 'id' ? path : `/${newLang}${path}`;
  const finalPath = newPath.replace(/\/$/, '') || '/';

  if (isProduction) {
    window.location.href = finalPath;
    return Promise.resolve();
  }

  await navigate(finalPath);
};

const initApp = async (): Promise<void> => {
  window.Alpine = Alpine;

  const { lang } = parseUrl(window.location.pathname);
  const savedLang = localStorage.getItem('language') || 'id';

  if (lang && (lang === 'id' || lang === 'en')) {
    localStorage.setItem('language', lang);
  }

  window.changeLanguage = changeLanguage;

  setupRouter();

  await initI18n(lang || savedLang);

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.removedNodes.forEach((node) => {
        if (node instanceof Element) {
          const alpineElements = node.querySelectorAll ? node.querySelectorAll('[x-data]') : [];
          alpineElements.forEach(el => cleanupAlpine(el));
          
          if ((node as Element).hasAttribute && (node as Element).hasAttribute('x-data')) {
            cleanupAlpine(node);
          }
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  Alpine.data('app', () => {
    return {
      language: lang || savedLang,
      theme: localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),

      init() {
        document.documentElement.classList.toggle('dark', this.theme === 'dark');
      },

      toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.theme);
        document.documentElement.classList.toggle('dark', this.theme === 'dark');
      },

      async toggleLanguage() {
        const newLang = this.language === 'id' ? 'en' : 'id';
        this.language = newLang;
        localStorage.setItem('language', newLang);
        await window.changeLanguage!(newLang);
      },

      isDark() {
        return this.theme === 'dark';
      }
    };
  });

  Alpine.start();

  console.log('✅ App initialized');
};

initApp().catch(error => {
  console.error('❌ Failed to start app:', error);
});
