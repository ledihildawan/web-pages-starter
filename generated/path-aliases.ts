import path from 'node:path';

export type AliasKey =
  | '@'
  | '@config'
  | '@constants'
  | '@generated'
  | '@i18n'
  | '@page-system'
  | '@scripts'
  | '@template-engine'
  | '@utils';

export const alias: Record<AliasKey, string> = {
  '@': path.resolve('.'),
  '@config': path.resolve('configs'),
  '@constants': path.resolve('constants.ts'),
  '@generated': path.resolve('generated'),
  '@i18n': path.resolve('packages/i18n'),
  '@page-system': path.resolve('packages/page-system'),
  '@scripts': path.resolve('scripts'),
  '@template-engine': path.resolve('packages/template-engine'),
  '@utils': path.resolve('utils'),
};
