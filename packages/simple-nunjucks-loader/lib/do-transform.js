Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.doTransform = doTransform;
var _pathe = require('pathe');
var _hasAsyncTags = require('./ast/has-async-tags');
var _getLoaderOutput = require('./output/get-loader-output');
var _getTemplateImports = require('./output/get-template-imports');
var _configureEnvironment = require('./precompile/configure-environment');
var _getAst = require('./precompile/get-ast');
var _getUsedDependencies = require('./precompile/get-used-dependencies');
var _precompileToLocalVar = require('./precompile/precompile-to-local-var');
var _wrapAddons = require('./precompile/wrap-addons');
var _preprocessLoadTags = require('./preprocess-load-tags');
/**
 * Register resolved file paths as webpack dependencies so that
 * webpack properly tracks them during incremental rebuilds / HMR.
 *
 * @param {Object} loaderContext
 * @param {Array<[ImportWrapper, ImportWrapper]>} templates
 */
function registerDependencies(loaderContext, templates) {
  if (typeof loaderContext.addDependency !== 'function') {
    return;
  }
  for (const [, resolvedPath] of templates) {
    if (!resolvedPath.isDynamic()) {
      loaderContext.addDependency(resolvedPath.toString());
    }
  }
}
async function doTransform(source, loaderContext, { resourcePathImport, options }) {
  var _loaderContext$_compi;
  const nunjucksOptions = {
    autoescape: options.autoescape,
    throwOnUndefined: options.throwOnUndefined,
    trimBlocks: options.trimBlocks,
    lstripBlocks: options.lstripBlocks,
    tags: options.tags,
    dev: options.dev ?? loaderContext.mode === 'development',
  };
  const wrappedAddons = (0, _wrapAddons.wrapAddons)(options.extensions, options.filters, options.globals, {
    loaderContext,
    es: options.esModule,
  });
  const contextDir = (0, _pathe.dirname)(resourcePathImport);
  const { cleanedSource, inlineRawContent, inlineFilePaths } = await (0, _preprocessLoadTags.preprocessLoadTags)(
    source,
    contextDir,
    {
      nonce: options.nonce ?? '__NONCE__',
    },
  );
  for (const filePath of inlineFilePaths) {
    if (typeof loaderContext.addDependency === 'function') {
      loaderContext.addDependency(filePath);
    }
    if (typeof loaderContext.addBuildDependency === 'function') {
      loaderContext.addBuildDependency(filePath);
    }
  }
  if (typeof loaderContext.addContextDependency === 'function' && contextDir) {
    loaderContext.addContextDependency(contextDir);
  }
  const nodes = await (0, _getAst.getAST)(cleanedSource, wrappedAddons.extensions, nunjucksOptions);
  const compilerAlias =
    ((_loaderContext$_compi = loaderContext._compiler.options.resolve) === null || _loaderContext$_compi === void 0
      ? void 0
      : _loaderContext$_compi.alias) || {};
  const webpackAlias = Object.keys(options.webpackAlias || {}).length > 0 ? options.webpackAlias : compilerAlias;
  const usedDependencies = await (0, _getUsedDependencies.getUsedDependencies)(
    loaderContext,
    nodes,
    wrappedAddons.extensions,
    wrappedAddons.filters,
    wrappedAddons.globals,
    {
      ...options,
      webpackAlias,
    },
  );
  registerDependencies(loaderContext, usedDependencies.templates);
  const outputImports = await (0, _getTemplateImports.getTemplateImports)(loaderContext, options.esModule, {
    dependencies: usedDependencies.templates,
    extensions: usedDependencies.extensions,
    filters: usedDependencies.filters,
    globals: usedDependencies.globals,
  });
  const env = await (0, _configureEnvironment.configureEnvironment)({
    options: nunjucksOptions,
    extensions: wrappedAddons.extensions,
    filters: wrappedAddons.filters,
  });
  const outputPrecompiled = (0, _precompileToLocalVar.precompileToLocalVar)(cleanedSource, resourcePathImport, env);
  const outputExport = options.esModule ? 'export default' : 'exports = module.exports =';
  const envOptions = JSON.stringify({
    ...nunjucksOptions,
    jinjaCompat: options.jinjaCompat,
    isAsyncTemplate: (0, _hasAsyncTags.hasAsyncTags)(nodes),
    __webpackAlias__: webpackAlias,
    __webpackContext__: contextDir,
  });
  return (0, _getLoaderOutput.getLoaderOutput)({
    templateImport: JSON.stringify(resourcePathImport),
    imports: outputImports,
    precompiled: outputPrecompiled,
    envOptions,
    defaultExport: outputExport,
    inlineRawContent,
  });
}
