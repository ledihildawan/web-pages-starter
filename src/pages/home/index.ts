import './components/features.css';
import { i18next, t } from '@/scripts/lib/i18n/runtime';

const onLanguageChanged = (lng: string) => {
  console.log('[i18n] locale changed:', lng);
  console.log('[i18n] home:hero.primary_btn.label =', t('home:hero.primary_btn.label'));
};

i18next.on('languageChanged', onLanguageChanged);
onLanguageChanged(i18next.language);
