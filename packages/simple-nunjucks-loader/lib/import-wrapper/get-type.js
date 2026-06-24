Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.getType = getType;
const tagRegex = /\[([^ ]+) +([^[]+)]/;
function getType(instance) {
  const type = Object.prototype.toString.call(instance);
  const [, , tagType] = tagRegex.exec(type);
  return tagType;
}
