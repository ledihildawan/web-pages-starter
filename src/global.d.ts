import type { Alpine as AlpineType } from 'alpinejs';

declare global {
  interface Window {
    __PAGE_ID__?: string;
    __USED_COMPONENTS__?: string[];
    __I18N_DATA__: any;
    Alpine: AlpineType;
  }
}
