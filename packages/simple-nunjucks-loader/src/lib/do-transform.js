import { dirname } from 'pathe';

import { hasAsyncTags } from './ast/has-async-tags';
import { getLoaderOutput } from './output/get-loader-output';
import { getTemplateImports } from './output/get-template-imports';
import { configureEnvironment } from './precompile/configure-environment';
import { getAST } from './precompile/get-ast';
import { getUsedDependencies } from './precompile/get-used-dependencies';
import { precompileToLocalVar } from './precompile/precompile-to-local-var';
import { wrapAddons } from './precompile/wrap-addons';
import { preprocessLoadTags } from './preprocess-load-tags';

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

export async function doTransform(source, loaderContext, { resourcePathImport, options }) {
  const nunjucksOptions = {
    autoescape: options.autoescape,
    throwOnUndefined: options.throwOnUndefined,
    trimBlocks: options.trimBlocks,
    lstripBlocks: options.lstripBlocks,
    tags: options.tags,
    dev: options.dev ?? loaderContext.mode === 'development',
  };

  const wrappedAddons = wrapAddons(options.extensions, options.filters, options.globals, {
    loaderContext,
    es: options.esModule,
  });

  const contextDir = dirname(resourcePathImport);
  const { cleanedSource, inlineRawContent, inlineFilePaths } = await preprocessLoadTags(source, contextDir, {
    nonce: options.nonce ?? '__NONCE__',
  });

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

  const nodes = await getAST(cleanedSource, wrappedAddons.extensions, nunjucksOptions);
  const compilerAlias = loaderContext._compiler.options.resolve?.alias || {};
  const webpackAlias = Object.keys(options.webpackAlias || {}).length > 0 ? options.webpackAlias : compilerAlias;

  const usedDependencies = await getUsedDependencies(
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

  const outputImports = await getTemplateImports(loaderContext, options.esModule, {
    dependencies: usedDependencies.templates,
    extensions: usedDependencies.extensions,
    filters: usedDependencies.filters,
    globals: usedDependencies.globals,
  });

  const env = await configureEnvironment({
    options: nunjucksOptions,
    extensions: wrappedAddons.extensions,
    filters: wrappedAddons.filters,
  });
  const outputPrecompiled = precompileToLocalVar(cleanedSource, resourcePathImport, env);

  const outputExport = options.esModule ? 'export default' : 'exports = module.exports =';

  const envOptions = JSON.stringify({
    ...nunjucksOptions,
    jinjaCompat: options.jinjaCompat,
    isAsyncTemplate: hasAsyncTags(nodes),
    __webpackAlias__: webpackAlias,
    __webpackContext__: contextDir,
  });

  return getLoaderOutput({
    templateImport: JSON.stringify(resourcePathImport),
    imports: outputImports,
    precompiled: outputPrecompiled,
    envOptions,
    defaultExport: outputExport,
    inlineRawContent,
  });
}
