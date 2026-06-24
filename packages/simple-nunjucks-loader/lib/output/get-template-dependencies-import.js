Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.getTemplateDependenciesImport = getTemplateDependenciesImport;
var _loaderUtils = require('loader-utils');
var _constants = require('../constants');
var _isSymbol = require('../import-wrapper/is-symbol');
var _getImportStr = require('../utils/get-import-str');
var _toRegexpSource = require('../utils/to-regexp-source');
var _toVar = require('../utils/to-var');
function getAssignments(assignments) {
  if (assignments === '') {
    return '{};';
  }
  return `{${assignments}};`;
}
function joinAssignments(assignment, importVar, key) {
  return [assignment[key], `...${importVar}.${_constants.TEMPLATE_DEPENDENCIES}.${key}`].filter(Boolean).join(',\n');
}
function getImports(imports, assignments) {
  return `
    const ${_constants.TEMPLATE_DEPENDENCIES} = {};
    ${imports}
    ${_constants.TEMPLATE_DEPENDENCIES}.templates = ${getAssignments(assignments.templates)}
    ${_constants.TEMPLATE_DEPENDENCIES}.globals = ${getAssignments(assignments.globals)}
    ${_constants.TEMPLATE_DEPENDENCIES}.extensions = ${getAssignments(assignments.extensions)}
    ${_constants.TEMPLATE_DEPENDENCIES}.filters = ${getAssignments(assignments.filters)}
    `;
}
function getDynamicTemplateImport(loaderContext, fullPath, importVar) {
  const parts = fullPath.importValue;
  let directoryRaw = '';
  let regexStr = '';
  let foundSymbol = false;
  for (const part of parts) {
    if ((0, _isSymbol.isSymbol)(part)) {
      foundSymbol = true;
      regexStr += '.*';
    } else if (foundSymbol) {
      regexStr += (0, _toRegexpSource.toRegExpSource)(part.valueOf());
    } else {
      directoryRaw += part.valueOf();
    }
  }
  if (regexStr === '' || regexStr === '.*') {
    regexStr = '.*\\.njk';
  }
  const directory = (0, _loaderUtils.stringifyRequest)(loaderContext, directoryRaw);
  const regExp = new RegExp(regexStr + '$');
  return `
    var ${importVar} = (function() {
        var __context = require.context(${directory}, true, ${regExp});
        var __result = {${_constants.TEMPLATE_DEPENDENCIES}: {templates: {}, globals: {}, extensions: {}, filters: {}}};
        __context.keys().forEach(function(__key) {
            var __mod = __context(__key);
            var __dep = (__mod && __mod.default || __mod);
            if (__dep && __dep.${_constants.TEMPLATE_DEPENDENCIES}) {
                Object.assign(__result.${_constants.TEMPLATE_DEPENDENCIES}.templates, __dep.${_constants.TEMPLATE_DEPENDENCIES}.templates || {});
                Object.assign(__result.${_constants.TEMPLATE_DEPENDENCIES}.globals, __dep.${_constants.TEMPLATE_DEPENDENCIES}.globals || {});
                Object.assign(__result.${_constants.TEMPLATE_DEPENDENCIES}.extensions, __dep.${_constants.TEMPLATE_DEPENDENCIES}.extensions || {});
                Object.assign(__result.${_constants.TEMPLATE_DEPENDENCIES}.filters, __dep.${_constants.TEMPLATE_DEPENDENCIES}.filters || {});
            }
        });
        return __result;
    })();`;
}
function foldDependenciesToImports(loaderContext, esModule, [imports, assignment], [, fullPath], i) {
  const importVar = (0, _toVar.toVar)(`${_constants.IMPORTS_PREFIX}_dep_${i}`);
  const join = joinAssignments.bind(null, assignment, importVar);
  if (fullPath.isDynamic()) {
    return [
      `
            ${imports}
            ${getDynamicTemplateImport(loaderContext, fullPath, importVar)}
            `,
      {
        templates: join('templates'),
        globals: join('globals'),
        extensions: join('extensions'),
        filters: join('filters'),
      },
    ];
  }
  const path = (0, _loaderUtils.stringifyRequest)(loaderContext, fullPath.toString());
  return [
    `
        ${imports}
        ${((0, _getImportStr.getImportStr))(path, esModule)(importVar)}
        `,
    {
      templates: join('templates'),
      globals: join('globals'),
      extensions: join('extensions'),
      filters: join('filters'),
    },
  ];
}

/**
 * Import nested templates dependencies
 *
 * @example
 *     var __nunjucks_module_dependencies__ = {}
 *     import dep0 from './nested-template.njk';
 *     __nunjucks_module_dependencies__.templates = {
 *         ...dep0.__nunjucks_module_dependencies__.templates
 *     };
 *
 * @param {Object} loaderContext
 * @param {boolean} esModule
 * @param {Array<[ImportWrapper, ImportWrapper]>} dependencies
 * @returns {string}
 */
function getTemplateDependenciesImport(loaderContext, esModule, dependencies) {
  return getImports(
    ...dependencies.reduce(foldDependenciesToImports.bind(null, loaderContext, esModule), [
      '',
      {
        templates: '',
        globals: '',
        extensions: '',
        filters: '',
      },
    ]),
  );
}
