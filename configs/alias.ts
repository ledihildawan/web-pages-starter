import path from 'node:path';

export const alias: Record<string, string> = {
  '@config': path.resolve('configs'),
  '@constants': path.resolve('constants.ts'),
  '@generated': path.resolve('generated'),
  '@i18n': path.resolve('packages', 'i18n'),
  '@template-engine': path.resolve('packages', 'template-engine'),
  '@page-system': path.resolve('packages', 'page-system'),
  '@scripts': path.resolve('scripts'),
  '@utils': path.resolve('utils'),
};
