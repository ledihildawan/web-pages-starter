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

export const getRoute = (path: string): RouteConfig<HomeContext> | undefined =>
  routes.find(route => route.path === path);

export const getCurrentPath = (): string => window.location.pathname;