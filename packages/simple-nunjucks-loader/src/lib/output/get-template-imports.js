import { getExtensions } from './get-extensions';
import { getFilters } from './get-filters';
import { getGlobals } from './get-globals';
import { getRuntimeImport } from './get-runtime-import';
import { getTemplateDependenciesImport } from './get-template-dependencies-import';

export async function getTemplateImports(loader, esModule, { dependencies, extensions, filters, globals }) {
  return `
    ${getRuntimeImport(loader, esModule)}
    ${getTemplateDependenciesImport(loader, esModule, dependencies)}
    ${getGlobals(globals).imports()}
    ${getExtensions(extensions).imports()}
    ${await getFilters(filters).imports()}
    `;
}
