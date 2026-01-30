import i18next from 'i18next';
import type { I18nResources, TranslationSchema } from '../types/i18n';

const loadTranslations = async (): Promise<{ id: TranslationSchema; en: TranslationSchema }> => {
  const [id, en] = await Promise.all([
    import('../locales/id/translation.json') as Promise<{ default: TranslationSchema }>,
    import('../locales/en/translation.json') as Promise<{ default: TranslationSchema }>,
  ]);

  return { id: id.default, en: en.default };
};

export const initI18n = async (lng: string = 'id'): Promise<void> => {
  const translations = await loadTranslations();

  await i18next.init<I18nResources>({
    lng,
    fallbackLng: 'en',
    resources: {
      id: { translation: translations.id },
      en: { translation: translations.en },
    },
  });
};