import { TEMPLATE_DEPENDENCIES } from '../constants';

import { getModuleOutput } from './get-module-output';

export function getLoaderOutput({ templateImport, imports, defaultExport, precompiled, envOptions }) {
  return `
        ${imports}
        ${precompiled}

        function nunjucksTemplate(ctx = {}) {
            var nunjucks = (${getModuleOutput('runtime')})(
                ${envOptions},
                ${TEMPLATE_DEPENDENCIES}
            );

            if (nunjucks.isAsync()) {
                return nunjucks.renderAsync(
                    ${templateImport},
                    ctx
                );
            }
        
            return nunjucks.render(
                ${templateImport},
                ctx
            );
        };

        nunjucksTemplate.__nunjucks_precompiled_template__ = ${TEMPLATE_DEPENDENCIES}.templates[${templateImport}];
        nunjucksTemplate.${TEMPLATE_DEPENDENCIES} = ${TEMPLATE_DEPENDENCIES};

        ${defaultExport} nunjucksTemplate;
    `;
}
