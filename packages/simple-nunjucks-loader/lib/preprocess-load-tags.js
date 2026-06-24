Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.preprocessLoadTags = preprocessLoadTags;
var _pathe = _interopRequireDefault(require('pathe'));
var _fs = _interopRequireDefault(require('fs'));
var _sass = _interopRequireDefault(require('sass'));
var _less = _interopRequireDefault(require('less'));
var _esbuild = _interopRequireDefault(require('esbuild'));
var _jsYaml = _interopRequireDefault(require('js-yaml'));
var _json = _interopRequireDefault(require('json5'));
var _marked = require('marked');
var _toml = _interopRequireDefault(require('toml'));
var _fastXmlParser = require('fast-xml-parser');
var _glob = require('glob');
function _interopRequireDefault(e) {
  return e && e.__esModule ? e : { default: e };
}
const LOAD_TAG_REGEX = /\{%\s*load\s+["']([^"']+)["']\s*(?:as\s+(\w+))?\s*%\}/g;
const INLINE_LOADER_REGEX = /^!([^!]+)!(.+)$/;
const CSP_NONCE_PLACEHOLDER = '__NONCE__';
function parseCSV(content) {
  const lines = content.trim().split('\n');
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim());
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] || '';
    });
    return obj;
  });
}
function parseINI(content) {
  const result = {};
  let currentSection = result;
  const lines = content.trim().split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('#')) continue;
    if (trimmed.startsWith('[')) {
      const sectionName = trimmed.slice(1, -1).trim();
      result[sectionName] = {};
      currentSection = result[sectionName];
    } else if (trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      currentSection[key.trim()] = valueParts.join('=').trim();
    }
  }
  return result;
}
const MIME_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf',
};
function getMimeType(filePath) {
  const ext = _pathe.default.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}
let tsconfigTargetCache = null;
function getTsconfigTarget() {
  if (tsconfigTargetCache) return tsconfigTargetCache;
  try {
    var _tsconfig$compilerOpt;
    const tsconfigPath = _pathe.default.resolve(process.cwd(), 'tsconfig.json');
    const tsconfig = JSON.parse(_fs.default.readFileSync(tsconfigPath, 'utf8'));
    tsconfigTargetCache =
      ((_tsconfig$compilerOpt = tsconfig.compilerOptions) === null || _tsconfig$compilerOpt === void 0
        ? void 0
        : _tsconfig$compilerOpt.target) || 'es2020';
  } catch {
    tsconfigTargetCache = 'es2020';
  }
  return tsconfigTargetCache;
}
function isAbsoluteTemplatePath(path) {
  return path.startsWith('/') || path.startsWith('./') || path.startsWith('../');
}
function hasInlineLoaders(path) {
  return path.startsWith('!');
}
function convertLoadToInclude(match, path) {
  return `{% include "${path}" %}`;
}
function escapeForNunjucks(content) {
  return content.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}
