import { entry } from './utils';
import { scanPagesDir } from './utils';

export const routes = {
  home: {
    path: '/',
    template: entry('pages/home/home.njk'),
    output: 'index.html',
    data: {
      title: 'Modern Landing Page',
    },
  },
};

export const allPages = scanPagesDir('pages');
