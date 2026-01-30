import nunjucks from 'nunjucks';
import fs from 'fs';
import path from 'path';
import { routes, parseUrl } from '../config/router';
import i18next from 'i18next';
import type { Plugin, ViteDevServer } from 'vite';
import type { RenderOptions, TranslationFunction } from '../types/nunjucks';
import type { TranslationSchema } from '../types/i18n';

interface I18nData {
  id: TranslationSchema;
  en: TranslationSchema;
  currentLang?: string;
}

let i18nInitialized = false;
let translationData: I18nData | null = null;

async function initI18n(): Promise<void> {
  if (!i18nInitialized) {
    const id = await import('../locales/id/translation.json') as { default: TranslationSchema };
    const en = await import('../locales/en/translation.json') as { default: TranslationSchema };

    translationData = {
      id: id.default,
      en: en.default
    };

    await i18next.init({
      lng: 'id',
      fallbackLng: 'en',
      resources: {
        id: { translation: id.default },
        en: { translation: en.default }
      }
    });
    i18nInitialized = true;
  }
}

function getEnv(i18nData?: unknown): nunjucks.Environment {
  const env = nunjucks.configure(['features', 'templates'], {
    noCache: true,
    watch: false
  });

  const tFunc: TranslationFunction = i18nData
    ? (key: string) => {
        const keys = key.split('.');
        const lang = (i18nData as I18nData).currentLang || 'id';
        let value: unknown = (i18nData as I18nData)[lang as keyof I18nData];
        for (const k of keys) {
          value = (value as Record<string, unknown>)?.[k];
        }
        return (value as string) || key;
      }
    : (key: string, opts?: Record<string, unknown>) => i18next.t(key, opts);

  env.addGlobal('t', tFunc);
  
  const urlFunc = (path: string) => {
    const lang = (i18nData as I18nData).currentLang || 'id';
    const cleanPath = path.replace(/\/$/, '') || '/';
    return lang === 'id' ? cleanPath : `/${lang}${cleanPath}`;
  };
  
  env.addGlobal('url', urlFunc);
  
  return env;
}

function renderTemplate(options: RenderOptions): string {
  const { rootPath, route, currentPath, i18nData } = options;
  const env = getEnv(i18nData);
  env.addGlobal('currentPath', currentPath);
  env.addGlobal('currentLang', (i18nData as I18nData).currentLang || 'id');

  const templatePath = path.resolve(rootPath, route.view);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  const templateSource = fs.readFileSync(templatePath, 'utf-8');

  const lang = (i18nData as I18nData).currentLang || 'id';
  const translatedTitle = translateTitle(route.title, lang, translationData);

  const context = {
    ...(typeof route.context === 'object' && route.context !== null ? route.context : {}),
    title: translatedTitle
  };

  return env.renderString(templateSource, context);
}

function translateTitle(title: string, lang: string, translationData: I18nData | null): string {
  if (!translationData) return title;

  const translations: Record<string, Record<string, string>> = {
    'Beranda': {
      id: 'Beranda',
      en: 'Home'
    },
    'Tentang': {
      id: 'Tentang',
      en: 'About'
    }
  };

  const titleTranslations = translations[title];
  if (titleTranslations && lang in titleTranslations) {
    return titleTranslations[lang as keyof typeof titleTranslations];
  }

  return title;
}

