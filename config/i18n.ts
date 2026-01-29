import i18next from 'i18next';
import type { I18nResources, TranslationSchema } from '../types/i18n';

export async function initI18n(): Promise<void> {
  const id = await import('../locales/id/translation.json') as { default: TranslationSchema };
  const en = await import('../locales/en/translation.json') as { default: TranslationSchema };

  await i18next.init<I18nResources>({
    lng: 'id',
    fallbackLng: 'en',
    resources: {
      id: { translation: id.default },
      en: { translation: en.default }
    }
  });
}