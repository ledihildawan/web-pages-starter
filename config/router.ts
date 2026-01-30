import type { RouteConfig } from '../types/router';

interface HomeContext {
  heroTitle: string;
}

export const routes: RouteConfig<HomeContext>[] = [
  {
    path: '/',
    view: 'features/home/home.njk',
    title: 'Beranda',
    context: { heroTitle: 'Modern Web Native' },
  },
  {
    path: '/about',
    view: 'features/about/about.njk',
    title: 'Tentang',
  },
] as const;

export interface ParsedUrl {
  lang: string;
  path: string;
  route: RouteConfig<HomeContext> | undefined;
}

export const parseUrl = (url: string): ParsedUrl => {
  const parts = url.split('/').filter(Boolean);
  const possibleLang = parts[0];
  const lang = (possibleLang === 'id' || possibleLang === 'en') ? possibleLang : 'id';
  
  const pathParts = (possibleLang === 'id' || possibleLang === 'en') 
    ? parts.slice(1) 
    : parts;
  const path = pathParts.length === 0 ? '' : `/${pathParts.join('/')}`;
  
  const normalizedPath = path === '' ? '/' : path;
  
  const route = routes.find(r => r.path === normalizedPath);
  
  return { lang, path: normalizedPath, route };
};

export const getRoute = (path: string): RouteConfig<HomeContext> | undefined =>
  routes.find(route => route.path === path);

export const getCurrentPath = (): string => window.location.pathname;