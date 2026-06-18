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

export const aliasPaths = {
  '@': '.',
  '@config': 'configs',
  '@constants': 'constants.ts',
  '@generated': 'generated',
  '@i18n': 'packages/i18n',
  '@page-system': 'packages/page-system',
  '@scripts': 'scripts',
  '@template-engine': 'packages/template-engine',
  '@utils': 'utils',
} as const satisfies Record<AliasKey, string>;
