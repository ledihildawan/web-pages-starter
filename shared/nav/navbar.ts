import type { i18nStore } from '@/packages/i18n/runtime/store';
import { defineData } from '@/utils/alpine';

const TRANSITION_OPEN = 700;
const TRANSITION_CLOSE = 500;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const transitionMs = (normal: number) => (prefersReducedMotion ? 0 : normal);

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
  _locked: false,
  _pluginsLoaded: false,
  _closeTimer: 0,

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

  _lock(ms: number) {
    clearTimeout(this._closeTimer);
    this._locked = true;
    this._closeTimer = setTimeout(() => {
      this._locked = false;
    }, ms) as unknown as number;
  },

  _escapeOr(fallback: () => void) {
    if (this.activeMobileSub !== null) this.activeMobileSub = null;
    else fallback();
  },

  _focusFirstLink() {
    if (this._menuFocusTriggered) return;
    this._menuFocusTriggered = true;
    this.$nextTick(() => {
      (this.$refs.mobileMenu?.querySelector('a[href], button:not([disabled])') as HTMLElement | null)?.focus();
    });
  },

  _restoreFocus() {
    const btn = document.querySelector<HTMLButtonElement>('[aria-controls="mobile-menu"]');
    btn?.focus();
  },

  _lockBody() {
    document.body.style.overflow = 'hidden';
    document.body.classList.add('menu-open');
  },

  _unlockBody() {
    document.body.style.overflow = '';
    document.body.classList.remove('menu-open');
  },

  _changeLanguage(event: Event, closeMobile: boolean) {
    const langCode = (event.target as HTMLElement).closest('[data-lang-option]')?.getAttribute('data-lang-option');
    if (!langCode) return;
    this.i18n.change(langCode);
    if (closeMobile) this.closeMobileMenu();
    else this.langOpen = false;
    this.hapticFeedback();
  },

  isActive(path: string): boolean {
    const base = this.basePath.replace(/\/$/, '') || '';
    const normalize = (p: string) => {
      let n = p.replace(/\.html$/, '').replace(/\/+$/, '');
      if (n === '' || n === '/index') n = '/';
      return n;
    };
    return normalize(this.currentPath) === normalize(base + path);
  },

  hapticFeedback() {
    navigator.vibrate?.(10);
  },

  onResize() {
    if (window.innerWidth >= 1024 && this.mobileMenuOpen) this.toggleMobile();
  },

  onNavEscape() {
    this._escapeOr(() => {
      this.langOpen = false;
    });
  },
  onMobileEscape() {
    this._escapeOr(() => {
      this.toggleMobile();
    });
  },
  onMenuEscape() {
    this._escapeOr(() => {
      this.closeMobileMenu();
    });
  },

  onMenuVisible() {
    if (this.mobileMenuOpen) this._focusFirstLink();
  },

  onAnimationEnd() {
    if (this.mobileMenuOpen && this.menuChildrenVisible) this._focusFirstLink();
  },

  resetMenuFocus() {
    this._menuFocusTriggered = false;
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
    this.touchStartY = e.touches[0]?.clientY ?? 0;
    this.isDragging = true;
  },

  handleTouchMove(e: TouchEvent) {
    if (!this.isDragging) return;
    this.touchCurrentY = e.touches[0]?.clientY ?? 0;
  },

  handleTouchEnd() {
    if (!this.isDragging) return;
    this.isDragging = false;
    if (this.touchCurrentY - this.touchStartY > 100) {
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
    if (this.isNavigating || this._locked) return false;

    this.isNavigating = true;
    this._lock(transitionMs(TRANSITION_CLOSE));
    this.hapticFeedback();
    this._menuFocusTriggered = false;
    this.mobileMenuOpen = false;

    const targetUrl = typeof url === 'string' ? url : null;
    const isAnchorLink = targetUrl?.includes('#') ?? false;
    const closeDelay = transitionMs(TRANSITION_CLOSE);

    if (targetUrl && !isAnchorLink) {
      setTimeout(() => {
        window.location.href = targetUrl;
      }, 200);
    }

    setTimeout(() => {
      this.menuChildrenVisible = false;
      this.activeMobileSub = null;
      this._unlockBody();
      this.isNavigating = false;
      this._restoreFocus();

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
    }, closeDelay);

    return true;
  },

  async toggleMobile() {
    if (this._locked) return;
    await this._ensurePlugins();

    if (this.mobileMenuOpen) {
      this.closeMobileMenu();
      return;
    }

    this._lock(transitionMs(TRANSITION_OPEN));
    this.scrollY = window.scrollY;
    this.focusedElement = document.activeElement;
    this._lockBody();
    this.mobileMenuOpen = true;
    this.navHidden = false;
    this.menuChildrenVisible = true;
    this.hapticFeedback();
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
    return this.i18n.languages.find((lang) => lang.code === this.i18n.current) ?? null;
  },

  getCurrentFlagUrl(): string {
    const lang = this.getCurrentLanguageObj();
    return lang?.flag ? `https://flagcdn.com/w20/${lang.flag.toLowerCase()}.png` : '';
  },

  getCurrentFlagAlt(): string {
    const lang = this.getCurrentLanguageObj();
    return lang ? `${lang.label ?? 'Language'} flag - ${lang.flag.toUpperCase()}` : 'Language flag';
  },

  getCurrentLanguageLabel(): string {
    return this.getCurrentLanguageObj()?.label ?? this.i18n.current.toUpperCase();
  },

  selectLanguageOption(event: Event) {
    this._changeLanguage(event, true);
  },
  selectLanguageFromClick(event: Event) {
    this._changeLanguage(event, false);
  },
}));
