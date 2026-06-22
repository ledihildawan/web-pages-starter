import { alias } from '@generated/paths';

export function getNunjucksPaths() {
  const searchPaths = [alias['@pages'], alias['@layouts'], alias['@']];

  const assetsPaths = [alias['@assets']];

  return { searchPaths, assetsPaths };
}
