import tailwindcss from '@tailwindcss/postcss';
import pruneVar from 'postcss-prune-var';

export default {
  plugins: [tailwindcss(), pruneVar()],
};
