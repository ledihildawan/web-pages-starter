export const theme = {
  colors: {
    brand: {
      50: '#fffbe6',
      100: '#fff5b8',
      200: '#ffea85',
      300: '#ffde51',
      400: '#ffd722',
      500: '#f5c900',
      600: '#d4a800',
      700: '#a98300',
      800: '#856400',
      900: '#6a5000',
    },
    background: {
      light: '#ffffff',
      dark: '#18181b',
    },
    foreground: {
      light: '#18181b',
      dark: '#fafafa',
    },
    card: {
      light: '#ffffff',
      dark: '#27272a',
    },
    muted: {
      light: '#f4f4f5',
      dark: '#27272a',
    },
    border: {
      light: '#e4e4e7',
      dark: '#3f3f46',
    },
  },
  radius: {
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
  transitions: {
    fast: '150ms ease-out',
    normal: '200ms ease-out',
    slow: '300ms ease-out',
  },
} as const;

export const languages = {
  id: { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
  en: { code: 'en', name: 'English', flag: '🇬🇧' },
} as const;

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
} as const;