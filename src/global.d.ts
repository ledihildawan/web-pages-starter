import type { Alpine as AlpineType } from 'alpinejs';

declare global {
  interface Window {
    __PAGE_ID__?: string;
    __USED_COMPONENTS__?: string[];

    Alpine: AlpineType;
  }
}