function stripStyleTags(content) {
  return content.replace(/<\/?style[^>]*>/gi, '').trim();
}
function wrapInStyleTag(content, nonce) {
  const cleanContent = stripStyleTags(content);
  const nonceAttr = nonce ? ` nonce="${nonce}"` : '';
  return `<style${nonceAttr}>${cleanContent}</style>`;
}
function wrapInScriptTag(content, nonce) {
  const nonceAttr = nonce ? ` nonce="${nonce}"` : '';
  return `<script${nonceAttr}>${content}</script>`;
}
function wrapInScriptModuleTag(content, nonce) {
  const nonceAttr = nonce ? ` nonce="${nonce}"` : '';
  return `<script type="module"${nonceAttr}>${content}</script>`;
}
function convertInlineLoaderToSet(id, content, asVar, nonce, type) {
  const escaped = escapeForNunjucks(content);
  if (asVar) {
    return `{% set ${asVar} = "${escaped}" %}`;
  }
  if (type === 'esm') {
    const wrapper = wrapInScriptModuleTag(content, nonce);
    const escapedWrapper = escapeForNunjucks(wrapper);
    return `{% set ${id} = "${escapedWrapper}" %}{{ ${id} | safe }}`;
  }
  if (type === 'js') {
    const wrapper = wrapInScriptTag(content, nonce);
    const escapedWrapper = escapeForNunjucks(wrapper);
    return `{% set ${id} = "${escapedWrapper}" %}{{ ${id} | safe }}`;
  }
  if (type === 'html') {
    return `{% set ${id} = "${escaped}" %}{{ ${id} | safe }}`;
  }
  if (type === 'json') {
    const escapedContent = content.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return `{% set ${id} = "${escapedContent}" %}{{ ${id} | safe }}`;
  }
  if (type === 'txt') {
    return `{% set ${id} = "${escaped}" %}{{ ${id} | safe }}`;
  }
  const wrapper = wrapInStyleTag(content, nonce);
  const escapedWrapper = escapeForNunjucks(wrapper);
  return `{% set ${id} = "${escapedWrapper}" %}{{ ${id} | safe }}`;
}
let inlineLoaderId = 0;
async function preprocessLoadTags(source, contextDir, options = {}) {
  const loadTemplates = [];
  const inlineRawContent = [];
  const inlineFilePaths = [];
  let cleanedSource = source;
  inlineLoaderId = 0;
  let match;
  const regex = new RegExp(LOAD_TAG_REGEX);
  while ((match = regex.exec(source)) !== null) {
    const fullMatch = match[0];
    const templatePath = match[1];
    const asVar = match[2];
    const nonce = options.nonce ? CSP_NONCE_PLACEHOLDER : null;
    if (hasInlineLoaders(templatePath)) {
      const inlineMatch = templatePath.match(INLINE_LOADER_REGEX);
      if (inlineMatch) {
        const [, loaderChain, filePath] = inlineMatch;
        const resolvedPath = contextDir ? _pathe.default.resolve(contextDir, filePath) : filePath;
        if (loaderChain === 'raw') {
          try {
            const content = _fs.default.readFileSync(resolvedPath, 'utf8');
            const id = `__inline_raw_${inlineLoaderId++}__`;
            inlineRawContent.push({
              id,
              content,
            });
            inlineFilePaths.push(resolvedPath);
            cleanedSource = cleanedSource.replace(
              fullMatch,
              convertInlineLoaderToSet(id, content, asVar, nonce, 'css'),
            );
            continue;
          } catch (error) {
            console.error(`[preprocessLoadTags] Failed to read file: ${resolvedPath}`, error.message);
          }
        }
        if (loaderChain === 'scss') {
          try {
            const sassResult = _sass.default.compile(resolvedPath);
            const id = `__inline_scss_${inlineLoaderId++}__`;
            inlineRawContent.push({
              id,
              content: sassResult.css,
            });
            inlineFilePaths.push(resolvedPath);
            cleanedSource = cleanedSource.replace(
              fullMatch,
              convertInlineLoaderToSet(id, sassResult.css, asVar, nonce, 'css'),
            );
            continue;
          } catch (error) {
            console.error(`[preprocessLoadTags] SCSS compilation failed for: ${resolvedPath}`, error.message);
          }
        }
        if (loaderChain === 'sass') {
          try {
            const sassResult = _sass.default.compile(resolvedPath, {
              indentedSyntax: true,
            });
            const id = `__inline_sass_${inlineLoaderId++}__`;
            inlineRawContent.push({
              id,
              content: sassResult.css,
            });
            inlineFilePaths.push(resolvedPath);
            cleanedSource = cleanedSource.replace(
              fullMatch,
              convertInlineLoaderToSet(id, sassResult.css, asVar, nonce, 'css'),
            );
            continue;
          } catch (error) {
            console.error(`[preprocessLoadTags] Sass compilation failed for: ${resolvedPath}`, error.message);
          }
        }
        if (loaderChain === 'less') {
          try {
            const lessResult = await _less.default.render(_fs.default.readFileSync(resolvedPath, 'utf8'), {
              filename: resolvedPath,
            });
            const id = `__inline_less_${inlineLoaderId++}__`;
            inlineRawContent.push({
              id,
              content: lessResult.css,
            });
            inlineFilePaths.push(resolvedPath);
            cleanedSource = cleanedSource.replace(
              fullMatch,
              convertInlineLoaderToSet(id, lessResult.css, asVar, nonce, 'css'),
            );
            continue;
          } catch (error) {
            console.error(`[preprocessLoadTags] LESS compilation failed for: ${resolvedPath}`, error.message);
          }
        }
        if (loaderChain === 'js') {
          try {
            const result = await _esbuild.default.build({
              entryPoints: [resolvedPath],
              write: false,
              bundle: true,
              minify: false,
              target: getTsconfigTarget(),
              format: 'iife',
            });
            const bundledCode = result.outputFiles[0].text;
            const id = `__inline_js_${inlineLoaderId++}__`;
            inlineRawContent.push({
              id,
              content: bundledCode,
            });
            inlineFilePaths.push(resolvedPath);
            cleanedSource = cleanedSource.replace(
              fullMatch,
              convertInlineLoaderToSet(id, bundledCode, asVar, nonce, 'js'),
            );
            continue;
          } catch (error) {
            console.error(`[preprocessLoadTags] Failed to process JS file: ${resolvedPath}`, error.message);
          }
        }
        if (loaderChain === 'ts') {
          try {
            const result = await _esbuild.default.build({
              entryPoints: [resolvedPath],
              write: false,
              bundle: true,
              loader: {
                '.ts': 'ts',
              },
              minify: false,
              target: getTsconfigTarget(),
              format: 'iife',
            });
            const bundledCode = result.outputFiles[0].text;
            const id = `__inline_ts_${inlineLoaderId++}__`;
            inlineRawContent.push({
              id,
              content: bundledCode,
            });
            inlineFilePaths.push(resolvedPath);
            cleanedSource = cleanedSource.replace(
              fullMatch,
              convertInlineLoaderToSet(id, bundledCode, asVar, nonce, 'js'),
            );
            continue;
          } catch (error) {
            console.error(`[preprocessLoadTags] TypeScript compilation failed for: ${resolvedPath}`, error.message);
          }
        }
        if (loaderChain === 'mjs') {
          try {
            const result = await _esbuild.default.build({
              entryPoints: [resolvedPath],
              write: false,
              bundle: true,
              minify: false,
              target: getTsconfigTarget(),
              format: 'esm',
            });
            const bundledCode = result.outputFiles[0].text;
            const id = `__inline_mjs_${inlineLoaderId++}__`;
            inlineRawContent.push({
              id,
              content: bundledCode,
            });
            inlineFilePaths.push(resolvedPath);
            cleanedSource = cleanedSource.replace(
              fullMatch,
              convertInlineLoaderToSet(id, bundledCode, asVar, nonce, 'esm'),
            );
            continue;
          } catch (error) {
            console.error(`[preprocessLoadTags] Failed to process MJS file: ${resolvedPath}`, error.message);
          }
        }
        if (loaderChain === 'html') {
          try {
            const content = _fs.default.readFileSync(resolvedPath, 'utf8');
            const id = `__inline_html_${inlineLoaderId++}__`;
            inlineRawContent.push({
              id,
              content,
            });
            inlineFilePaths.push(resolvedPath);
            cleanedSource = cleanedSource.replace(
              fullMatch,
              convertInlineLoaderToSet(id, content, asVar, nonce, 'html'),
            );
            continue;
          } catch (error) {
            console.error(`[preprocessLoadTags] Failed to read HTML file: ${resolvedPath}`, error.message);
          }
        }
        if (loaderChain === 'svg') {
          try {
            const content = _fs.default.readFileSync(resolvedPath, 'utf8');
            const id = `__inline_svg_${inlineLoaderId++}__`;
            inlineRawContent.push({
              id,
              content,
            });
            inlineFilePaths.push(resolvedPath);
            cleanedSource = cleanedSource.replace(
              fullMatch,
              convertInlineLoaderToSet(id, content, asVar, nonce, 'html'),
            );
            continue;
          } catch (error) {
            console.error(`[preprocessLoadTags] Failed to read SVG file: ${resolvedPath}`, error.message);
          }
        }
        if (loaderChain === 'json') {
          try {
            const content = _fs.default.readFileSync(resolvedPath, 'utf8');
            const jsonContent = JSON.parse(content);
            const id = `__inline_json_${inlineLoaderId++}__`;
            inlineRawContent.push({
              id,
              content: JSON.stringify(jsonContent),
            });
            inlineFilePaths.push(resolvedPath);
            cleanedSource = cleanedSource.replace(
              fullMatch,
              convertInlineLoaderToSet(id, JSON.stringify(jsonContent), asVar, nonce, 'json'),
            );
            continue;
          } catch (error) {
            console.error(`[preprocessLoadTags] Failed to read JSON file: ${resolvedPath}`, error.message);
          }
        }
        if (loaderChain === 'yaml') {
          try {
            const content = _fs.default.readFileSync(resolvedPath, 'utf8');
            const yamlContent = _jsYaml.default.load(content);
            const id = `__inline_yaml_${inlineLoaderId++}__`;
            inlineRawContent.push({
              id,
              content: JSON.stringify(yamlContent),
            });
            inlineFilePaths.push(resolvedPath);
            cleanedSource = cleanedSource.replace(
              fullMatch,
              convertInlineLoaderToSet(id, JSON.stringify(yamlContent), asVar, nonce, 'json'),
            );
            continue;
          } catch (error) {
            console.error(`[preprocessLoadTags] Failed to read YAML file: ${resolvedPath}`, error.message);
          }
        }
        if (loaderChain === 'json5') {
          try {
            const content = _fs.default.readFileSync(resolvedPath, 'utf8');
            const json5Content = _json.default.default
              ? _json.default.default.parse(content)
              : _json.default.parse(content);
            const id = `__inline_json5_${inlineLoaderId++}__`;
            inlineRawContent.push({
              id,
              content: JSON.stringify(json5Content),
            });
            inlineFilePaths.push(resolvedPath);
            cleanedSource = cleanedSource.replace(
              fullMatch,
              convertInlineLoaderToSet(id, JSON.stringify(json5Content), asVar, nonce, 'json'),
            );
            continue;
          } catch (error) {
            console.error(`[preprocessLoadTags] Failed to read JSON5 file: ${resolvedPath}`, error.message);
          }
        }
        if (loaderChain === 'txt') {
          try {
            const content = _fs.default.readFileSync(resolvedPath, 'utf8');
            const id = `__inline_txt_${inlineLoaderId++}__`;
            inlineRawContent.push({
              id,
              content,
            });
            inlineFilePaths.push(resolvedPath);
            cleanedSource = cleanedSource.replace(
              fullMatch,
              convertInlineLoaderToSet(id, content, asVar, nonce, 'txt'),
            );
            continue;
          } catch (error) {
            console.error(`[preprocessLoadTags] Failed to read TXT file: ${resolvedPath}`, error.message);
          }
        }
        if (loaderChain === 'md' || loaderChain === 'markdown') {
          try {
            const content = _fs.default.readFileSync(resolvedPath, 'utf8');
            const htmlContent = _marked.marked.parse(content);
            const id = `__inline_md_${inlineLoaderId++}__`;
            inlineRawContent.push({
              id,
              content: htmlContent,
            });
            inlineFilePaths.push(resolvedPath);
            cleanedSource = cleanedSource.replace(
              fullMatch,
              convertInlineLoaderToSet(id, htmlContent, asVar, nonce, 'html'),
            );
            continue;
          } catch (error) {
            console.error(`[preprocessLoadTags] Failed to read Markdown file: ${resolvedPath}`, error.message);
          }
        }
        if (loaderChain === 'toml') {
          try {
            const content = _fs.default.readFileSync(resolvedPath, 'utf8');
            const tomlContent = _toml.default.parse(content);
            const id = `__inline_toml_${inlineLoaderId++}__`;
            inlineRawContent.push({
              id,
              content: JSON.stringify(tomlContent),
            });
            inlineFilePaths.push(resolvedPath);
            cleanedSource = cleanedSource.replace(
              fullMatch,
              convertInlineLoaderToSet(id, JSON.stringify(tomlContent), asVar, nonce, 'json'),
            );
            continue;
          } catch (error) {
            console.error(`[preprocessLoadTags] Failed to read TOML file: ${resolvedPath}`, error.message);
          }
        }
        if (loaderChain === 'xml') {
          try {
            const content = _fs.default.readFileSync(resolvedPath, 'utf8');
            const parser = new _fastXmlParser.XMLParser();
            const xmlContent = parser.parse(content);
            const id = `__inline_xml_${inlineLoaderId++}__`;
            inlineRawContent.push({
              id,
              content: JSON.stringify(xmlContent),
            });
            inlineFilePaths.push(resolvedPath);
            cleanedSource = cleanedSource.replace(
              fullMatch,
              convertInlineLoaderToSet(id, JSON.stringify(xmlContent), asVar, nonce, 'json'),
            );
            continue;
          } catch (error) {
            console.error(`[preprocessLoadTags] Failed to read XML file: ${resolvedPath}`, error.message);
          }
        }
        if (loaderChain === 'base64') {
          try {
            const content = _fs.default.readFileSync(resolvedPath);
            const base64Content = content.toString('base64');
            const id = `__inline_base64_${inlineLoaderId++}__`;
            inlineRawContent.push({
              id,
              content: base64Content,
            });
            inlineFilePaths.push(resolvedPath);
            cleanedSource = cleanedSource.replace(
              fullMatch,
              convertInlineLoaderToSet(id, base64Content, asVar, nonce, 'txt'),
            );
            continue;
          } catch (error) {
            console.error(`[preprocessLoadTags] Failed to read file for Base64: ${resolvedPath}`, error.message);
          }
        }
        if (loaderChain === 'url') {
          try {
            const content = _fs.default.readFileSync(resolvedPath);
            const base64Content = content.toString('base64');
            const mimeType = getMimeType(resolvedPath);
            const dataUri = `data:${mimeType};base64,${base64Content}`;
            const id = `__inline_url_${inlineLoaderId++}__`;
            inlineRawContent.push({
              id,
              content: dataUri,
            });
            inlineFilePaths.push(resolvedPath);
            cleanedSource = cleanedSource.replace(
              fullMatch,
              convertInlineLoaderToSet(id, dataUri, asVar, nonce, 'txt'),
            );
            continue;
          } catch (error) {
            console.error(`[preprocessLoadTags] Failed to read file for URL: ${resolvedPath}`, error.message);
          }
        }
        if (loaderChain === 'env') {
          const envPath = resolvedPath.replace(/\\/g, '/').split('/').pop();
          const envValue = process.env[envPath];
          const id = `__inline_env_${inlineLoaderId++}__`;
          const content = envValue !== undefined ? String(envValue) : '';
          inlineRawContent.push({
            id,
            content,
          });
          cleanedSource = cleanedSource.replace(fullMatch, convertInlineLoaderToSet(id, content, asVar, nonce, 'txt'));
          continue;
        }
        if (loaderChain === 'glob') {
          try {
            const pattern = resolvedPath;
            const files = _glob.glob.sync(pattern);
            const contents = files.map((f) => ({
              path: f,
              content: _fs.default.readFileSync(f, 'utf8'),
            }));
            const id = `__inline_glob_${inlineLoaderId++}__`;
            inlineRawContent.push({
              id,
              content: JSON.stringify(contents),
            });
            for (const f of files) {
              inlineFilePaths.push(f);
            }
            cleanedSource = cleanedSource.replace(
              fullMatch,
              convertInlineLoaderToSet(id, JSON.stringify(contents), asVar, nonce, 'json'),
            );
            continue;
          } catch (error) {
            console.error(`[preprocessLoadTags] Failed to read glob pattern: ${resolvedPath}`, error.message);
          }
        }
        if (loaderChain === 'csv') {
          try {
            const content = _fs.default.readFileSync(resolvedPath, 'utf8');
            const csvData = parseCSV(content);
            const id = `__inline_csv_${inlineLoaderId++}__`;
            inlineRawContent.push({
              id,
              content: JSON.stringify(csvData),
            });
            inlineFilePaths.push(resolvedPath);
            cleanedSource = cleanedSource.replace(
              fullMatch,
              convertInlineLoaderToSet(id, JSON.stringify(csvData), asVar, nonce, 'json'),
            );
            continue;
          } catch (error) {
            console.error(`[preprocessLoadTags] Failed to read CSV file: ${resolvedPath}`, error.message);
          }
        }
        if (loaderChain === 'ini') {
          try {
            const content = _fs.default.readFileSync(resolvedPath, 'utf8');
            const iniData = parseINI(content);
            const id = `__inline_ini_${inlineLoaderId++}__`;
            inlineRawContent.push({
              id,
              content: JSON.stringify(iniData),
            });
            inlineFilePaths.push(resolvedPath);
            cleanedSource = cleanedSource.replace(
              fullMatch,
              convertInlineLoaderToSet(id, JSON.stringify(iniData), asVar, nonce, 'json'),
            );
            continue;
          } catch (error) {
            console.error(`[preprocessLoadTags] Failed to read INI file: ${resolvedPath}`, error.message);
          }
        }
        if (loaderChain === 'glsl') {
          try {
            const content = _fs.default.readFileSync(resolvedPath, 'utf8');
            const id = `__inline_glsl_${inlineLoaderId++}__`;
            inlineRawContent.push({
              id,
              content,
            });
            inlineFilePaths.push(resolvedPath);
            cleanedSource = cleanedSource.replace(
              fullMatch,
              convertInlineLoaderToSet(id, content, asVar, nonce, 'txt'),
            );
            continue;
          } catch (error) {
            console.error(`[preprocessLoadTags] Failed to read GLSL file: ${resolvedPath}`, error.message);
          }
        }
        if (loaderChain === 'vert') {
          try {
            const content = _fs.default.readFileSync(resolvedPath, 'utf8');
            const id = `__inline_vert_${inlineLoaderId++}__`;
            inlineRawContent.push({
              id,
              content,
            });
            inlineFilePaths.push(resolvedPath);
            cleanedSource = cleanedSource.replace(
              fullMatch,
              convertInlineLoaderToSet(id, content, asVar, nonce, 'txt'),
            );
            continue;
          } catch (error) {
            console.error(`[preprocessLoadTags] Failed to read Vertex shader file: ${resolvedPath}`, error.message);
          }
        }
        if (loaderChain === 'frag') {
          try {
            const content = _fs.default.readFileSync(resolvedPath, 'utf8');
            const id = `__inline_frag_${inlineLoaderId++}__`;
            inlineRawContent.push({
              id,
              content,
            });
            inlineFilePaths.push(resolvedPath);
            cleanedSource = cleanedSource.replace(
              fullMatch,
              convertInlineLoaderToSet(id, content, asVar, nonce, 'txt'),
            );
            continue;
          } catch (error) {
            console.error(`[preprocessLoadTags] Failed to read Fragment shader file: ${resolvedPath}`, error.message);
          }
        }
      }
    }
    if (isAbsoluteTemplatePath(templatePath)) {
      loadTemplates.push(templatePath);
      cleanedSource = cleanedSource.replace(fullMatch, convertLoadToInclude(fullMatch, templatePath));
    } else if (contextDir) {
      const resolvedPath = _pathe.default.resolve(contextDir, templatePath);
      loadTemplates.push(resolvedPath);
      cleanedSource = cleanedSource.replace(fullMatch, convertLoadToInclude(fullMatch, templatePath));
    } else {
      loadTemplates.push(templatePath);
      cleanedSource = cleanedSource.replace(fullMatch, convertLoadToInclude(fullMatch, templatePath));
    }
  }
  return {
    cleanedSource,
    loadTemplates,
    inlineRawContent,
    inlineFilePaths,
  };
}
