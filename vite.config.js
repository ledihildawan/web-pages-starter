import CleanCSS from 'clean-css';
import fs from 'fs';
import * as htmlMinifier from 'html-minifier';
import path from 'node:path';
import nunjucks from 'nunjucks';
import { defineConfig } from 'vite';

const root = process.cwd();
const pagesDir = path.join(root, 'pages');
const tempDir = path.join(root, '.vite-temp');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    const srcPath = path.join(src, name);
    const destPath = path.join(dest, name);
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) copyDir(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

function walkSync(dir, filelist = []) {
  if (!fs.existsSync(dir)) return filelist;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      const dirName = path.basename(p);
      if (dirName !== 'sections' && dirName !== 'partials' && dirName !== 'layouts') {
        walkSync(p, filelist);
      }
    } else if (stat.isFile() && p.endsWith('.njk')) {
      filelist.push(p);
    }
  }
  return filelist;
}

if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
copyDir(pagesDir, tempDir);
const layoutsDir = path.join(root, 'layouts');
if (fs.existsSync(layoutsDir)) {
  copyDir(layoutsDir, path.join(tempDir, 'layouts'));
}

const njkFiles = walkSync(tempDir);
const inputs = {};
const htmlFiles = [];

const env = nunjucks.configure([tempDir, layoutsDir], {
  autoescape: false,
  trimBlocks: true,
  lstripBlocks: true,
});

for (const njk of njkFiles) {
  const rel = path.relative(tempDir, njk).split(path.sep).join('/');
  const dirRel = path.posix.dirname(rel);
  const pageDir = dirRel;
  const outRel = rel.replace(/\.njk$/, '.html');
  const outPath = path.join(tempDir, outRel);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  const pageName = dirRel.split('/').pop() || 'index';
  const pageTitle = pageName.charAt(0).toUpperCase() + pageName.slice(1);
  let content = env.render(njk, { 
    title: pageTitle, 
    isDev: false,
    jsPath: `/assets/${pageName}/${pageName}.ts`,
    cssPath: `/assets/${pageName}/${pageName}.css`
  });

  fs.writeFileSync(outPath, content);
  fs.unlinkSync(njk);

  const key = pageDir ? `${pageDir}/index` : 'index';
  inputs[key] = outPath;
  htmlFiles.push({ key, outPath });
}

const jsInputs = {};
const cssMap = {};

for (const hf of htmlFiles) {
  const pageName = hf.key.split('/')[0];
  const pageDir = path.join(pagesDir, pageName);
  
  const jsFile = path.join(pageDir, `${pageName}.ts`);
  const cssFile = path.join(pageDir, `${pageName}.css`);
  
  if (fs.existsSync(jsFile)) {
    jsInputs[hf.key] = jsFile;
  }
  
  if (fs.existsSync(cssFile)) {
    cssMap[hf.key] = cssFile;
  }
}

export default defineConfig({
  root: tempDir,
  build: {
    outDir: path.join(root, 'dist'),
    emptyOutDir: true,
    assetsDir: 'assets',
    minify: 'terser',
    cssMinify: true,
    rollupOptions: {
      input: jsInputs,
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name;
          if (name.endsWith('.css')) {
            const entryName = assetInfo.names?.[0] || name.replace('.css', '');
            return `assets/${entryName}-[hash][extname]`;
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
  plugins: [
    {
      name: 'copy-html-and-css',
      generateBundle(options, bundle) {
        for (const hf of htmlFiles) {
          let htmlContent = fs.readFileSync(hf.outPath, 'utf8');
          
          const jsKey = hf.key;
          const cssKey = hf.key;
          
          const jsFileName = Object.keys(bundle).find(name => 
            name.startsWith('assets/') && 
            name.endsWith('.js') && 
            name.includes(path.basename(hf.key))
          );
          
          const cssFileName = Object.keys(bundle).find(name => 
            name.startsWith('assets/') && 
            name.endsWith('.css') && 
            name.includes(path.basename(hf.key))
          );
          
          if (jsFileName) {
            htmlContent = htmlContent.replace(/href="\/assets\/[^"]*\.ts"/, `href="/${jsFileName}"`);
            htmlContent = htmlContent.replace(/src="\/assets\/[^"]*\.ts"/, `src="/${jsFileName}"`);
          }
          
          if (cssFileName) {
            htmlContent = htmlContent.replace(/href="\/assets\/[^"]*\.css"/, `href="/${cssFileName}"`);
          }
          
          const minifiedHtml = htmlMinifier.minify(htmlContent, {
            collapseWhitespace: true,
            removeComments: true,
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            useShortDoctype: true,
            minifyCSS: true,
            minifyJS: true,
          });
          this.emitFile({
            type: 'asset',
            fileName: hf.key.replace(/\/index$/, '/index.html'),
            source: minifiedHtml,
          });
        }
      },
    },
  ],
});
