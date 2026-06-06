export type FontWeightList = readonly number[];

export type FontConfig = {
  name: string;
  family: string;
  variants: {
    default: FontWeightList;
    cyrillic?: FontWeightList;
  };
};

export type FontStack = {
  primary: FontConfig;
  secondary?: FontConfig;
  monospace?: FontConfig;
};

export const FONT_STACK: FontStack = {
  primary: {
    name: 'inter',
    family: 'Inter',
    variants: {
      default: [400, 500, 600, 700, 800, 900],
      cyrillic: [400, 500, 600, 700, 800, 900],
    },
  },
};
