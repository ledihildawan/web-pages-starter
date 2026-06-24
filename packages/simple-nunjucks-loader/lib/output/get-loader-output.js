Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.getLoaderOutput = getLoaderOutput;
var _constants = require('../constants');
var _getModuleOutput = require('./get-module-output');
function getLoaderOutput({ templateImport, imports, defaultExport, precompiled, envOptions }) {
  return `
        ${imports}
        ${precompiled}

        function nunjucksTemplate(ctx = {}) {
            var nunjucks = (${(0, _getModuleOutput.getModuleOutput)('runtime')})(
                ${envOptions},
                ${_constants.TEMPLATE_DEPENDENCIES}
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

        nunjucksTemplate.__nunjucks_precompiled_template__ = ${_constants.TEMPLATE_DEPENDENCIES}.templates[${templateImport}];
        nunjucksTemplate.${_constants.TEMPLATE_DEPENDENCIES} = ${_constants.TEMPLATE_DEPENDENCIES};

        ${defaultExport} nunjucksTemplate;
    `;
}
