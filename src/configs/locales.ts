const NUMBERING_SYSTEMS = [
  { code: 'latn', label: 'Latin', group: 'LATIN', digits: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] },
  { code: 'arab', label: 'Arabic-Indic', group: 'ARABIC', digits: ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'] },
  { code: 'deva', label: 'Devanagari', group: 'DEVANAGARI', digits: ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'] },
  { code: 'jpan', label: 'Japanese', group: 'CJK', digits: ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'] },
  { code: 'hans', label: 'Chinese Simplified', group: 'CJK', digits: ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'] },
  { code: 'hant', label: 'Chinese Traditional', group: 'CJK', digits: ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'] },
  { code: 'kore', label: 'Korean', group: 'CJK', digits: ['영', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'] },
  { code: 'cyrl', label: 'Cyrillic', group: 'CYRILLIC', digits: ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'] },
  { code: 'thai', label: 'Thai', group: 'THAI', digits: ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'] },
  { code: 'beng', label: 'Bengali', group: 'BENGALI', digits: ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'] },
  { code: 'taml', label: 'Tamil', group: 'TAMIL', digits: ['௦', '௧', '௨', '௩', '௪', '௫', '௬', '௭', '௮', '௯'] },
  { code: 'telu', label: 'Telugu', group: 'TELUGU', digits: ['౦', '౧', '౨', '౩', '౪', '౫', '౬', '౭', '౮', '౯'] },
  { code: 'knada', label: 'Kannada', group: 'KANNADA', digits: ['೦', '೧', '೨', '೩', '೪', '೫', '೬', '೭', '೮', '೯'] },
  { code: 'mlym', label: 'Malayalam', group: 'MALAYALAM', digits: ['൦', '൧', '൨', '൩', '൪', '൫', '൬', '൭', '൮', '൯'] },
  { code: 'gujr', label: 'Gujarati', group: 'GUJARATI', digits: ['૦', '૧', '૨', '૩', '૪', '૫', '૬', '૭', '૮', '૯'] },
  { code: 'guru', label: 'Gurmukhi', group: 'GURMUKHI', digits: ['੦', '੧', '੨', '੩', '੪', '੫', '੬', '੭', '੮', '੯'] },
  { code: 'sinh', label: 'Sinhala', group: 'SINHALA', digits: ['෦', '෧', '෨', '෩', '෪', '෫', '෬', '෭', '෮', '෯'] },
  { code: 'geor', label: 'Georgian', group: 'GEORGIAN', digits: ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'] },
  { code: 'armn', label: 'Armenian', group: 'ARMENIAN', digits: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] },
  { code: 'ethi', label: 'Ethiopic', group: 'ETHIOPIC', digits: ['፩', '፪', '፫', '፬', '፭', '፮', '፯', '፰', '፱', '፲'] },
  { code: 'khmr', label: 'Khmer', group: 'KHMER', digits: ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'] },
  { code: 'laoo', label: 'Lao', group: 'LAO', digits: ['໐', '໑', '໒', '໓', '໔', '໕', '໖', '໗', '໘', '໙'] },
  { code: 'mym', label: 'Myanmar', group: 'MYANMAR', digits: ['၀', '၁', '၂', '၃', '၄', '၅', '၆', '၇', '၈', '၉'] },
  { code: 'grek', label: 'Greek', group: 'GREEK', digits: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] },
  { code: 'hebr', label: 'Hebrew', group: 'HEBREW', digits: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] },
] as const;

export const REGIONS = [
  { code: 'AE', name: 'United Arab Emirates', nameId: 'Uni Emirat Arab', continent: 'AS', callingCode: '+971' },
  { code: 'AM', name: 'Armenia', nameId: 'Armenia', continent: 'AS', callingCode: '+374' },
  { code: 'AO', name: 'Angola', nameId: 'Angola', continent: 'AF', callingCode: '+244' },
  { code: 'AR', name: 'Argentina', nameId: 'Argentina', continent: 'SA', callingCode: '+54' },
  { code: 'AS', name: 'American Samoa', nameId: 'Samoa Amerika', continent: 'OC', callingCode: '+1' },
  { code: 'AT', name: 'Austria', nameId: 'Austria', continent: 'EU', callingCode: '+43' },
  { code: 'AU', name: 'Australia', nameId: 'Australia', continent: 'OC', callingCode: '+61' },
  { code: 'AZ', name: 'Azerbaijan', nameId: 'Azerbaijan', continent: 'AS', callingCode: '+994' },
  { code: 'BE', name: 'Belgium', nameId: 'Belgia', continent: 'EU', callingCode: '+32' },
  { code: 'BH', name: 'Bahrain', nameId: 'Bahrain', continent: 'AS', callingCode: '+973' },
  { code: 'BO', name: 'Bolivia', nameId: 'Bolivia', continent: 'SA', callingCode: '+591' },
  { code: 'BR', name: 'Brazil', nameId: 'Brasil', continent: 'SA', callingCode: '+55' },
  { code: 'BY', name: 'Belarus', nameId: 'Belarus', continent: 'EU', callingCode: '+375' },
  { code: 'BZ', name: 'Belize', nameId: 'Belize', continent: 'NA', callingCode: '+501' },
  { code: 'CA', name: 'Canada', nameId: 'Kanada', continent: 'NA', callingCode: '+1' },
  { code: 'CH', name: 'Switzerland', nameId: 'Swiss', continent: 'EU', callingCode: '+41' },
  { code: 'CK', name: 'Cook Islands', nameId: 'Kepulauan Cook', continent: 'OC', callingCode: '+682' },
  { code: 'CL', name: 'Chile', nameId: 'Cile', continent: 'SA', callingCode: '+56' },
  { code: 'CN', name: 'China', nameId: 'Tiongkok', continent: 'AS', callingCode: '+86' },
  { code: 'CO', name: 'Colombia', nameId: 'Kolombia', continent: 'SA', callingCode: '+57' },
  { code: 'CR', name: 'Costa Rica', nameId: 'Kosta Rika', continent: 'NA', callingCode: '+506' },
  { code: 'CU', name: 'Cuba', nameId: 'Kuba', continent: 'NA', callingCode: '+53' },
  { code: 'CV', name: 'Cape Verde', nameId: 'Tanjung Verde', continent: 'AF', callingCode: '+238' },
  { code: 'DE', name: 'Germany', nameId: 'Jerman', continent: 'EU', callingCode: '+49' },
  { code: 'DO', name: 'Dominican Republic', nameId: 'Republik Dominika', continent: 'NA', callingCode: '+1' },
  { code: 'DZ', name: 'Algeria', nameId: 'Aljazair', continent: 'AF', callingCode: '+213' },
  { code: 'EC', name: 'Ecuador', nameId: 'Ekuador', continent: 'SA', callingCode: '+593' },
  { code: 'EG', name: 'Egypt', nameId: 'Mesir', continent: 'AF', callingCode: '+20' },
  { code: 'ES', name: 'Spain', nameId: 'Spanyol', continent: 'EU', callingCode: '+34' },
  { code: 'EU', name: 'European Union', nameId: 'Uni Eropa', continent: 'EU', callingCode: '' },
  { code: 'FJ', name: 'Fiji', nameId: 'Fiji', continent: 'OC', callingCode: '+679' },
  { code: 'FR', name: 'France', nameId: 'Perancis', continent: 'EU', callingCode: '+33' },
  { code: 'GB', name: 'United Kingdom', nameId: 'Britania Raya', continent: 'EU', callingCode: '+44' },
  { code: 'GE', name: 'Georgia', nameId: 'Georgia', continent: 'AS', callingCode: '+995' },
  { code: 'GU', name: 'Guam', nameId: 'Guam', continent: 'OC', callingCode: '+1' },
  { code: 'GT', name: 'Guatemala', nameId: 'Guatemala', continent: 'NA', callingCode: '+502' },
  { code: 'GW', name: 'Guinea-Bissau', nameId: 'Guinea-Bissau', continent: 'AF', callingCode: '+245' },
  { code: 'HK', name: 'Hong Kong', nameId: 'Hong Kong', continent: 'AS', callingCode: '+852' },
  { code: 'HN', name: 'Honduras', nameId: 'Honduras', continent: 'NA', callingCode: '+504' },
  { code: 'ID', name: 'Indonesia', nameId: 'Indonesia', continent: 'AS', callingCode: '+62' },
  { code: 'IE', name: 'Ireland', nameId: 'Irlandia', continent: 'EU', callingCode: '+353' },
  { code: 'IN', name: 'India', nameId: 'India', continent: 'AS', callingCode: '+91' },
  { code: 'IQ', name: 'Iraq', nameId: 'Irak', continent: 'AS', callingCode: '+964' },
  { code: 'IR', name: 'Iran', nameId: 'Iran', continent: 'AS', callingCode: '+98' },
  { code: 'JO', name: 'Jordan', nameId: 'Yordania', continent: 'AS', callingCode: '+962' },
  { code: 'JP', name: 'Japan', nameId: 'Jepang', continent: 'AS', callingCode: '+81' },
  { code: 'KG', name: 'Kyrgyzstan', nameId: 'Kirgizstan', continent: 'AS', callingCode: '+996' },
  { code: 'KH', name: 'Cambodia', nameId: 'Kamboja', continent: 'AS', callingCode: '+855' },
  { code: 'KP', name: 'North Korea', nameId: 'Korea Utara', continent: 'AS', callingCode: '+850' },
  { code: 'KR', name: 'South Korea', nameId: 'Korea Selatan', continent: 'AS', callingCode: '+82' },
  { code: 'KW', name: 'Kuwait', nameId: 'Kuwait', continent: 'AS', callingCode: '+965' },
  { code: 'KZ', name: 'Kazakhstan', nameId: 'Kazakhstan', continent: 'AS', callingCode: '+7' },
  { code: 'LA', name: 'Laos', nameId: 'Laos', continent: 'AS', callingCode: '+856' },
  { code: 'LB', name: 'Lebanon', nameId: 'Lebanon', continent: 'AS', callingCode: '+961' },
  { code: 'LI', name: 'Liechtenstein', nameId: 'Liechtenstein', continent: 'EU', callingCode: '+423' },
  { code: 'LS', name: 'Lesotho', nameId: 'Lesotho', continent: 'AF', callingCode: '+266' },
  { code: 'LT', name: 'Lithuania', nameId: 'Lituania', continent: 'EU', callingCode: '+370' },
  { code: 'LU', name: 'Luxembourg', nameId: 'Luksemburg', continent: 'EU', callingCode: '+352' },
  { code: 'LV', name: 'Latvia', nameId: 'Latvia', continent: 'EU', callingCode: '+371' },
  { code: 'LY', name: 'Libya', nameId: 'Libya', continent: 'AF', callingCode: '+218' },
  { code: 'MA', name: 'Morocco', nameId: 'Maroko', continent: 'AF', callingCode: '+212' },
  { code: 'MC', name: 'Monaco', nameId: 'Monako', continent: 'EU', callingCode: '+377' },
  { code: 'MD', name: 'Moldova', nameId: 'Moldova', continent: 'EU', callingCode: '+373' },
  { code: 'MG', name: 'Madagascar', nameId: 'Madagaskar', continent: 'AF', callingCode: '+261' },
  { code: 'MK', name: 'North Macedonia', nameId: 'Makedonia Utara', continent: 'EU', callingCode: '+389' },
  { code: 'MM', name: 'Myanmar', nameId: 'Myanmar', continent: 'AS', callingCode: '+95' },
  { code: 'MO', name: 'Macau', nameId: 'Makau', continent: 'AS', callingCode: '+853' },
  { code: 'MP', name: 'Northern Mariana Islands', nameId: 'Kepulauan Mariana Utara', continent: 'OC', callingCode: '+1' },
  { code: 'MX', name: 'Mexico', nameId: 'Meksiko', continent: 'NA', callingCode: '+52' },
  { code: 'MY', name: 'Malaysia', nameId: 'Malaysia', continent: 'AS', callingCode: '+60' },
  { code: 'MZ', name: 'Mozambique', nameId: 'Mozambik', continent: 'AF', callingCode: '+258' },
  { code: 'NA', name: 'Namibia', nameId: 'Namibia', continent: 'AF', callingCode: '+264' },
  { code: 'NI', name: 'Nicaragua', nameId: 'Nikaragua', continent: 'NA', callingCode: '+505' },
  { code: 'NP', name: 'Nepal', nameId: 'Nepal', continent: 'AS', callingCode: '+977' },
  { code: 'NZ', name: 'New Zealand', nameId: 'Selandia Baru', continent: 'OC', callingCode: '+64' },
  { code: 'OM', name: 'Oman', nameId: 'Oman', continent: 'AS', callingCode: '+968' },
  { code: 'PA', name: 'Panama', nameId: 'Panama', continent: 'NA', callingCode: '+507' },
  { code: 'PE', name: 'Peru', nameId: 'Peru', continent: 'SA', callingCode: '+51' },
  { code: 'PG', name: 'Papua New Guinea', nameId: 'Papua Nugini', continent: 'OC', callingCode: '+675' },
  { code: 'PH', name: 'Philippines', nameId: 'Filipina', continent: 'AS', callingCode: '+63' },
  { code: 'PR', name: 'Puerto Rico', nameId: 'Puerto Riko', continent: 'NA', callingCode: '+1' },
  { code: 'PS', name: 'Palestine', nameId: 'Palestina', continent: 'AS', callingCode: '+970' },
  { code: 'PT', name: 'Portugal', nameId: 'Portugal', continent: 'EU', callingCode: '+351' },
  { code: 'PY', name: 'Paraguay', nameId: 'Paraguay', continent: 'SA', callingCode: '+595' },
  { code: 'QA', name: 'Qatar', nameId: 'Qatar', continent: 'AS', callingCode: '+974' },
  { code: 'RU', name: 'Russia', nameId: 'Rusia', continent: 'EU', callingCode: '+7' },
  { code: 'SA', name: 'Saudi Arabia', nameId: 'Arab Saudi', continent: 'AS', callingCode: '+966' },
  { code: 'SD', name: 'Sudan', nameId: 'Sudan', continent: 'AF', callingCode: '+249' },
  { code: 'SG', name: 'Singapore', nameId: 'Singapura', continent: 'AS', callingCode: '+65' },
  { code: 'ST', name: 'São Tomé and Príncipe', nameId: 'Sao Tome dan Principe', continent: 'AF', callingCode: '+239' },
  { code: 'SV', name: 'El Salvador', nameId: 'El Salvador', continent: 'NA', callingCode: '+503' },
  { code: 'SO', name: 'Somalia', nameId: 'Somalia', continent: 'AF', callingCode: '+252' },
  { code: 'SY', name: 'Syria', nameId: 'Suriah', continent: 'AS', callingCode: '+963' },
  { code: 'TH', name: 'Thailand', nameId: 'Thailand', continent: 'AS', callingCode: '+66' },
  { code: 'TD', name: 'Chad', nameId: 'Chad', continent: 'AF', callingCode: '+235' },
  { code: 'TJ', name: 'Tajikistan', nameId: 'Tajikistan', continent: 'AS', callingCode: '+992' },
  { code: 'TL', name: 'Timor-Leste', nameId: 'Timor Leste', continent: 'AS', callingCode: '+670' },
  { code: 'TM', name: 'Turkmenistan', nameId: 'Turkmenistan', continent: 'AS', callingCode: '+993' },
  { code: 'TN', name: 'Tunisia', nameId: 'Tunisia', continent: 'AF', callingCode: '+216' },
  { code: 'TO', name: 'Tonga', nameId: 'Tonga', continent: 'OC', callingCode: '+676' },
  { code: 'TW', name: 'Taiwan', nameId: 'Taiwan', continent: 'AS', callingCode: '+886' },
  { code: 'UA', name: 'Ukraine', nameId: 'Ukraina', continent: 'EU', callingCode: '+380' },
  { code: 'US', name: 'United States', nameId: 'Amerika Serikat', continent: 'NA', callingCode: '+1' },
  { code: 'UY', name: 'Uruguay', nameId: 'Uruguay', continent: 'SA', callingCode: '+598' },
  { code: 'UZ', name: 'Uzbekistan', nameId: 'Uzbekistan', continent: 'AS', callingCode: '+998' },
  { code: 'VE', name: 'Venezuela', nameId: 'Venezuela', continent: 'SA', callingCode: '+58' },
  { code: 'VI', name: 'Virgin Islands (US)', nameId: 'Kepulauan Virgin (AS)', continent: 'NA', callingCode: '+1' },
  { code: 'WS', name: 'Samoa', nameId: 'Samoa', continent: 'OC', callingCode: '+685' },
  { code: 'YE', name: 'Yemen', nameId: 'Yaman', continent: 'AS', callingCode: '+967' },
  { code: 'ZA', name: 'South Africa', nameId: 'Afrika Selatan', continent: 'AF', callingCode: '+27' },
] as const;

export const LANGUAGES = [
  { code: 'id', name: 'Indonesian', nameId: 'Indonesia', nativeName: 'Bahasa Indonesia', family: 'Austronesian', script: 'Latin' },
  { code: 'en', name: 'English', nameId: 'Inggris', nativeName: 'English', family: 'Germanic', script: 'Latin' },
  { code: 'ja', name: 'Japanese', nameId: 'Jepang', nativeName: '日本語', family: 'Japonic', script: 'Japanese' },
  { code: 'zh-Hans', name: 'Chinese (Simplified)', nameId: 'Tiongkok (Sederhana)', nativeName: '简体中文', family: 'Sinitic', script: 'Simplified Han' },
  { code: 'zh-Hant', name: 'Chinese (Traditional)', nameId: 'Tiongkok (Tradisional)', nativeName: '繁體中文', family: 'Sinitic', script: 'Traditional Han' },
  { code: 'ar', name: 'Arabic', nameId: 'Arab', nativeName: 'العربية', family: 'Semitic', script: 'Arabic' },
  { code: 'es', name: 'Spanish', nameId: 'Spanyol', nativeName: 'Español', family: 'Romance', script: 'Latin' },
  { code: 'pt', name: 'Portuguese', nameId: 'Portugis', nativeName: 'Português', family: 'Romance', script: 'Latin' },
  { code: 'hi', name: 'Hindi', nameId: 'Hindi', nativeName: 'हिन्दी', family: 'Indo-Aryan', script: 'Devanagari' },
  { code: 'ko', name: 'Korean', nameId: 'Korea', nativeName: '한국어', family: 'Koreanic', script: 'Hangul' },
  { code: 'fr', name: 'French', nameId: 'Perancis', nativeName: 'Français', family: 'Romance', script: 'Latin' },
  { code: 'de', name: 'German', nameId: 'Jerman', nativeName: 'Deutsch', family: 'Germanic', script: 'Latin' },
  { code: 'ru', name: 'Russian', nameId: 'Rusia', nativeName: 'Русский', family: 'Slavic', script: 'Cyrillic' },
  { code: 'th', name: 'Thai', nameId: 'Thailand', nativeName: 'ภาษาไทย', family: 'Kra-Dai', script: 'Thai' },
] as const;

export const REGION_CODES = REGIONS.map(r => r.code) as RegionCode[];

export const REGION_CODE = REGION_CODES.reduce((acc, region) => {
  const key = region.toUpperCase();
  return Object.assign(acc, { [key]: region });
}, {} as Record<string, RegionCode>) as {
    [K in RegionCode as Uppercase<K>]: K
  };

export const FLAGS = [
  { code: 'ID', emoji: '🇮🇩', name: 'Indonesia', region: REGION_CODE.ID },
  { code: 'US', emoji: '🇺🇸', name: 'United States', region: REGION_CODE.US },
  { code: 'GB', emoji: '🇬🇧', name: 'United Kingdom', region: REGION_CODE.GB },
  { code: 'CA', emoji: '🇨🇦', name: 'Canada', region: REGION_CODE.CA },
  { code: 'AU', emoji: '🇦🇺', name: 'Australia', region: REGION_CODE.AU },
  { code: 'IN', emoji: '🇮🇳', name: 'India', region: REGION_CODE.IN },
  { code: 'NZ', emoji: '🇳🇿', name: 'New Zealand', region: REGION_CODE.NZ },
  { code: 'ZA', emoji: '🇿🇦', name: 'South Africa', region: REGION_CODE.ZA },
  { code: 'JP', emoji: '🇯🇵', name: 'Japan', region: REGION_CODE.JP },
  { code: 'CN', emoji: '🇨🇳', name: 'China', region: REGION_CODE.CN },
  { code: 'SG', emoji: '🇸🇬', name: 'Singapore', region: REGION_CODE.SG },
  { code: 'TW', emoji: '🇹🇼', name: 'Taiwan', region: REGION_CODE.TW },
  { code: 'HK', emoji: '🇭🇰', name: 'Hong Kong', region: REGION_CODE.HK },
  { code: 'MO', emoji: '🇲🇴', name: 'Macau', region: REGION_CODE.MO },
  { code: 'MY', emoji: '🇲🇾', name: 'Malaysia', region: REGION_CODE.MY },
  { code: 'SA', emoji: '🇸🇦', name: 'Saudi Arabia', region: REGION_CODE.SA },
  { code: 'AE', emoji: '🇦🇪', name: 'United Arab Emirates', region: REGION_CODE.AE },
  { code: 'EG', emoji: '🇪🇬', name: 'Egypt', region: REGION_CODE.EG },
  { code: 'MA', emoji: '🇲🇦', name: 'Morocco', region: REGION_CODE.MA },
  { code: 'TN', emoji: '🇹🇳', name: 'Tunisia', region: REGION_CODE.TN },
  { code: 'ES', emoji: '🇪🇸', name: 'Spain', region: REGION_CODE.ES },
  { code: 'MX', emoji: '🇲🇽', name: 'Mexico', region: REGION_CODE.MX },
  { code: 'AR', emoji: '🇦🇷', name: 'Argentina', region: REGION_CODE.AR },
  { code: 'CO', emoji: '🇨🇴', name: 'Colombia', region: REGION_CODE.CO },
  { code: 'PE', emoji: '🇵🇪', name: 'Peru', region: REGION_CODE.PE },
  { code: 'BR', emoji: '🇧🇷', name: 'Brazil', region: REGION_CODE.BR },
  { code: 'PT', emoji: '🇵🇹', name: 'Portugal', region: REGION_CODE.PT },
  { code: 'AO', emoji: '🇦🇴', name: 'Angola', region: REGION_CODE.AO },
  { code: 'MZ', emoji: '🇲🇿', name: 'Mozambique', region: REGION_CODE.MZ },
  { code: 'NP', emoji: '🇳🇵', name: 'Nepal', region: REGION_CODE.NP },
  { code: 'KR', emoji: '🇰🇷', name: 'South Korea', region: REGION_CODE.KR },
  { code: 'KP', emoji: '🇰🇵', name: 'North Korea', region: REGION_CODE.KP },
  { code: 'FR', emoji: '🇫🇷', name: 'France', region: REGION_CODE.FR },
  { code: 'BE', emoji: '🇧🇪', name: 'Belgium', region: REGION_CODE.BE },
  { code: 'CH', emoji: '🇨🇭', name: 'Switzerland', region: REGION_CODE.CH },
  { code: 'DE', emoji: '🇩🇪', name: 'Germany', region: REGION_CODE.DE },
  { code: 'AT', emoji: '🇦🇹', name: 'Austria', region: REGION_CODE.AT },
  { code: 'RU', emoji: '🇷🇺', name: 'Russia', region: REGION_CODE.RU },
  { code: 'TH', emoji: '🇹🇭', name: 'Thailand', region: REGION_CODE.TH },
] as const;

export const DIRECTIONS = [
  { code: 'ltr', label: 'Left to Right', description: 'Text and UI elements flow from left to right', symbol: '←', languages: ['id', 'en', 'ja', 'es', 'pt', 'hi', 'ko', 'fr', 'de', 'ru', 'th'] },
  { code: 'rtl', label: 'Right to Left', description: 'Text and UI elements flow from right to left', symbol: '→', languages: ['ar'] },
] as const;

export const CALENDARS = [
  { code: 'gregory', name: 'Gregorian Calendar', nameId: 'Kalender Gregorian', description: 'The internationally accepted civil calendar', eras: ['BC', 'AD'], months: 12, daysInWeek: 7, origin: 'Vatican', yearAdopted: 1582 },
] as const;

const CURRENCIES = [
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', decimals: 2, region: 'AE' },
  { code: 'AOA', name: 'Angolan Kwanza', symbol: 'Kz', decimals: 2, region: 'AO' },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$', decimals: 2, region: 'AR' },
  { code: 'AUD', name: 'Australian Dollar', symbol: '$', decimals: 2, region: 'AU' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', decimals: 2, region: 'BR' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: '$', decimals: 2, region: 'CA' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', decimals: 2, region: 'CH' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimals: 2, region: 'CN' },
  { code: 'COP', name: 'Colombian Peso', symbol: '$', decimals: 2, region: 'CO' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', decimals: 2, region: 'EG' },
  { code: 'EUR', name: 'Euro', symbol: '€', decimals: 2, region: 'EU' },
  { code: 'GBP', name: 'British Pound', symbol: '£', decimals: 2, region: 'GB' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: '$', decimals: 2, region: 'HK' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', decimals: 0, region: 'ID' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimals: 2, region: 'IN' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimals: 0, region: 'JP' },
  { code: 'KPW', name: 'North Korean Won', symbol: '₩', decimals: 2, region: 'KP' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', decimals: 0, region: 'KR' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'DH', decimals: 2, region: 'MA' },
  { code: 'MOP', name: 'Macanese Pataca', symbol: 'MOP$', decimals: 2, region: 'MO' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', decimals: 2, region: 'MX' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', decimals: 2, region: 'MY' },
  { code: 'MZN', name: 'Mozambican Metical', symbol: 'MT', decimals: 2, region: 'MZ' },
  { code: 'NPR', name: 'Nepalese Rupee', symbol: '₨', decimals: 2, region: 'NP' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: '$', decimals: 2, region: 'NZ' },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/', decimals: 2, region: 'PE' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', decimals: 2, region: 'RU' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س', decimals: 2, region: 'SA' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: '$', decimals: 2, region: 'SG' },
  { code: 'TND', name: 'Tunisian Dinar', symbol: 'DT', decimals: 3, region: 'TN' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', decimals: 2, region: 'TH' },
  { code: 'TWD', name: 'Taiwan Dollar', symbol: '$', decimals: 2, region: 'TW' },
  { code: 'USD', name: 'US Dollar', symbol: '$', decimals: 2, region: 'US' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', decimals: 2, region: 'ZA' },
] as const;

export const TIMEZONES = [
  { code: 'Africa/Cairo', name: 'Eastern European Time (Cairo)', region: 'Africa', city: 'Cairo', offset: 2, dst: true },
  { code: 'Africa/Casablanca', name: 'Western European Time (Casablanca)', region: 'Africa', city: 'Casablanca', offset: 0, dst: false },
  { code: 'Africa/Johannesburg', name: 'South Africa Standard Time', region: 'Africa', city: 'Johannesburg', offset: 2, dst: false },
  { code: 'Africa/Luanda', name: 'West Africa Standard Time (Luanda)', region: 'Africa', city: 'Luanda', offset: 1, dst: false },
  { code: 'Africa/Maputo', name: 'Central Africa Time (Maputo)', region: 'Africa', city: 'Maputo', offset: 2, dst: false },
  { code: 'Africa/Tunis', name: 'Central European Time (Tunis)', region: 'Africa', city: 'Tunis', offset: 1, dst: false },
  { code: 'America/Argentina/Buenos_Aires', name: 'Argentina Time', region: 'America', city: 'Buenos Aires', offset: -3, dst: false },
  { code: 'America/Bogota', name: 'Colombia Time', region: 'America', city: 'Bogota', offset: -5, dst: false },
  { code: 'America/Lima', name: 'Peru Time', region: 'America', city: 'Lima', offset: -5, dst: false },
  { code: 'America/Mexico_City', name: 'Central Standard Time (Mexico)', region: 'America', city: 'Mexico City', offset: -6, dst: true },
  { code: 'America/Montreal', name: 'Eastern Standard Time (Montreal)', region: 'America', city: 'Montreal', offset: -5, dst: true },
  { code: 'America/New_York', name: 'Eastern Standard Time (New York)', region: 'America', city: 'New York', offset: -5, dst: true },
  { code: 'America/Sao_Paulo', name: 'Brasilia Time', region: 'America', city: 'Sao Paulo', offset: -3, dst: true },
  { code: 'America/Toronto', name: 'Eastern Standard Time (Toronto)', region: 'America', city: 'Toronto', offset: -5, dst: true },
  { code: 'Asia/Dubai', name: 'Gulf Standard Time (Dubai)', region: 'Asia', city: 'Dubai', offset: 4, dst: false },
  { code: 'Asia/Hong_Kong', name: 'Hong Kong Time', region: 'Asia', city: 'Hong Kong', offset: 8, dst: false },
  { code: 'Asia/Jakarta', name: 'Western Indonesia Time (Jakarta)', region: 'Asia', city: 'Jakarta', offset: 7, dst: false },
  { code: 'Asia/Kathmandu', name: 'Nepal Time', region: 'Asia', city: 'Kathmandu', offset: 5.75, dst: false },
  { code: 'Asia/Kuala_Lumpur', name: 'Malaysia Time', region: 'Asia', city: 'Kuala Lumpur', offset: 8, dst: false },
  { code: 'Asia/Kolkata', name: 'India Standard Time', region: 'Asia', city: 'Kolkata', offset: 5.5, dst: false },
  { code: 'Asia/Macau', name: 'China Standard Time (Macau)', region: 'Asia', city: 'Macau', offset: 8, dst: false },
  { code: 'Asia/Pyongyang', name: 'Korea Standard Time (Pyongyang)', region: 'Asia', city: 'Pyongyang', offset: 9, dst: false },
  { code: 'Asia/Riyadh', name: 'Arabian Standard Time (Riyadh)', region: 'Asia', city: 'Riyadh', offset: 3, dst: false },
  { code: 'Asia/Seoul', name: 'Korea Standard Time (Seoul)', region: 'Asia', city: 'Seoul', offset: 9, dst: false },
  { code: 'Asia/Shanghai', name: 'China Standard Time (Shanghai)', region: 'Asia', city: 'Shanghai', offset: 8, dst: false },
  { code: 'Asia/Bangkok', name: 'Indochina Time (Bangkok)', region: 'Asia', city: 'Bangkok', offset: 7, dst: false },
  { code: 'Asia/Singapore', name: 'Singapore Time', region: 'Asia', city: 'Singapore', offset: 8, dst: false },
  { code: 'Asia/Taipei', name: 'Taiwan Time', region: 'Asia', city: 'Taipei', offset: 8, dst: false },
  { code: 'Asia/Tokyo', name: 'Japan Standard Time', region: 'Asia', city: 'Tokyo', offset: 9, dst: false },
  { code: 'Australia/Sydney', name: 'Australian Eastern Standard Time (Sydney)', region: 'Australia', city: 'Sydney', offset: 10, dst: true },
  { code: 'Europe/Berlin', name: 'Central European Time (Berlin)', region: 'Europe', city: 'Berlin', offset: 1, dst: true },
  { code: 'Europe/Brussels', name: 'Central European Time (Brussels)', region: 'Europe', city: 'Brussels', offset: 1, dst: true },
  { code: 'Europe/Lisbon', name: 'Western European Time (Lisbon)', region: 'Europe', city: 'Lisbon', offset: 0, dst: true },
  { code: 'Europe/London', name: 'Greenwich Mean Time', region: 'Europe', city: 'London', offset: 0, dst: true },
  { code: 'Europe/Madrid', name: 'Central European Time (Madrid)', region: 'Europe', city: 'Madrid', offset: 1, dst: true },
  { code: 'Europe/Moscow', name: 'Moscow Standard Time', region: 'Europe', city: 'Moscow', offset: 3, dst: false },
  { code: 'Europe/Paris', name: 'Central European Time (Paris)', region: 'Europe', city: 'Paris', offset: 1, dst: true },
  { code: 'Europe/Vienna', name: 'Central European Time (Vienna)', region: 'Europe', city: 'Vienna', offset: 1, dst: true },
  { code: 'Europe/Zurich', name: 'Central European Time (Zurich)', region: 'Europe', city: 'Zurich', offset: 1, dst: true },
  { code: 'Pacific/Auckland', name: 'New Zealand Standard Time (Auckland)', region: 'Pacific', city: 'Auckland', offset: 12, dst: true },
] as const;

export const PLURAL_RULES = [
  { code: 'other', name: 'Other Only', description: 'All numbers use the "other" category', categories: ['other'], examples: [{ value: 0, form: 'other' }, { value: 1, form: 'other' }, { value: 2, form: 'other' }, { value: 100, form: 'other' }], locales: ['id', 'ja', 'ko', 'vi', 'tr', 'th'] },
  { code: 'one-other', name: 'One/Other', description: 'Numbers ending in 1 use "one", everything else uses "other" (except numbers ending in 11, 12, 13)', categories: ['one', 'other'], examples: [{ value: 0, form: 'other' }, { value: 1, form: 'one' }, { value: 2, form: 'other' }, { value: 11, form: 'other' }, { value: 21, form: 'one' }], locales: ['en', 'es', 'pt', 'hi', 'fr', 'de', 'it', 'nl', 'sv', 'da', 'no', 'fi'] },
  { code: 'zero-one-two-few-many-other', name: 'Arabic (Six Forms)', description: 'Complex plural system with six categories based on number mod 100', categories: ['zero', 'one', 'two', 'few', 'many', 'other'], examples: [{ value: 0, form: 'zero' }, { value: 1, form: 'one' }, { value: 2, form: 'two' }, { value: 3, form: 'few' }, { value: 11, form: 'many' }, { value: 100, form: 'other' }], locales: ['ar'] },
  { code: 'one-few-many', name: 'Slavic (Three Forms)', description: 'Numbers ending in 1 (not 11) use "one", ending in 2-4 (not 12-14) use "few", everything else uses "many"', categories: ['one', 'few', 'many'], examples: [{ value: 1, form: 'one' }, { value: 2, form: 'few' }, { value: 5, form: 'many' }, { value: 11, form: 'many' }, { value: 21, form: 'one' }], locales: ['ru', 'uk', 'be', 'sr', 'hr'] },
] as const;

export const NUMBERING_SYSTEM_CODES = NUMBERING_SYSTEMS.map(c => c.code) as NumberingSystemCode[];
export const LANGUAGE_CODES = LANGUAGES.map(l => l.code) as LanguageCode[];
export const FLAG_CODES = FLAGS.map(f => f.code) as FlagCode[];
export const DIRECTION_CODES = DIRECTIONS.map(d => d.code) as DirectionCode[];
export const CALENDAR_CODES = CALENDARS.map(c => c.code) as CalendarCode[];
export const CURRENCY_CODES = CURRENCIES.map(c => c.code) as CurrencyCode[];
export const TIMEZONE_CODES = TIMEZONES.map(t => t.code) as TimezoneCode[];
export const PLURAL_RULE_CODES = PLURAL_RULES.map(p => p.code) as PluralRuleCode[];

export const NUMBERING_SYSTEM_CODE = NUMBERING_SYSTEM_CODES.reduce((acc, ns) => {
  const key = ns.toUpperCase();
  return Object.assign(acc, { [key]: ns });
}, {} as Record<string, NumberingSystemCode>) as {
    [K in NumberingSystemCode as Uppercase<K>]: K
  };

export const LANGUAGE_CODE = LANGUAGE_CODES.reduce((acc, language) => {
  const key = language.toUpperCase();
  return Object.assign(acc, { [key]: language });
}, {} as Record<string, LanguageCode>) as {
    [K in LanguageCode as Uppercase<K>]: K
  } & {
    ZH_HANS: 'zh-Hans';
    ZH_HANT: 'zh-Hant';
  };

// Explicitly ensure ZH_HANS and ZH_HANT exist at runtime
if (!LANGUAGE_CODE.ZH_HANS) {
  (LANGUAGE_CODE as Record<string, string>).ZH_HANS = 'zh-Hans';
}
if (!LANGUAGE_CODE.ZH_HANT) {
  (LANGUAGE_CODE as Record<string, string>).ZH_HANT = 'zh-Hant';
}

export const FLAG_CODE = FLAG_CODES.reduce((acc, flag) => {
  const key = flag.toUpperCase();
  return Object.assign(acc, { [key]: flag });
}, {} as Record<string, FlagCode>) as {
    [K in FlagCode as Uppercase<K>]: K
  };

export const DIRECTION_CODE = DIRECTION_CODES.reduce((acc, dir) => {
  const key = dir.toUpperCase();
  return Object.assign(acc, { [key]: dir });
}, {} as Record<string, DirectionCode>) as {
    [K in DirectionCode as Uppercase<K>]: K
  };

export const CALENDAR_CODE = CALENDAR_CODES.reduce((acc, calendar) => {
  const key = calendar.toUpperCase();
  return Object.assign(acc, { [key]: calendar });
}, {} as Record<string, CalendarCode>) as {
    [K in CalendarCode as Uppercase<K>]: K
  };

export const CURRENCY_CODE = CURRENCY_CODES.reduce((acc, currency) => {
  const key = currency.toUpperCase();
  return Object.assign(acc, { [key]: currency });
}, {} as Record<string, CurrencyCode>) as {
    [K in CurrencyCode as Uppercase<K>]: K
  };

export const TIMEZONE_CODE = TIMEZONE_CODES.reduce((acc, timezone) => {
  const key = timezone.replace(/\//g, '_').toUpperCase();
  return Object.assign(acc, { [key]: timezone });
}, {} as Record<string, TimezoneCode>) as {
  [K in TimezoneCode as K extends `${infer R}/${infer C}` ? `${Uppercase<R>}_${Uppercase<C>}` : never]: K
} & {
  AMERICA_ARGENTINA_BUENOS_AIRES: 'America/Argentina/Buenos_Aires';
};

export const PLURAL_RULE_CODE = PLURAL_RULE_CODES.reduce((acc, rule) => {
  const key = rule.replace(/-/g, '_').toUpperCase();
  return Object.assign(acc, { [key]: rule });
}, {} as Record<string, PluralRuleCode>) as {
  OTHER: 'other';
  ONE_OTHER: 'one-other';
  ZERO_ONE_TWO_FEW_MANY_OTHER: 'zero-one-two-few-many-other';
  ONE_FEW_MANY: 'one-few-many';
};

export const LOCALES = [
  { code: 'id-ID', language: LANGUAGE_CODE.ID, region: REGION_CODE.ID, flag: FLAG_CODE.ID, dir: DIRECTION_CODE.LTR, currency: CURRENCY_CODE.IDR, numberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeNumberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeDigits: false, timezone: TIMEZONE_CODE.ASIA_JAKARTA, timezoneOffset: 7, calendar: CALENDAR_CODE.GREGORY, dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: PLURAL_RULE_CODE.OTHER },
  { code: 'en-US', language: LANGUAGE_CODE.EN, region: REGION_CODE.US, flag: FLAG_CODE.US, dir: DIRECTION_CODE.LTR, currency: CURRENCY_CODE.USD, numberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeNumberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeDigits: false, timezone: TIMEZONE_CODE.AMERICA_NEW_YORK, timezoneOffset: -5, calendar: CALENDAR_CODE.GREGORY, dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 0, pluralRules: PLURAL_RULE_CODE.ONE_OTHER },
  { code: 'en-GB', language: LANGUAGE_CODE.EN, region: REGION_CODE.GB, flag: FLAG_CODE.GB, dir: DIRECTION_CODE.LTR, currency: CURRENCY_CODE.GBP, numberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeNumberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeDigits: false, timezone: TIMEZONE_CODE.EUROPE_LONDON, timezoneOffset: 0, calendar: CALENDAR_CODE.GREGORY, dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: PLURAL_RULE_CODE.ONE_OTHER },
  { code: 'en-CA', language: LANGUAGE_CODE.EN, region: REGION_CODE.CA, flag: FLAG_CODE.CA, dir: DIRECTION_CODE.LTR, currency: CURRENCY_CODE.CAD, numberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeNumberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeDigits: false, timezone: TIMEZONE_CODE.AMERICA_TORONTO, timezoneOffset: -5, calendar: CALENDAR_CODE.GREGORY, dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 0, pluralRules: PLURAL_RULE_CODE.ONE_OTHER },
  { code: 'en-AU', language: LANGUAGE_CODE.EN, region: REGION_CODE.AU, flag: FLAG_CODE.AU, dir: DIRECTION_CODE.LTR, currency: CURRENCY_CODE.AUD, numberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeNumberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeDigits: false, timezone: TIMEZONE_CODE.AUSTRALIA_SYDNEY, timezoneOffset: 10, calendar: CALENDAR_CODE.GREGORY, dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: PLURAL_RULE_CODE.ONE_OTHER },
  { code: 'en-IN', language: LANGUAGE_CODE.EN, region: REGION_CODE.IN, flag: FLAG_CODE.IN, dir: DIRECTION_CODE.LTR, currency: CURRENCY_CODE.INR, numberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeNumberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeDigits: false, timezone: TIMEZONE_CODE.ASIA_KOLKATA, timezoneOffset: 5.5, calendar: CALENDAR_CODE.GREGORY, dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: PLURAL_RULE_CODE.ONE_OTHER },
  { code: 'en-NZ', language: LANGUAGE_CODE.EN, region: REGION_CODE.NZ, flag: FLAG_CODE.NZ, dir: DIRECTION_CODE.LTR, currency: CURRENCY_CODE.NZD, numberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeNumberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeDigits: false, timezone: TIMEZONE_CODE.PACIFIC_AUCKLAND, timezoneOffset: 12, calendar: CALENDAR_CODE.GREGORY, dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: PLURAL_RULE_CODE.ONE_OTHER },
  { code: 'en-ZA', language: LANGUAGE_CODE.EN, region: REGION_CODE.ZA, flag: FLAG_CODE.ZA, dir: DIRECTION_CODE.LTR, currency: CURRENCY_CODE.ZAR, numberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeNumberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeDigits: false, timezone: TIMEZONE_CODE.AFRICA_JOHANNESBURG, timezoneOffset: 2, calendar: CALENDAR_CODE.GREGORY, dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: PLURAL_RULE_CODE.ONE_OTHER },
  { code: 'ja-JP', language: LANGUAGE_CODE.JA, region: REGION_CODE.JP, flag: FLAG_CODE.JP, dir: DIRECTION_CODE.LTR, currency: CURRENCY_CODE.JPY, numberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeNumberingSystem: NUMBERING_SYSTEM_CODE.JPAN, nativeDigits: false, timezone: TIMEZONE_CODE.ASIA_TOKYO, timezoneOffset: 9, calendar: CALENDAR_CODE.GREGORY, dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 0, pluralRules: PLURAL_RULE_CODE.OTHER },
  { code: 'zh-Hans-CN', language: LANGUAGE_CODE.ZH_HANS, region: REGION_CODE.CN, flag: FLAG_CODE.CN, dir: DIRECTION_CODE.LTR, currency: CURRENCY_CODE.CNY, numberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeNumberingSystem: NUMBERING_SYSTEM_CODE.HANS, nativeDigits: false, timezone: TIMEZONE_CODE.ASIA_SHANGHAI, timezoneOffset: 8, calendar: CALENDAR_CODE.GREGORY, dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: PLURAL_RULE_CODE.OTHER },
  { code: 'zh-Hans-SG', language: LANGUAGE_CODE.ZH_HANS, region: REGION_CODE.SG, flag: FLAG_CODE.SG, dir: DIRECTION_CODE.LTR, currency: CURRENCY_CODE.SGD, numberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeNumberingSystem: NUMBERING_SYSTEM_CODE.HANS, nativeDigits: false, timezone: TIMEZONE_CODE.ASIA_SINGAPORE, timezoneOffset: 8, calendar: CALENDAR_CODE.GREGORY, dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: PLURAL_RULE_CODE.OTHER },
  { code: 'zh-Hans-MY', language: LANGUAGE_CODE.ZH_HANS, region: REGION_CODE.MY, flag: FLAG_CODE.MY, dir: DIRECTION_CODE.LTR, currency: CURRENCY_CODE.MYR, numberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeNumberingSystem: NUMBERING_SYSTEM_CODE.HANS, nativeDigits: false, timezone: TIMEZONE_CODE.ASIA_KUALA_LUMPUR, timezoneOffset: 8, calendar: CALENDAR_CODE.GREGORY, dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: PLURAL_RULE_CODE.OTHER },
  { code: 'zh-Hant-TW', language: LANGUAGE_CODE.ZH_HANT, region: REGION_CODE.TW, flag: FLAG_CODE.TW, dir: DIRECTION_CODE.LTR, currency: CURRENCY_CODE.TWD, numberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeNumberingSystem: NUMBERING_SYSTEM_CODE.HANT, nativeDigits: false, timezone: TIMEZONE_CODE.ASIA_TAIPEI, timezoneOffset: 8, calendar: CALENDAR_CODE.GREGORY, dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: PLURAL_RULE_CODE.OTHER },
  { code: 'zh-Hant-HK', language: LANGUAGE_CODE.ZH_HANT, region: REGION_CODE.HK, flag: FLAG_CODE.HK, dir: DIRECTION_CODE.LTR, currency: CURRENCY_CODE.HKD, numberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeNumberingSystem: NUMBERING_SYSTEM_CODE.HANT, nativeDigits: false, timezone: TIMEZONE_CODE.ASIA_HONG_KONG, timezoneOffset: 8, calendar: CALENDAR_CODE.GREGORY, dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: PLURAL_RULE_CODE.OTHER },
  { code: 'zh-Hant-MO', language: LANGUAGE_CODE.ZH_HANT, region: REGION_CODE.MO, flag: FLAG_CODE.MO, dir: DIRECTION_CODE.LTR, currency: CURRENCY_CODE.MOP, numberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeNumberingSystem: NUMBERING_SYSTEM_CODE.HANT, nativeDigits: false, timezone: TIMEZONE_CODE.ASIA_MACAU, timezoneOffset: 8, calendar: CALENDAR_CODE.GREGORY, dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: PLURAL_RULE_CODE.OTHER },
  { code: 'ar-SA', language: LANGUAGE_CODE.AR, region: REGION_CODE.SA, flag: FLAG_CODE.SA, dir: DIRECTION_CODE.RTL, currency: CURRENCY_CODE.SAR, numberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeNumberingSystem: NUMBERING_SYSTEM_CODE.ARAB, nativeDigits: true, timezone: TIMEZONE_CODE.ASIA_RIYADH, timezoneOffset: 3, calendar: CALENDAR_CODE.GREGORY, dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 6, pluralRules: PLURAL_RULE_CODE.ZERO_ONE_TWO_FEW_MANY_OTHER },
  { code: 'ar-AE', language: LANGUAGE_CODE.AR, region: REGION_CODE.AE, flag: FLAG_CODE.AE, dir: DIRECTION_CODE.RTL, currency: CURRENCY_CODE.AED, numberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeNumberingSystem: NUMBERING_SYSTEM_CODE.ARAB, nativeDigits: true, timezone: TIMEZONE_CODE.ASIA_DUBAI, timezoneOffset: 4, calendar: CALENDAR_CODE.GREGORY, dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 6, pluralRules: PLURAL_RULE_CODE.ZERO_ONE_TWO_FEW_MANY_OTHER },
  { code: 'ar-EG', language: LANGUAGE_CODE.AR, region: REGION_CODE.EG, flag: FLAG_CODE.EG, dir: DIRECTION_CODE.RTL, currency: CURRENCY_CODE.EGP, numberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeNumberingSystem: NUMBERING_SYSTEM_CODE.ARAB, nativeDigits: true, timezone: TIMEZONE_CODE.AFRICA_CAIRO, timezoneOffset: 2, calendar: CALENDAR_CODE.GREGORY, dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 6, pluralRules: PLURAL_RULE_CODE.ZERO_ONE_TWO_FEW_MANY_OTHER },
  { code: 'ar-MA', language: LANGUAGE_CODE.AR, region: REGION_CODE.MA, flag: FLAG_CODE.MA, dir: DIRECTION_CODE.RTL, currency: CURRENCY_CODE.MAD, numberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeNumberingSystem: NUMBERING_SYSTEM_CODE.ARAB, nativeDigits: true, timezone: TIMEZONE_CODE.AFRICA_CASABLANCA, timezoneOffset: 0, calendar: CALENDAR_CODE.GREGORY, dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 6, pluralRules: PLURAL_RULE_CODE.ZERO_ONE_TWO_FEW_MANY_OTHER },
  { code: 'ar-TN', language: LANGUAGE_CODE.AR, region: REGION_CODE.TN, flag: FLAG_CODE.TN, dir: DIRECTION_CODE.RTL, currency: CURRENCY_CODE.TND, numberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeNumberingSystem: NUMBERING_SYSTEM_CODE.ARAB, nativeDigits: true, timezone: TIMEZONE_CODE.AFRICA_TUNIS, timezoneOffset: 1, calendar: CALENDAR_CODE.GREGORY, dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 6, pluralRules: PLURAL_RULE_CODE.ZERO_ONE_TWO_FEW_MANY_OTHER },
  { code: 'es-ES', language: LANGUAGE_CODE.ES, region: REGION_CODE.ES, flag: FLAG_CODE.ES, dir: DIRECTION_CODE.LTR, currency: CURRENCY_CODE.EUR, numberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeNumberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeDigits: false, timezone: TIMEZONE_CODE.EUROPE_MADRID, timezoneOffset: 1, calendar: CALENDAR_CODE.GREGORY, dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: PLURAL_RULE_CODE.ONE_OTHER },
  { code: 'es-MX', language: LANGUAGE_CODE.ES, region: REGION_CODE.MX, flag: FLAG_CODE.MX, dir: DIRECTION_CODE.LTR, currency: CURRENCY_CODE.MXN, numberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeNumberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeDigits: false, timezone: TIMEZONE_CODE.AMERICA_MEXICO_CITY, timezoneOffset: -6, calendar: CALENDAR_CODE.GREGORY, dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 0, pluralRules: PLURAL_RULE_CODE.ONE_OTHER },
  { code: 'es-AR', language: LANGUAGE_CODE.ES, region: REGION_CODE.AR, flag: FLAG_CODE.AR, dir: DIRECTION_CODE.LTR, currency: CURRENCY_CODE.ARS, numberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeNumberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeDigits: false, timezone: TIMEZONE_CODE.AMERICA_ARGENTINA_BUENOS_AIRES, timezoneOffset: -3, calendar: CALENDAR_CODE.GREGORY, dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: PLURAL_RULE_CODE.ONE_OTHER },
  { code: 'es-CO', language: LANGUAGE_CODE.ES, region: REGION_CODE.CO, flag: FLAG_CODE.CO, dir: DIRECTION_CODE.LTR, currency: CURRENCY_CODE.COP, numberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeNumberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeDigits: false, timezone: TIMEZONE_CODE.AMERICA_BOGOTA, timezoneOffset: -5, calendar: CALENDAR_CODE.GREGORY, dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: PLURAL_RULE_CODE.ONE_OTHER },
  { code: 'es-PE', language: LANGUAGE_CODE.ES, region: REGION_CODE.PE, flag: FLAG_CODE.PE, dir: DIRECTION_CODE.LTR, currency: CURRENCY_CODE.PEN, numberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeNumberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeDigits: false, timezone: TIMEZONE_CODE.AMERICA_LIMA, timezoneOffset: -5, calendar: CALENDAR_CODE.GREGORY, dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: PLURAL_RULE_CODE.ONE_OTHER },
  { code: 'pt-BR', language: LANGUAGE_CODE.PT, region: REGION_CODE.BR, flag: FLAG_CODE.BR, dir: DIRECTION_CODE.LTR, currency: CURRENCY_CODE.BRL, numberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeNumberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeDigits: false, timezone: TIMEZONE_CODE.AMERICA_SAO_PAULO, timezoneOffset: -3, calendar: CALENDAR_CODE.GREGORY, dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 0, pluralRules: PLURAL_RULE_CODE.ONE_OTHER },
  { code: 'pt-PT', language: LANGUAGE_CODE.PT, region: REGION_CODE.PT, flag: FLAG_CODE.PT, dir: DIRECTION_CODE.LTR, currency: CURRENCY_CODE.EUR, numberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeNumberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeDigits: false, timezone: TIMEZONE_CODE.EUROPE_LISBON, timezoneOffset: 0, calendar: CALENDAR_CODE.GREGORY, dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: PLURAL_RULE_CODE.ONE_OTHER },
  { code: 'pt-AO', language: LANGUAGE_CODE.PT, region: REGION_CODE.AO, flag: FLAG_CODE.AO, dir: DIRECTION_CODE.LTR, currency: CURRENCY_CODE.AOA, numberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeNumberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeDigits: false, timezone: TIMEZONE_CODE.AFRICA_LUANDA, timezoneOffset: 1, calendar: CALENDAR_CODE.GREGORY, dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: PLURAL_RULE_CODE.ONE_OTHER },
  { code: 'pt-MZ', language: LANGUAGE_CODE.PT, region: REGION_CODE.MZ, flag: FLAG_CODE.MZ, dir: DIRECTION_CODE.LTR, currency: CURRENCY_CODE.MZN, numberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeNumberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeDigits: false, timezone: TIMEZONE_CODE.AFRICA_MAPUTO, timezoneOffset: 2, calendar: CALENDAR_CODE.GREGORY, dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: PLURAL_RULE_CODE.ONE_OTHER },
  { code: 'hi-IN', language: LANGUAGE_CODE.HI, region: REGION_CODE.IN, flag: FLAG_CODE.IN, dir: DIRECTION_CODE.LTR, currency: CURRENCY_CODE.INR, numberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeNumberingSystem: NUMBERING_SYSTEM_CODE.DEVA, nativeDigits: true, timezone: TIMEZONE_CODE.ASIA_KOLKATA, timezoneOffset: 5.5, calendar: CALENDAR_CODE.GREGORY, dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 0, pluralRules: PLURAL_RULE_CODE.ONE_OTHER },
  { code: 'hi-NP', language: LANGUAGE_CODE.HI, region: REGION_CODE.NP, flag: FLAG_CODE.NP, dir: DIRECTION_CODE.LTR, currency: CURRENCY_CODE.NPR, numberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeNumberingSystem: NUMBERING_SYSTEM_CODE.DEVA, nativeDigits: true, timezone: TIMEZONE_CODE.ASIA_KATHMANDU, timezoneOffset: 5.75, calendar: CALENDAR_CODE.GREGORY, dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 0, pluralRules: PLURAL_RULE_CODE.ONE_OTHER },
  { code: 'ko-KR', language: LANGUAGE_CODE.KO, region: REGION_CODE.KR, flag: FLAG_CODE.KR, dir: DIRECTION_CODE.LTR, currency: CURRENCY_CODE.KRW, numberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeNumberingSystem: NUMBERING_SYSTEM_CODE.KORE, nativeDigits: false, timezone: TIMEZONE_CODE.ASIA_SEOUL, timezoneOffset: 9, calendar: CALENDAR_CODE.GREGORY, dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 0, pluralRules: PLURAL_RULE_CODE.OTHER },
  { code: 'ko-KP', language: LANGUAGE_CODE.KO, region: REGION_CODE.KP, flag: FLAG_CODE.KP, dir: DIRECTION_CODE.LTR, currency: CURRENCY_CODE.KPW, numberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeNumberingSystem: NUMBERING_SYSTEM_CODE.KORE, nativeDigits: false, timezone: TIMEZONE_CODE.ASIA_PYONGYANG, timezoneOffset: 9, calendar: CALENDAR_CODE.GREGORY, dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 0, pluralRules: PLURAL_RULE_CODE.OTHER },
  { code: 'fr-FR', language: LANGUAGE_CODE.FR, region: REGION_CODE.FR, flag: FLAG_CODE.FR, dir: DIRECTION_CODE.LTR, currency: CURRENCY_CODE.EUR, numberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeNumberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeDigits: false, timezone: TIMEZONE_CODE.EUROPE_PARIS, timezoneOffset: 1, calendar: CALENDAR_CODE.GREGORY, dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: PLURAL_RULE_CODE.ONE_OTHER },
  { code: 'fr-CA', language: LANGUAGE_CODE.FR, region: REGION_CODE.CA, flag: FLAG_CODE.CA, dir: DIRECTION_CODE.LTR, currency: CURRENCY_CODE.CAD, numberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeNumberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeDigits: false, timezone: TIMEZONE_CODE.AMERICA_MONTREAL, timezoneOffset: -5, calendar: CALENDAR_CODE.GREGORY, dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 0, pluralRules: PLURAL_RULE_CODE.ONE_OTHER },
  { code: 'fr-BE', language: LANGUAGE_CODE.FR, region: REGION_CODE.BE, flag: FLAG_CODE.BE, dir: DIRECTION_CODE.LTR, currency: CURRENCY_CODE.EUR, numberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeNumberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeDigits: false, timezone: TIMEZONE_CODE.EUROPE_BRUSSELS, timezoneOffset: 1, calendar: CALENDAR_CODE.GREGORY, dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: PLURAL_RULE_CODE.ONE_OTHER },
  { code: 'fr-CH', language: LANGUAGE_CODE.FR, region: REGION_CODE.CH, flag: FLAG_CODE.CH, dir: DIRECTION_CODE.LTR, currency: CURRENCY_CODE.CHF, numberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeNumberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeDigits: false, timezone: TIMEZONE_CODE.EUROPE_ZURICH, timezoneOffset: 1, calendar: CALENDAR_CODE.GREGORY, dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: PLURAL_RULE_CODE.ONE_OTHER },
  { code: 'de-DE', language: LANGUAGE_CODE.DE, region: REGION_CODE.DE, flag: FLAG_CODE.DE, dir: DIRECTION_CODE.LTR, currency: CURRENCY_CODE.EUR, numberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeNumberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeDigits: false, timezone: TIMEZONE_CODE.EUROPE_BERLIN, timezoneOffset: 1, calendar: CALENDAR_CODE.GREGORY, dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: PLURAL_RULE_CODE.ONE_OTHER },
  { code: 'de-AT', language: LANGUAGE_CODE.DE, region: REGION_CODE.AT, flag: FLAG_CODE.AT, dir: DIRECTION_CODE.LTR, currency: CURRENCY_CODE.EUR, numberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeNumberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeDigits: false, timezone: TIMEZONE_CODE.EUROPE_VIENNA, timezoneOffset: 1, calendar: CALENDAR_CODE.GREGORY, dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: PLURAL_RULE_CODE.ONE_OTHER },
  { code: 'de-CH', language: LANGUAGE_CODE.DE, region: REGION_CODE.CH, flag: FLAG_CODE.CH, dir: DIRECTION_CODE.LTR, currency: CURRENCY_CODE.CHF, numberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeNumberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeDigits: false, timezone: TIMEZONE_CODE.EUROPE_ZURICH, timezoneOffset: 1, calendar: CALENDAR_CODE.GREGORY, dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: PLURAL_RULE_CODE.ONE_OTHER },
  { code: 'ru-RU', language: LANGUAGE_CODE.RU, region: REGION_CODE.RU, flag: FLAG_CODE.RU, dir: DIRECTION_CODE.LTR, currency: CURRENCY_CODE.RUB, numberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeNumberingSystem: NUMBERING_SYSTEM_CODE.CYRL, nativeDigits: false, timezone: TIMEZONE_CODE.EUROPE_MOSCOW, timezoneOffset: 3, calendar: CALENDAR_CODE.GREGORY, dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 1, pluralRules: PLURAL_RULE_CODE.ONE_FEW_MANY },
  { code: 'th-TH', language: LANGUAGE_CODE.TH, region: REGION_CODE.TH, flag: FLAG_CODE.TH, dir: DIRECTION_CODE.LTR, currency: CURRENCY_CODE.THB, numberingSystem: NUMBERING_SYSTEM_CODE.LATN, nativeNumberingSystem: NUMBERING_SYSTEM_CODE.THAI, nativeDigits: true, timezone: TIMEZONE_CODE.ASIA_BANGKOK, timezoneOffset: 7, calendar: CALENDAR_CODE.GREGORY, dateFormat: 'short', timeFormat: 'short', firstDayOfWeek: 0, pluralRules: PLURAL_RULE_CODE.OTHER },
] as const;

export const LOCALE_CODES = LOCALES.map(l => l.code) as LocaleCode[];

/**
 * Generate locale label from existing data
 * Uses language nativeName directly from LANGUAGES master data
 */
export const getLocaleLabel = (localeCode: LocaleCode): string => {
  const locale = LOCALES.find(l => l.code === localeCode);
  if (!locale) return localeCode;

  const language = LANGUAGES.find(l => l.code === locale.language);
  return language?.nativeName || localeCode;
};

/**
 * Generate locale label in format: "Native Language (Country)"
 * Example: "Bahasa Indonesia (Indonesia)", "English (United States)"
 * @param localeCode - The locale code to get label for
 */
export const getLocaleLabelCountry = (
  localeCode: LocaleCode,
): string => {
  const locale = LOCALES.find(l => l.code === localeCode);
  if (!locale) return localeCode;

  const language = LANGUAGES.find(l => l.code === locale.language);
  const region = REGIONS.find(r => r.code === locale.region);

  if (!language) return localeCode;

  // Format: "Native Language Name (Country Name)"
  const countryName = region?.name || locale.region;
  return `${language.nativeName} (${countryName})`;
};

export const LOCALE = LOCALES.reduce((acc, locale) => {
  const key = locale.code.replace(/-/g, '_').toUpperCase();
  return Object.assign(acc, { [key]: locale.code });
}, {} as Record<string, LocaleCode>) as {
    [K in LocaleCode as K extends `${infer L}-${infer R}` ? `${Uppercase<L>}_${Uppercase<R>}` : never]: K
  };

const LOCALE_FALLBACK_TARGETS = {
  [LANGUAGE_CODE.ZH_HANS]: { [REGION_CODE.SG]: [REGION_CODE.MY] },
  [LANGUAGE_CODE.ZH_HANT]: { [REGION_CODE.HK]: [REGION_CODE.MO] },
  [LANGUAGE_CODE.EN]: {
    [REGION_CODE.GB]: [REGION_CODE.ZA, REGION_CODE.IE, REGION_CODE.SG, REGION_CODE.MY, REGION_CODE.HK],
    [REGION_CODE.AU]: [REGION_CODE.NZ, REGION_CODE.FJ, REGION_CODE.PG, REGION_CODE.CK, REGION_CODE.TO, REGION_CODE.WS],
    [REGION_CODE.US]: [REGION_CODE.PH, REGION_CODE.PR, REGION_CODE.VI, REGION_CODE.BZ, REGION_CODE.GU, REGION_CODE.MP, REGION_CODE.AS],
    [REGION_CODE.ZA]: [REGION_CODE.LS, REGION_CODE.NA],
  },
  [LANGUAGE_CODE.ES]: {
    [REGION_CODE.MX]: [REGION_CODE.PA, REGION_CODE.CU, REGION_CODE.DO, REGION_CODE.GT, REGION_CODE.HN, REGION_CODE.SV, REGION_CODE.NI, REGION_CODE.CR],
    [REGION_CODE.CO]: [REGION_CODE.VE, REGION_CODE.EC],
    [REGION_CODE.AR]: [REGION_CODE.CL, REGION_CODE.PY, REGION_CODE.UY],
    [REGION_CODE.PE]: [REGION_CODE.BO],
  },
  [LANGUAGE_CODE.PT]: {
    [REGION_CODE.PT]: [REGION_CODE.CV, REGION_CODE.GW, REGION_CODE.ST, REGION_CODE.TL, REGION_CODE.AO, REGION_CODE.MZ],
  },
  [LANGUAGE_CODE.FR]: {
    [REGION_CODE.FR]: [REGION_CODE.LU, REGION_CODE.MC, REGION_CODE.MA, REGION_CODE.TN, REGION_CODE.DZ],
  },
  [LANGUAGE_CODE.DE]: {
    [REGION_CODE.DE]: [REGION_CODE.LU],
    [REGION_CODE.CH]: [REGION_CODE.LI],
  },
  [LANGUAGE_CODE.AR]: {
    [REGION_CODE.AE]: [REGION_CODE.QA, REGION_CODE.KW, REGION_CODE.BH, REGION_CODE.OM, REGION_CODE.YE, REGION_CODE.IQ],
    [REGION_CODE.SA]: [REGION_CODE.JO, REGION_CODE.LB, REGION_CODE.PS, REGION_CODE.SY, REGION_CODE.SO],
    [REGION_CODE.MA]: [REGION_CODE.DZ, REGION_CODE.LY, REGION_CODE.TD],
    [REGION_CODE.EG]: [REGION_CODE.SD],
  },
  [LANGUAGE_CODE.RU]: {
    [REGION_CODE.RU]: [REGION_CODE.BY, REGION_CODE.KZ, REGION_CODE.KG, REGION_CODE.UA, REGION_CODE.UZ, REGION_CODE.TJ, REGION_CODE.TM, REGION_CODE.AM, REGION_CODE.AZ, REGION_CODE.GE, REGION_CODE.MD],
  },
} as const;

export const LOCALE_FALLBACKS: Record<string, LocaleCode> = Object.entries(
  LOCALE_FALLBACK_TARGETS,
).reduce((acc, [lang, targets]) => {
  Object.entries(targets).forEach(([region, sources]) => {
    const targetLocale = `${lang}-${region}` as LocaleCode;
    sources.forEach((source: RegionCode) => {
      acc[`${lang}-${source}`] = targetLocale;
    });
  });
  return acc;
}, {} as Record<string, LocaleCode>);

export type LocaleCode = typeof LOCALES[number]['code'];
export type LocaleConfig = (typeof LOCALES)[number];
export type LanguageCode = typeof LANGUAGES[number]['code'];
export type LanguageConfig = (typeof LANGUAGES)[number];
export type RegionCode = typeof REGIONS[number]['code'];
export type RegionConfig = (typeof REGIONS)[number];
export type CurrencyCode = typeof CURRENCIES[number]['code'];
export type CurrencyConfig = (typeof CURRENCIES)[number];
export type FlagCode = typeof FLAGS[number]['code'];
export type FlagConfig = (typeof FLAGS)[number];
export type CalendarCode = typeof CALENDARS[number]['code'];
export type CalendarConfig = (typeof CALENDARS)[number];
export type DirectionCode = typeof DIRECTIONS[number]['code'];
export type DirectionConfig = (typeof DIRECTIONS)[number];
export type TimezoneCode = typeof TIMEZONES[number]['code'];
export type TimezoneConfig = (typeof TIMEZONES)[number];
export type PluralRuleCode = typeof PLURAL_RULES[number]['code'];
export type PluralRuleConfig = (typeof PLURAL_RULES)[number];
export type NumberingSystemCode = typeof NUMBERING_SYSTEMS[number]['code'];
export type WritingSystem = typeof NUMBERING_SYSTEMS[number]['group'];

export const WRITING_SYSTEMS = NUMBERING_SYSTEMS.map(ns => ns.group) as WritingSystem[];
export const WRITING_SYSTEM = WRITING_SYSTEMS.reduce((acc, ws) => {
  return Object.assign(acc, { [ws]: ws });
}, {} as Record<string, WritingSystem>) as {
  LATIN: 'LATIN';
  ARABIC: 'ARABIC';
  DEVANAGARI: 'DEVANAGARI';
  CJK: 'CJK';
  CYRILLIC: 'CYRILLIC';
  THAI: 'THAI';
  BENGALI: 'BENGALI';
  TAMIL: 'TAMIL';
  TELUGU: 'TELUGU';
  KANNADA: 'KANNADA';
  MALAYALAM: 'MALAYALAM';
  GUJARATI: 'GUJARATI';
  GURMUKHI: 'GURMUKHI';
  SINHALA: 'SINHALA';
  GEORGIAN: 'GEORGIAN';
  ARMENIAN: 'ARMENIAN';
  ETHIOPIC: 'ETHIOPIC';
  KHMER: 'KHMER';
  LAO: 'LAO';
  MYANMAR: 'MYANMAR';
  GREEK: 'GREEK';
  HEBREW: 'HEBREW';
};

export const CALENDAR = CALENDAR_CODE;
export const DIR = DIRECTION_CODE;

export const DEFAULT_LOCALE: LocaleCode = LOCALE.ID_ID;
export const BASE_CURRENCY: CurrencyCode = CURRENCY_CODE.USD;
export const LOCALE_STORAGE_KEY = 'i18nextLocale' as const;
