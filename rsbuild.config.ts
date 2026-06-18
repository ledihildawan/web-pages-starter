import path from 'node:path';
import { createJiti } from 'jiti';

const jiti = createJiti(import.meta.url, {
  alias: {
    '@config': path.resolve('configs'),
    '@constants': path.resolve('constants.ts'),
    '@generated': path.resolve('generated'),
    '@i18n': path.resolve('packages', 'i18n'),
    '@template-engine': path.resolve('packages', 'template-engine'),
    '@page-system': path.resolve('packages', 'page-system'),
    '@scripts': path.resolve('scripts'),
    '@utils': path.resolve('utils'),
  },
});

const envServer = await jiti.import<typeof import('./generated/env')>('./generated/env.ts');
await envServer.loadServerEnvFiles();

const mod = await jiti.import<typeof import('./configs/rsbuild')>('./configs/rsbuild.ts');

export default mod.default;
