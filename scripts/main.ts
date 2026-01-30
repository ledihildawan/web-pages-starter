import Alpine from 'alpinejs';
import { initI18n } from '../config/i18n';
import { parseUrl } from '../config/router';

const isProduction = import.meta.env.PROD;

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
    const href = (existing as HTMLLinkElement).href;
    if (href && !href.includes('node_modules')) {
      const newUrl = href.split('?')[0] + '?t=' + Date.now();
      (existing as HTMLLinkElement).href = newUrl;
    }
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.dataset.resource = key;

    link.onload = () => {
      updateProgress(1);
      resolve();
    };

    link.onerror = () => {
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
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = url;
    script.dataset.resource = key;

    script.onload = () => {
      updateProgress(1);
      resolve();
    };

    script.onerror = () => {
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
  if (isProduction) return;

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
  if (isProduction) return;

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
  const oldUrl = window.location.pathname;
  showProgressBar();

  try {
    const response = await fetch(url);
    updateProgressTo(30);

    const html = await response.text();
    updateProgressTo(40);

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const mainContent = doc.querySelector('main');
    if (mainContent) {
      document.querySelector('main')?.replaceWith(mainContent);
    }

    const title = doc.querySelector('title');
    if (title) {
      document.title = title.textContent || '';
    }

    await loadPageResources(doc, url);

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
  } catch (error) {
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
    return;
  } finally {
    hideProgressBar();
  }
};

const handlePopState = async (): Promise<void> => {
  const url = window.location.pathname;
  const oldUrl = window.location.pathname;
  showProgressBar();

  try {
    const response = await fetch(url);
    updateProgressTo(30);

    const html = await response.text();
    updateProgressTo(40);

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const mainContent = doc.querySelector('main');
    if (mainContent) {
      document.querySelector('main')?.replaceWith(mainContent);
    }

    const title = doc.querySelector('title');
    if (title) {
      document.title = title.textContent || '';
    }

    await loadPageResources(doc, url);

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
    return;
  } finally {
    hideProgressBar();
  }
};

const setupRouter = (): void => {
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
