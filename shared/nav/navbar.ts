import type { AlpineComponent } from 'alpinejs';
import type { i18nStore, i18nStoreLanguages } from '@/packages/i18n/runtime/store';

export const type = 'data';

export const name = 'navbar';

export const value = (): AlpineComponent<{
  // --- State Variables ---
  mobileMenuOpen: boolean;
  menuChildrenVisible: boolean;
  langOpen: boolean;
  scrolled: boolean;
  navHidden: boolean;
  lastScroll: number;
  activeMobileSub: number | null;
  scrollY: number;
  currentPath: string;
  basePath: string;
  isNavigating: boolean;
  touchStartY: number;
  touchCurrentY: number;
  isDragging: boolean;
  focusedElement: Element | null;
  _ticking: boolean;
  _menuFocusTriggered: boolean;

  // --- Methods ---
  isActive: (path: string) => boolean;
  hapticFeedback: () => void;
  init: () => void;
  onScroll: () => void;
  handleTouchStart: (e: TouchEvent) => void;
  handleTouchMove: (e: TouchEvent) => void;
  handleTouchEnd: () => void;
  toggleSubmenuWithFeedback: (index: number) => void;
  closeMenuAndFeedback: (url: string) => void;
  closeMobileMenu: (url?: string | null) => boolean;
  toggleMobile: () => void;
  navigateToHome: () => void;
  getCurrentLanguageObj: () => i18nStoreLanguages;
  getCurrentFlagUrl: () => string;
  getCurrentFlagAlt: () => string;
  getCurrentLanguageLabel: () => string;
  selectLanguageOption: (event: Event) => void;
  selectLanguageFromClick: (event: Event) => void;
}> => ({
  mobileMenuOpen: false,
  menuChildrenVisible: false,
  langOpen: false,
  scrolled: false,
  navHidden: false,
  lastScroll: 0,
  activeMobileSub: null as number | null,
  scrollY: 0,
  currentPath: window.location.pathname,
  basePath: window.__BASE_PATH__ === 'string' ? window.__BASE_PATH__ : '/',
  isNavigating: false,
  touchStartY: 0,
  touchCurrentY: 0,
  isDragging: false,
  focusedElement: null as Element | null,
  _ticking: false,
  _menuFocusTriggered: false,

  isActive(path: string): boolean {
    const base = this.basePath.replace(/\/$/, '') || '';
    const normalize = (p: string) => {
      let n = p.replace(/\.html$/, '').replace(/\/+$/, '');
      if (n === '' || n === '/index') n = '/';
      return n;
    };
    const current = normalize(this.currentPath);
    const target = normalize(base + path);
    return current === target;
  },

  hapticFeedback(): void {
    if (navigator.vibrate) navigator.vibrate(10);
  },

  init(): void {
    this.lastScroll = window.scrollY;
    this.scrolled = this.lastScroll > 20;
  },

  onScroll(): void {
    if (this.mobileMenuOpen || this._ticking) return;
    this._ticking = true;
    requestAnimationFrame(() => {
      const currentScroll = window.scrollY;
      this.scrolled = currentScroll > 20;
      if (currentScroll > this.lastScroll && currentScroll > 150) {
        this.navHidden = true;
      } else if (currentScroll < this.lastScroll) {
        this.navHidden = false;
      }
      this.lastScroll = currentScroll;
      this._ticking = false;
    });
  },

  handleTouchStart(e: TouchEvent): void {
    this.touchStartY = e.touches[0].clientY;
    this.isDragging = true;
  },

  handleTouchMove(e: TouchEvent): void {
    if (!this.isDragging) return;
    this.touchCurrentY = e.touches[0].clientY;
  },

  handleTouchEnd(): void {
    if (!this.isDragging) return;
    this.isDragging = false;
    const diff = this.touchCurrentY - this.touchStartY;
    if (diff > 100) {
      this.hapticFeedback();
      this.closeMobileMenu();
    }
  },

  toggleSubmenuWithFeedback(index: number): void {
    this.activeMobileSub = this.activeMobileSub === index ? null : index;
    this.hapticFeedback();
  },

  closeMenuAndFeedback(url: string): void {
    this.closeMobileMenu(url);
    this.hapticFeedback();
  },

  closeMobileMenu(url: string | null = null): boolean {
    if (this.isNavigating) return false;
    this.isNavigating = true;
    this.hapticFeedback();
    this._menuFocusTriggered = false;
    this.mobileMenuOpen = false;

    const menuButton = document.querySelector('[aria-controls="mobile-menu"]') as HTMLElement | null;
    if (menuButton) setTimeout(() => menuButton.focus(), 100);

    const targetUrl = typeof url === 'string' ? url : null;
    const isAnchorLink = targetUrl?.includes('#');

    if (targetUrl && !isAnchorLink) {
      setTimeout(() => {
        window.location.href = targetUrl;
      }, 200);
    }

    setTimeout(() => {
      this.menuChildrenVisible = false;
      this.activeMobileSub = null;
      document.body.classList.remove('menu-open');
      this.isNavigating = false;

      if (isAnchorLink) {
        this.navHidden = true;
        window.location.href = targetUrl!;
        setTimeout(() => {
          this.lastScroll = window.scrollY;
        }, 50);
      } else {
        this.navHidden = this.scrollY > 150;
        this.lastScroll = this.scrollY;
        window.scrollTo(0, this.scrollY);
      }
    }, 500);

    return true;
  },

  toggleMobile(): void {
    if (!this.mobileMenuOpen) {
      this.scrollY = window.scrollY;
      this.focusedElement = document.activeElement;

      document.body.classList.add('menu-open');

      this.mobileMenuOpen = true;
      this.navHidden = false;

      this.hapticFeedback();

      this.menuChildrenVisible = true;
    } else {
      this.closeMobileMenu();
    }
  },

  navigateToHome(): void {
    const homeUrl = this.basePath.endsWith('/') ? this.basePath : `${this.basePath}/`;
    if (this.mobileMenuOpen) {
      this.closeMobileMenu(homeUrl);
    } else {
      window.location.href = homeUrl;
    }
  },

  getCurrentLanguageObj() {
    const store = this.$store.i18n as i18nStore;

    return store.languages.find((lang) => lang.code === store.current)!;
  },

  getCurrentFlagUrl(): string {
    const lang = this.getCurrentLanguageObj();

    if (!lang?.flag) return '';

    return `https://flagcdn.com/w20/${lang.flag.toLowerCase()}.png`;
  },

  getCurrentFlagAlt(): string {
    const lang = this.getCurrentLanguageObj();

    return `${lang.label || 'Language'} flag - ${(lang.flag || '').toUpperCase()}`;
  },

  getCurrentLanguageLabel(): string {
    const lang = this.getCurrentLanguageObj();

    return lang!.label;
  },

  selectLanguageOption(event: Event): void {
    const store = this.$store.i18n as i18nStore;

    const opt = (event.target as HTMLElement).closest('[data-lang-option]');

    if (opt) {
      const langCode = (opt as HTMLElement).dataset.langOption;

      if (langCode) {
        store.change(langCode);

        this.closeMobileMenu();
        this.hapticFeedback();
      }
    }
  },

  selectLanguageFromClick(event: Event): void {
    const store = this.$store.i18n as i18nStore;
    const opt = (event.target as HTMLElement).closest('[data-lang-option]');

    if (opt) {
      const langCode = (opt as HTMLElement).dataset.langOption;

      if (langCode) {
        store.change(langCode);

        this.langOpen = false;
        this.hapticFeedback();
      }
    }
  },
});
