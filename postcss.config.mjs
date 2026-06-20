import tailwindcss from '@tailwindcss/postcss';
import cssnano from 'cssnano';
import postcssImport from 'postcss-import';
import pruneVar from 'postcss-prune-var';
import { alias, lookup } from './generated/paths.ts';

const isBuild = process.env.NODE_ENV === 'production' || process.env.BUILD_PREVIEW === 'true';

export default {
  plugins: [
    postcssImport({
      root: process.cwd(),
      path: Object.keys(alias)
        .filter((key) => key !== '@')
        .map((key) => alias[key]),
      filter(id) {
        return id.startsWith('@') || id.startsWith('.');
      },
      resolve(id) {
        for (const aliasKey of Object.keys(alias)) {
          if (aliasKey === '@') continue;
          if (id.startsWith(`${aliasKey}/`)) {
            const relativePath = id.slice(aliasKey.length + 1);
            return lookup(aliasKey, relativePath);
          }
        }
        return id;
      },
      skipDuplicates: true,
    }),
    tailwindcss(),
    ...(isBuild ? [pruneVar(), cssnano({ preset: 'default' })] : []),
  ],
};
