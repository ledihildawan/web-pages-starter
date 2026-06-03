const fs = require('fs');
const path = require('path');
const glob = require('glob');

// ARIA label translations for each locale
const ariaTranslations = {
  'en': {
    aria_monthly: 'Switch to monthly billing',
    aria_yearly: 'Switch to yearly billing'
  },
  'id': {
    aria_monthly: 'Beralih ke tagihan bulanan',
    aria_yearly: 'Beralih ke tagihan tahunan'
  },
  'es': {
    aria_monthly: 'Cambiar a facturación mensual',
    aria_yearly: 'Cambiar a facturación anual'
  },
  'fr': {
    aria_monthly: 'Passer à la facturation mensuelle',
    aria_yearly: 'Passer à la facturation annuelle'
  },
  'de': {
    aria_monthly: 'Zur monatlichen Abrechnung wechseln',
    aria_yearly: 'Zur jährlichen Abrechnung wechseln'
  },
  'pt': {
    aria_monthly: 'Mudar para faturação mensal',
    aria_yearly: 'Mudar para faturação anual'
  },
  'ar': {
    aria_monthly: 'التبديل إلى الفواتير الشهرية',
    aria_yearly: 'التبديل إلى الفواتير السنوية'
  },
  'ja': {
    aria_monthly: '月額支払いに切り替え',
    aria_yearly: '年額支払いに切り替え'
  },
  'ko': {
    aria_monthly: '월결제로 전환',
    aria_yearly: '년결제로 전환'
  },
  'zh-Hans': {
    aria_monthly: '切换到按月计费',
    aria_yearly: '切换到按年计费'
  },
  'zh-Hant': {
    aria_monthly: '切換到按月計費',
    aria_yearly: '切換到按年計費'
  },
  'hi': {
    aria_monthly: 'मासिक बिलिंग पर स्विच करें',
    aria_yearly: 'वार्षिक बिलिंग पर स्विच करें'
  },
  'ru': {
    aria_monthly: 'Переключиться на ежемесячную оплату',
    aria_yearly: 'Переключиться на ежегодную оплату'
  }
};

// Map locale codes to language codes
const localeToLang = {
  'en-US': 'en', 'en-GB': 'en', 'en-CA': 'en', 'en-AU': 'en', 'en-IN': 'en', 'en-NZ': 'en', 'en-ZA': 'en',
  'id-ID': 'id',
  'es-ES': 'es', 'es-AR': 'es', 'es-MX': 'es', 'es-CO': 'es', 'es-PE': 'es',
  'fr-FR': 'fr', 'fr-BE': 'fr', 'fr-CA': 'fr', 'fr-CH': 'fr',
  'de-DE': 'de', 'de-AT': 'de', 'de-CH': 'de',
  'pt-BR': 'pt', 'pt-PT': 'pt', 'pt-AO': 'pt', 'pt-MZ': 'pt',
  'ar-SA': 'ar', 'ar-AE': 'ar', 'ar-EG': 'ar', 'ar-MA': 'ar', 'ar-TN': 'ar',
  'ja-JP': 'ja',
  'ko-KR': 'ko', 'ko-KP': 'ko',
  'zh-Hans-CN': 'zh-Hans', 'zh-Hans-SG': 'zh-Hans', 'zh-Hans-MY': 'zh-Hans',
  'zh-Hant-TW': 'zh-Hant', 'zh-Hant-HK': 'zh-Hant', 'zh-Hant-MO': 'zh-Hant',
  'hi-IN': 'hi', 'hi-NP': 'hi',
  'ru-RU': 'ru'
};

const files = glob.sync('src/locales/*/pricing.json5', { cwd: __dirname + '/..' });

let updatedCount = 0;

files.forEach(file => {
  const locale = file.match(/locales\/([^\/]+)\//)?.[1];
  if (!locale) return;

  const lang = localeToLang[locale];
  const translations = ariaTranslations[lang];

  if (!translations) {
    console.log(`Skipping ${locale} - no translations`);
    return;
  }

  const fullPath = path.join(__dirname, '..', file);
  const content = fs.readFileSync(fullPath, 'utf8');

  // Check if already updated
  if (content.includes('aria_monthly')) {
    console.log(`Skipping ${locale} - already updated`);
    return;
  }

  // Replace aria_label with aria_monthly and aria_yearly
  const updated = content.replace(
    /"aria_label":\s*"[^"]+"/,
    `"aria_monthly": "${translations.aria_monthly}",\n    "aria_yearly": "${translations.aria_yearly}"`
  );

  if (updated !== content) {
    fs.writeFileSync(fullPath, updated);
    console.log(`Updated ${locale}`);
    updatedCount++;
  }
});

console.log(`\nTotal updated: ${updatedCount} files`);
