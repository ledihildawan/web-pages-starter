import type { i18nStore } from '@/packages/i18n/runtime/store';
import { defineData } from '@/utils/alpine';

export default defineData('navbar', () => ({
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
  _pluginsLoaded: false,

  get i18n(): i18nStore {
    return this.$store.i18n as i18nStore;
  },

  async _ensurePlugins() {
    if (this._pluginsLoaded) return;
    this._pluginsLoaded = true;
    const [collapse, focus] = await Promise.all([
      import('@alpinejs/collapse').then((m) => m.default),
      import('@alpinejs/focus').then((m) => m.default),
    ]);
    globalThis.Alpine.plugin(collapse);
    globalThis.Alpine.plugin(focus);
  },

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

  hapticFeedback() {
    if (navigator.vibrate) navigator.vibrate(10);
  },

  onResize() {
    if (window.innerWidth >= 1024 && this.mobileMenuOpen) this.toggleMobile();
  },

  onNavEscape() {
    if (this.activeMobileSub !== null) this.activeMobileSub = null;
    else this.langOpen = false;
  },

  onMobileEscape() {
    if (this.activeMobileSub !== null) this.activeMobileSub = null;
    else this.toggleMobile();
  },

  onMenuEscape() {
    if (this.activeMobileSub !== null) this.activeMobileSub = null;
    else this.closeMobileMenu();
  },

  init() {
    this.lastScroll = window.scrollY;
    this.scrolled = this.lastScroll > 20;
  },

  onScroll() {
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

  handleTouchStart(e: TouchEvent) {
    this.touchStartY = e.touches[0].clientY;
    this.isDragging = true;
  },

  handleTouchMove(e: TouchEvent) {
    if (!this.isDragging) return;

    this.touchCurrentY = e.touches[0].clientY;
  },

  handleTouchEnd() {
    if (!this.isDragging) return;

    this.isDragging = false;

    const diff = this.touchCurrentY - this.touchStartY;

    if (diff > 100) {
      this.hapticFeedback();
      this.closeMobileMenu();
    }
  },

  toggleSubmenuWithFeedback(index: number) {
    this.activeMobileSub = this.activeMobileSub === index ? null : index;

    this.hapticFeedback();
  },

  closeMenuAndFeedback(url: string) {
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

  async toggleMobile() {
    await this._ensurePlugins();
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

  navigateToHome() {
    const homeUrl = this.basePath.endsWith('/') ? this.basePath : `${this.basePath}/`;

    if (this.mobileMenuOpen) {
      this.closeMobileMenu(homeUrl);
    } else {
      window.location.href = homeUrl;
    }
  },

  getCurrentLanguageObj() {
    return this.i18n.languages.find((lang) => lang.code === this.i18n.current)!;
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

  selectLanguageOption(event: Event) {
    const opt = (event.target as HTMLElement).closest('[data-lang-option]');

    if (opt) {
      const langCode = (opt as HTMLElement).dataset.langOption;

      if (langCode) {
        this.i18n.change(langCode);

        this.closeMobileMenu();
        this.hapticFeedback();
      }
    }
  },

  selectLanguageFromClick(event: Event) {
    const opt = (event.target as HTMLElement).closest('[data-lang-option]');

    if (opt) {
      const langCode = (opt as HTMLElement).dataset.langOption;

      if (langCode) {
        this.i18n.change(langCode);

        this.langOpen = false;
        this.hapticFeedback();
      }
    }
  },
}));
