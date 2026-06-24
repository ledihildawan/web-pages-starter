import { getDynamicImport } from './get-dynamic-import';

describe('get-dynamic-import', () => {
  const loaderContext = {
    context: '/project/src',
    rootContext: '/project',
  };

  test('should handle inline loaders with single bang', () => {
    const assetPath = {
      toString: () => 'style-loader!css-loader!./styles.css',
      toRegExp: () => /./,
      getHash: () => 'abc123',
    };
    const assetImport = {
      toString: () => 'style-loader!css-loader!./styles.css',
      isDynamic: () => false,
      toArgs: () => [],
    };

    const result = getDynamicImport(loaderContext, assetPath, assetImport, { esModule: true, importVar: 'myVar' });

    expect(result).toBe('import myVar from style-loader!css-loader!"./styles.css";');
  });

  test('should handle inline loaders with double bang', () => {
    const assetPath = { toString: () => '!!raw-loader!./raw.txt', toRegExp: () => /./, getHash: () => 'abc123' };
    const assetImport = { toString: () => '!!raw-loader!./raw.txt', isDynamic: () => false, toArgs: () => [] };

    const result = getDynamicImport(loaderContext, assetPath, assetImport, { esModule: true, importVar: 'myVar' });

    expect(result).toBe('import myVar from !!raw-loader!"./raw.txt";');
  });

  test('should handle inline loaders with dash prefix', () => {
    const assetPath = { toString: () => '-!no-pre-loader!./file.txt', toRegExp: () => /./, getHash: () => 'abc123' };
    const assetImport = { toString: () => '-!no-pre-loader!./file.txt', isDynamic: () => false, toArgs: () => [] };

    const result = getDynamicImport(loaderContext, assetPath, assetImport, { esModule: true, importVar: 'myVar' });

    expect(result).toBe('import myVar from -!no-pre-loader!"./file.txt";');
  });

  test('should handle inline loaders with leading bang', () => {
    const assetPath = {
      toString: () => '!style-loader!css-loader!./styles.css',
      toRegExp: () => /./,
      getHash: () => 'abc123',
    };
    const assetImport = {
      toString: () => '!style-loader!css-loader!./styles.css',
      isDynamic: () => false,
      toArgs: () => [],
    };

    const result = getDynamicImport(loaderContext, assetPath, assetImport, { esModule: true, importVar: 'myVar' });

    expect(result).toBe('import myVar from !style-loader!css-loader!"./styles.css";');
  });

  test('should handle normal paths without inline loaders', () => {
    const assetPath = { toString: () => 'foo/bar/test.txt', toRegExp: () => /./, getHash: () => 'abc123' };
    const assetImport = { toString: () => 'foo/bar/test.txt', isDynamic: () => false, toArgs: () => [] };

    const result = getDynamicImport(loaderContext, assetPath, assetImport, { esModule: true, importVar: 'myVar' });

    expect(result).toBe('import myVar from "foo/bar/test.txt";');
  });

  test('should handle non-esModule require syntax', () => {
    const assetPath = {
      toString: () => 'style-loader!css-loader!./styles.css',
      toRegExp: () => /./,
      getHash: () => 'abc123',
    };
    const assetImport = {
      toString: () => 'style-loader!css-loader!./styles.css',
      isDynamic: () => false,
      toArgs: () => [],
    };

    const result = getDynamicImport(loaderContext, assetPath, assetImport, { esModule: false, importVar: 'myVar' });

    expect(result).toBe('const myVar = require(style-loader!css-loader!"./styles.css");');
  });
});
