import { stringifyRequest } from 'loader-utils';

import { IMPORTS_PREFIX, TEMPLATE_DEPENDENCIES } from '../constants';
import { isSymbol } from '../import-wrapper/is-symbol';
import { getImportStr } from '../utils/get-import-str';
import { toRegExpSource } from '../utils/to-regexp-source';
import { toVar } from '../utils/to-var';

function getAssignments(assignments) {
  if (assignments === '') {
    return '{};';
  }

  return `{${assignments}};`;
}

function joinAssignments(assignment, importVar, key) {
  return [assignment[key], `...${importVar}.${TEMPLATE_DEPENDENCIES}.${key}`].filter(Boolean).join(',\n');
}

function getImports(imports, assignments) {
  return `
    const ${TEMPLATE_DEPENDENCIES} = {};
    ${imports}
    ${TEMPLATE_DEPENDENCIES}.templates = ${getAssignments(assignments.templates)}
    ${TEMPLATE_DEPENDENCIES}.globals = ${getAssignments(assignments.globals)}
    ${TEMPLATE_DEPENDENCIES}.extensions = ${getAssignments(assignments.extensions)}
    ${TEMPLATE_DEPENDENCIES}.filters = ${getAssignments(assignments.filters)}
    `;
}

function getDynamicTemplateImport(loaderContext, fullPath, importVar) {
  const parts = fullPath.importValue;

  let directoryRaw = '';
  let regexStr = '';
  let foundSymbol = false;

  for (const part of parts) {
    if (isSymbol(part)) {
      foundSymbol = true;
      regexStr += '.*';
    } else if (foundSymbol) {
      regexStr += toRegExpSource(part.valueOf());
    } else {
      directoryRaw += part.valueOf();
    }
  }

  if (regexStr === '' || regexStr === '.*') {
    regexStr = '.*\\.njk';
  }

  const directory = stringifyRequest(loaderContext, directoryRaw);
  const regExp = new RegExp(regexStr + '$');

  return `
    var ${importVar} = (function() {
        var __context = require.context(${directory}, true, ${regExp});
        var __result = {${TEMPLATE_DEPENDENCIES}: {templates: {}, globals: {}, extensions: {}, filters: {}}};
        __context.keys().forEach(function(__key) {
            var __mod = __context(__key);
            var __dep = (__mod && __mod.default || __mod);
            if (__dep && __dep.${TEMPLATE_DEPENDENCIES}) {
                Object.assign(__result.${TEMPLATE_DEPENDENCIES}.templates, __dep.${TEMPLATE_DEPENDENCIES}.templates || {});
                Object.assign(__result.${TEMPLATE_DEPENDENCIES}.globals, __dep.${TEMPLATE_DEPENDENCIES}.globals || {});
                Object.assign(__result.${TEMPLATE_DEPENDENCIES}.extensions, __dep.${TEMPLATE_DEPENDENCIES}.extensions || {});
                Object.assign(__result.${TEMPLATE_DEPENDENCIES}.filters, __dep.${TEMPLATE_DEPENDENCIES}.filters || {});
            }
        });
        return __result;
    })();`;
}

function foldDependenciesToImports(loaderContext, esModule, [imports, assignment], [, fullPath], i) {
  const importVar = toVar(`${IMPORTS_PREFIX}_dep_${i}`);
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

  const path = stringifyRequest(loaderContext, fullPath.toString());

  return [
    `
        ${imports}
        ${getImportStr(path, esModule)(importVar)}
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
export function getTemplateDependenciesImport(loaderContext, esModule, dependencies) {
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
