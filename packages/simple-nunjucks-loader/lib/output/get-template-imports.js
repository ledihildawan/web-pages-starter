Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.getTemplateImports = getTemplateImports;
var _getExtensions = require('./get-extensions');
var _getFilters = require('./get-filters');
var _getGlobals = require('./get-globals');
var _getRuntimeImport = require('./get-runtime-import');
var _getTemplateDependenciesImport = require('./get-template-dependencies-import');
async function getTemplateImports(loader, esModule, { dependencies, extensions, filters, globals }) {
  return `
    ${(0, _getRuntimeImport.getRuntimeImport)(loader, esModule)}
    ${(0, _getTemplateDependenciesImport.getTemplateDependenciesImport)(loader, esModule, dependencies)}
    ${(0, _getGlobals.getGlobals)(globals).imports()}
    ${(0, _getExtensions.getExtensions)(extensions).imports()}
    ${await (0, _getFilters.getFilters)(filters).imports()}
    `;
}
