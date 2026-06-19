import tailwindcss from '@tailwindcss/postcss';
import cssnano from 'cssnano';
import pruneVar from 'postcss-prune-var';

const isBuild = process.env.NODE_ENV === 'production' || process.env.BUILD_PREVIEW === 'true';

export default {
  plugins: [tailwindcss(), pruneVar(), ...(isBuild ? [cssnano({ preset: 'default' })] : [])],
};
