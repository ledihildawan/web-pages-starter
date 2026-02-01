const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dist = path.resolve(process.cwd(), 'dist');
const tempDir = path.resolve(process.cwd(), '.vite-temp');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function moveFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.renameSync(src, dest);
}

function hashFile(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
}

const assetsDir = path.join(dist, 'assets');
ensureDir(assetsDir);

const cssFiles = {};
for (const name of fs.readdirSync(assetsDir)) {
  const p = path.join(assetsDir, name);
  const stat = fs.statSync(p);
  if (stat.isFile() && name.endsWith('.css') && !name.includes('-')) {
    const hash = hashFile(p);
    const newName = `home-${hash}.css`;
    moveFile(p, path.join(assetsDir, newName));
    cssFiles['home.css'] = `/assets/${newName}`;
  }
}

const jsFiles = {};
for (const name of fs.readdirSync(assetsDir)) {
  const p = path.join(assetsDir, name);
  const stat = fs.statSync(p);
  if (stat.isDirectory()) {
    for (const subName of fs.readdirSync(p)) {
      const subP = path.join(p, subName);
      const stat = fs.statSync(subP);
      if (stat.isFile()) {
        const match = subName.match(/-([A-Za-z0-9-]+)\.(js|css)$/);
        if (match) {
          const hash = match[1];
          const ext = match[2];
          const newName = `${name}-${hash}.${ext}`;
          moveFile(subP, path.join(assetsDir, newName));
          jsFiles[`${name}.ts`] = `/assets/${newName}`;
        }
      }
    }
    if (fs.existsSync(p) && fs.readdirSync(p).length === 0) {
      fs.rmdirSync(p);
    }
  }
}

for (const name of fs.readdirSync(dist)) {
  const p = path.join(dist, name);
  const stat = fs.statSync(p);
  if (stat.isDirectory()) {
    for (const subName of fs.readdirSync(p)) {
      const subP = path.join(p, subName);
      const stat = fs.statSync(subP);
      if (stat.isFile() && subName.endsWith('.html')) {
        const match = subName.match(/^(.+)\.html$/);
        if (match) {
          let html = fs.readFileSync(subP, 'utf8');
          
          for (const [oldName, newPath] of Object.entries(cssFiles)) {
            html = html.split(`href="${oldName}"`).join(`href="${newPath}"`);
            html = html.split(`href='${oldName}'`).join(`href='${newPath}'`);
          }
          
          for (const [oldName, newPath] of Object.entries(jsFiles)) {
            html = html.split(`src="${oldName}"`).join(`src="${newPath}"`);
            html = html.split(`src='${oldName}'`).join(`src='${newPath}'`);
          }
          
          fs.writeFileSync(subP, html, 'utf8');
        }
      }
    }
  }
}

if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

console.log('postbuild: organized build output');
