import fs from 'node:fs';
import path from 'node:path';
import { parseJson5 } from '../src/scripts/utils/json5';

const ROOT = process.cwd();
const LOCALES_ROOT = path.join(ROOT, 'src/locales');

const homeNewKeys = {
  primary_btn: {
    label: 'Get Started Free',
    url: '#pricing'
  },
  secondary_btn: {
    label: 'View Demo',
    url: '#features'
  },
  note: 'No credit card required',
  features: {
    heading: 'Key Features',
    subheading: 'Everything you need to build and scale.',
    list: {
      speed: {
        title: 'Lightning Fast',
        description: 'Optimized performance with sub-100ms load times. Built for global scale with edge infrastructure.'
      },
      design: {
        title: 'Modern Design',
        description: 'Clean, responsive UI that looks professional on any device. Fully customizable components.'
      },
      security: {
        title: 'High Security',
        description: 'End-to-end encryption, multi-factor auth, and SOC2 compliance to protect your data.'
      }
    }
  },
  stats: {
    community: 'Global Community',
    community_val: '50K+',
    projects: 'Projects Completed',
    projects_val: '120+',
    uptime: 'Uptime',
    uptime_val: '99.99%',
    rating: 'Rating',
    rating_val: '4.9/5'
  }
};

const featuresNewKeys = {
  features: {
    heading: 'Key Features',
    subheading: 'Everything you need to build and scale.',
    list: {
      speed: {
        title: 'Lightning Fast',
        description: 'Optimized performance with sub-100ms load times. Built for global scale with edge infrastructure.'
      },
      design: {
        title: 'Modern Design',
        description: 'Clean, responsive UI that looks professional on any device. Fully customizable components.'
      },
      security: {
        title: 'High Security',
        description: 'End-to-end encryption, multi-factor auth, and SOC2 compliance to protect your data.'
      }
    }
  }
};

function updateJson5File(filePath, updater) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const data = parseJson5(content);
  updater(data);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

function setNestedKey(obj: any, path: string, value: any) {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current)) {
      current[part] = {};
    }
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
}

const locales = fs.readdirSync(LOCALES_ROOT).filter(f =>
  fs.statSync(path.join(LOCALES_ROOT, f)).isDirectory()
);

console.log(`Updating ${locales.length} locales...\n`);

let successCount = 0;
let errorCount = 0;

for (const locale of locales.sort()) {
  const homePath = path.join(LOCALES_ROOT, locale, 'home.json5');
  const featuresPath = path.join(LOCALES_ROOT, locale, 'features.json5');

  if (fs.existsSync(homePath)) {
    try {
      updateJson5File(homePath, (data) => {
        if (!data.hero) data.hero = {};
        if (!data.hero.primary_btn) data.hero.primary_btn = {};
        if (!data.hero.secondary_btn) data.hero.secondary_btn = {};
        if (!data.features) data.features = {};
        if (!data.features.list) data.features.list = {};
        if (!data.stats) data.stats = {};

        data.hero.primary_btn.label = homeNewKeys.primary_btn.label;
        data.hero.primary_btn.url = homeNewKeys.primary_btn.url;
        data.hero.secondary_btn.label = homeNewKeys.secondary_btn.label;
        data.hero.secondary_btn.url = homeNewKeys.secondary_btn.url;
        data.hero.note = homeNewKeys.note;
        data.features.heading = homeNewKeys.features.heading;
        data.features.subheading = homeNewKeys.features.subheading;
        data.features.list.speed = homeNewKeys.features.list.speed;
        data.features.list.design = homeNewKeys.features.list.design;
        data.features.list.security = homeNewKeys.features.list.security;
        data.stats.community = homeNewKeys.stats.community;
        data.stats.community_val = homeNewKeys.stats.community_val;
        data.stats.projects = homeNewKeys.stats.projects;
        data.stats.projects_val = homeNewKeys.stats.projects_val;
        data.stats.uptime = homeNewKeys.stats.uptime;
        data.stats.uptime_val = homeNewKeys.stats.uptime_val;
        data.stats.rating = homeNewKeys.stats.rating;
        data.stats.rating_val = homeNewKeys.stats.rating_val;
      });
      console.log(`  ✓ ${locale}/home.json5`);
      successCount++;
    } catch (e) {
      console.error(`  ✗ ${locale}/home.json5: ${e.message}`);
      errorCount++;
    }
  }

  if (fs.existsSync(featuresPath)) {
    try {
      updateJson5File(featuresPath, (data) => {
        if (!data.features) data.features = {};
        if (!data.features.list) data.features.list = {};

        data.features.heading = featuresNewKeys.features.heading;
        data.features.subheading = featuresNewKeys.features.subheading;
        data.features.list.speed = featuresNewKeys.features.list.speed;
        data.features.list.design = featuresNewKeys.features.list.design;
        data.features.list.security = featuresNewKeys.features.list.security;
      });
      console.log(`  ✓ ${locale}/features.json5`);
      successCount++;
    } catch (e) {
      console.error(`  ✗ ${locale}/features.json5: ${e.message}`);
      errorCount++;
    }
  }
}

console.log(`\nDone! Updated ${successCount} file(s), ${errorCount} error(s).`);
console.log('Run `bun run gen:i18n` to regenerate i18n types.');