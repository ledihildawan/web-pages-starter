import path from 'node:path';
import { createJiti } from 'jiti';

const jiti = createJiti(import.meta.url, {
  alias: {
    '@config': path.resolve('configs'),
    '@constants': path.resolve('constants.ts'),
    '@generated': path.resolve('generated'),
    '@i18n': path.resolve('packages', 'i18n'),
    '@page-engine': path.resolve('packages', 'page-engine'),
    '@scripts': path.resolve('scripts'),
    '@utils': path.resolve('utils'),
  },
});

const mod = await jiti.import<typeof import('./configs/rsbuild')>('./configs/rsbuild.ts');

export default mod.default;
