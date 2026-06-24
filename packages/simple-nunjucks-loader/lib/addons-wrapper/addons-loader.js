Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.addonsLoader = addonsLoader;
function addonsLoader(list) {
  return Promise.all(list.map((item) => Promise.resolve(item.instance).then(() => item)));
}
