import tailwindcss from '@tailwindcss/postcss';
import cssnano from 'cssnano';
import pruneVar from 'postcss-prune-var';

export default {
  plugins: [
    tailwindcss(),
    pruneVar(),
    ...(process.env.NODE_ENV === 'production' ? [cssnano({ preset: 'default' })] : []),
  ],
};
