import html from '@elysiajs/html';
import { Elysia } from 'elysia';
import { existsSync } from 'fs';
import { join } from 'path';
import nunjucks from 'nunjucks';
import { routes, allPages } from './shared/routes';
import { transpile } from 'typescript';

nunjucks.configure('.', {
  autoescape: true,
  noCache: true,
});

const isDev = process.env.NODE_ENV !== 'production';

const app = new Elysia()
  .use(html())
  .all('/assets/*', async ({ params }) => {
    const assetPath = params['*'];
    const filePath = join(process.cwd(), 'pages', assetPath);
    
    if (!existsSync(filePath)) {
      return new Response('Asset not found', { status: 404 });
    }
    
    if (isDev && filePath.endsWith('.ts')) {
      try {
        const tsContent = await Bun.file(filePath).text();
        const jsContent = transpile(tsContent);
        return new Response(jsContent, {
          headers: { 'Content-Type': 'application/javascript' },
        });
      } catch (error) {
        console.error('Error transpiling TypeScript:', error);
        return new Response('Transpile error', { status: 500 });
      }
    }
    
    return Bun.file(filePath);
  })
  .get('/', () => {
    const pageName = 'home';
    return nunjucks.render(routes.home.template, {
      ...routes.home.data,
      isDev,
      jsPath: `/assets/${pageName}/${pageName}.ts`,
      cssPath: `/assets/${pageName}/${pageName}.css`,
    });
  })
  .get('/:page', ({ params }) => {
    const pageName = params.page;
    const templatePath = join(process.cwd(), 'pages', pageName, `${pageName}.njk`);
    
    if (!existsSync(templatePath)) {
      return new Response('Page not found', { status: 404 });
    }
    
    return nunjucks.render(templatePath, {
      isDev,
      jsPath: `/assets/${pageName}/${pageName}.ts`,
      cssPath: `/assets/${pageName}/${pageName}.css`,
    });
  })
  .listen(3000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
