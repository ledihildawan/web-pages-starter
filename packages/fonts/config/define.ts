import type { FontConfig, FontStack } from './types';

const validateFont = (font: FontConfig): void => {
  if (!font.name || !/^[\w-]+$/.test(font.name)) {
    throw new Error(`[fonts] font.name must be a valid identifier (letters, digits, hyphens only)`);
  }
  if (!font.family.trim()) {
    throw new Error('[fonts] font.family is required');
  }
};

export const defineFont = (config: FontConfig): FontConfig => {
  validateFont(config);
  return config;
};

export const defineFontStack = (stack: FontStack): FontStack => {
  if (!stack.sans) {
    throw new Error('[fonts] fontsConfig.sans is required');
  }
  for (const font of Object.values(stack)) {
    if (font) validateFont(font);
  }
  return stack;
};
