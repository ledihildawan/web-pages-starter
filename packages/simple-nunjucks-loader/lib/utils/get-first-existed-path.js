Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.getFirstExistedPath = getFirstExistedPath;
var _fs = _interopRequireDefault(require('fs'));
var _util = require('util');
var _getGlob = require('./get-glob');
function _interopRequireDefault(e) {
  return e && e.__esModule ? e : { default: e };
}
const fsAccess = (0, _util.promisify)(_fs.default.access);

/**
 * @param {ImportWrapper} path
 * @returns {Promise<boolean>}
 */
async function isExists(path) {
  if (path.isDynamic()) {
    const glob = await (0, _getGlob.getGlob)();
    const files = await glob(path.toGlob());
    return files.length > 0;
  }
  try {
    const pathStr = path.toString().replace(/\\/g, '/');
    await fsAccess(pathStr);
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {ImportWrapper[]} paths
 * @returns {Promise<ImportWrapper>}
 */
async function getFirstExistedPath(paths) {
  for (const path of paths) {
    const exist = await isExists(path);
    if (exist) {
      return path;
    }
  }
  throw new Error('Path not found');
}
