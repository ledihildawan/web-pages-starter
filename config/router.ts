import type { RouteConfig } from '../types/router';

interface HomeContext {
  heroTitle: string;
}

export const routes: RouteConfig<HomeContext>[] = [
  {
    path: '/',
    view: 'features/home/home.njk',
    title: 'Beranda',
    context: {
      heroTitle: 'Modern Web Native'
    }
  }
];