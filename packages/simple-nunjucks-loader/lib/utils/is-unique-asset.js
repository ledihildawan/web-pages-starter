Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.isUniqueAsset = void 0;
var _isUniqueObject = require('./is-unique-object');
const isUniqueAsset = (exports.isUniqueAsset = (0, _isUniqueObject.isUniqueObject)(getAssetIndex));
function getAssetIndex(list, item) {
  return list.findIndex((listItem) => listItem.toString() === item.toString());
}
