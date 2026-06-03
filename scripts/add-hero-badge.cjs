const fs = require('fs');
const path = require('path');
const JSON5 = require('json5');

// Badge translations for each locale
const badgeTranslations = {
  'id-ID': 'Pilih Paket Anda',
  'en-US': 'Choose Your Plan',
  'en-GB': 'Choose Your Plan',
  'en-CA': 'Choose Your Plan',
  'en-AU': 'Choose Your Plan',
  'en-IN': 'Choose Your Plan',
  'en-NZ': 'Choose Your Plan',
  'en-ZA': 'Choose Your Plan',
  'ja-JP': 'プランを選択',
  'ko-KR': '플랜 선택',
  'ko-KP': '플랜 선택',
  'zh-Hans-CN': '选择您的计划',
  'zh-Hans-SG': '选择您的计划',
  'zh-Hans-MY': '选择您的计划',
  'zh-Hant-TW': '選擇您的方案',
  'zh-Hant-HK': '選擇您的方案',
  'zh-Hant-MO': '選擇您的方案',
  'ar-SA': 'اختر خطتك',
  'ar-AE': 'اختر خطتك',
  'ar-EG': 'اختر خطتك',
  'ar-MA': 'اختر خطتك',
  'ar-TN': 'اختر خطتك',
  'de-DE': 'Wählen Sie Ihren Plan',
  'de-AT': 'Wählen Sie Ihren Plan',
  'de-CH': 'Wählen Sie Ihren Plan',
  'fr-FR': 'Choisissez votre forfait',
  'fr-BE': 'Choisissez votre forfait',
  'fr-CA': 'Choisissez votre forfait',
  'fr-CH': 'Choisissez votre forfait',
  'es-ES': 'Elige tu plan',
  'es-AR': 'Elige tu plan',
  'es-MX': 'Elige tu plan',
  'es-CO': 'Elige tu plan',
  'es-PE': 'Elige tu plan',
  'pt-BR': 'Escolha seu plano',
  'pt-PT': 'Escolha o seu plano',
  'pt-AO': 'Escolha o seu plano',
  'pt-MZ': 'Escolha o seu plano',
  'hi-IN': 'अपनी योजना चुनें',
  'hi-NP': 'अपनी योजना चुनें',
  'ru-RU': 'Выберите свой план',
};

const localesDir = path.join(__dirname, '../src/locales');
const files = fs.readdirSync(localesDir)
  .map(f => path.join(localesDir, f, 'pricing.json5'))
  .filter(f => fs.existsSync(f));

let added = 0;
let skipped = 0;

for (const file of files) {
  try {
    const locale = path.basename(path.dirname(file));
    const content = fs.readFileSync(file, 'utf8');
    const data = JSON5.parse(content);

    // Add badge if missing
    if (!data.hero?.badge && badgeTranslations[locale]) {
      if (!data.hero) {
        data.hero = {};
      }
      data.hero.badge = badgeTranslations[locale];

      const output = JSON5.stringify(data, null, 2);
      fs.writeFileSync(file, output + '\n');
      added++;
      console.log(`Added badge to: ${locale}`);
    } else {
      skipped++;
    }
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
  }
}

console.log(`\nAdded badge to ${added} files`);
console.log(`Skipped ${skipped} files (already have badge or no translation)`);
