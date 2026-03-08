export const LANGUAGES = [
  { code: 'id', label: 'Bahasa Indonesia', flag: 'id' },
  { code: 'en-US', label: 'English (US)', flag: 'us' },
  { code: 'en-GB', label: 'English (UK)', flag: 'gb' },
  { code: 'ja', label: '日本語', flag: 'jp' },
  { code: 'zh-CN', label: '简体中文', flag: 'cn' },
  { code: 'ar', label: 'العربية', flag: 'sa' }
];

export const SUPPORTED_LANG_CODES = LANGUAGES.map(l => l.code);
export const DEFAULT_LANG = 'id';