export default function njkPlugin(): Plugin {
  return {
    name: 'vite-plugin-nunjucks-engine',

    load(id: string) {
      if (id.endsWith('.njk')) {
        return '';
      }
    },

    configureServer(server: ViteDevServer) {
      server.watcher.add([
        path.resolve(process.cwd(), 'features/**/*.njk'),
        path.resolve(process.cwd(), 'templates/**/*.njk')
      ]);

      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = req.url?.split('?')[0] || '/';
        const parsed = parseUrl(url);

        if (parsed.route) {
          await initI18n();

          await i18next.changeLanguage(parsed.lang);

          const rendered = renderTemplate({
            rootPath: server.config.root,
            route: parsed.route,
            currentPath: url,
            i18nData: { ...translationData, currentLang: parsed.lang }
          });

          let html = rendered;
          html = html.replace(/<link rel="stylesheet" href="\/styles\/main\.css" \/>/, '<link rel="stylesheet" href="/styles/main.css">');
          html = html.replace(/<link[^>]*href="\.\/(\w+)\.css"[^>]*>/g, '<link rel="stylesheet" href="/features/$1/$1.css">');
          html = html.replace(/<script[^>]*src="\/scripts\/main\.(ts|js)"[^>]*><\/script>/, '<script type="module" src="/scripts/main.ts"></script>');
          html = html.replace(/<script[^>]*src="\.\/(\w+)\.ts"[^>]*><\/script>/g, '<script type="module" src="/features/$1/$1.ts"></script>');

          const transformed = await server.transformIndexHtml(url, html);
          res.setHeader('Content-Type', 'text/html').end(transformed);
          return;
        }
        next();
      });
    },

    async handleHotUpdate({ file, server }: { file: string; server: ViteDevServer }) {
      if (file.endsWith('.njk')) {
        server.ws.send({
          type: 'full-reload',
          path: '*'
        });
      } else if (file.endsWith('.css') || file.endsWith('.ts')) {
        const page = file.match(/features[\/\\](\w+)[\/\\]/)?.[1];
        if (page) {
          server.ws.send({
            type: 'full-reload',
            path: '*'
          });
        }
      }
    },

    async generateBundle(_options: any, _bundle: any): Promise<void> {
      await initI18n();
    },

    writeBundle(_options: any, _bundle: any): void {
      const rootPath = process.cwd();
      const distPath = path.resolve(rootPath, 'dist');

      if (!fs.existsSync(distPath)) {
        fs.mkdirSync(distPath, { recursive: true });
      }

      const assets = Object.entries(_bundle);
      const jsAssets = assets.filter(([name]) => name.endsWith('.js'));
      const cssAssets = assets.filter(([name]) => name.endsWith('.css'));

      const languages = ['id', 'en'] as const;

      languages.forEach(lang => {
        for (const route of routes) {
          const basePath = route.path === '/' ? 'index.html' : `${route.path.replace(/^\//, '')}.html`;
          const relativePath = lang === 'id' ? basePath : path.join(lang, basePath);
          const filePath = path.resolve(distPath, relativePath);

          const rendered = renderTemplate({
            rootPath,
            route,
            currentPath: route.path,
            i18nData: { ...translationData, currentLang: lang }
          });
          let html = rendered;

          for (const [name] of cssAssets) {
            if (name.startsWith('main-')) {
              html = html.replace(/<link rel="stylesheet" href="\/styles\/main\.css" \/>/, `<link rel="stylesheet" href="/${name}">`);
            } else if (name.startsWith('home-')) {
              html = html.replace(/<link[^>]*href="\.\/home\.css"[^>]*>/, `<link rel="stylesheet" href="/${name}">`);
            } else if (name.startsWith('about-')) {
              html = html.replace(/<link[^>]*href="\.\/about\.css"[^>]*>/, `<link rel="stylesheet" href="/${name}">`);
            }
          }

          for (const [name] of jsAssets) {
            if (name.startsWith('main-')) {
              html = html.replace(/<script[^>]*src="\/scripts\/main\.(ts|js)"[^>]*><\/script>/, `<script type="module" src="/${name}"></script>`);
            } else if (name.startsWith('home-')) {
              html = html.replace(/<script[^>]*src="\.\/home\.ts"[^>]*><\/script>/, `<script type="module" src="/${name}"></script>`);
            } else if (name.startsWith('about-')) {
              html = html.replace(/<script[^>]*src="\.\/about\.ts"[^>]*><\/script>/, `<script type="module" src="/${name}"></script>`);
            }
          }

          const dir = path.dirname(filePath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }

          fs.writeFileSync(filePath, html);
        }
      });
    }
  };
}