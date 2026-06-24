Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.isUniqueTemplate = void 0;
var _isUniqueObject = require('./is-unique-object');
const isUniqueTemplate = (exports.isUniqueTemplate = (0, _isUniqueObject.isUniqueObject)(getTemplateIndex));
function getTemplateIndex(list, templateDescriptor) {
  const [templateImport, templatePath] = templateDescriptor;
  return list.findIndex(function compareImports([itemImport, itemPath]) {
    return itemImport.toString() === templateImport.toString() && itemPath.toString() === templatePath.toString();
  });
}
