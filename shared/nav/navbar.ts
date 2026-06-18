export function registerNavbarComponent(): void {
  const basePath = typeof window.__BASE_PATH__ === 'string' ? window.__BASE_PATH__ : '/';

  Alpine.data('navbar', () => ({
    mobileMenuOpen: false,
    menuChildrenVisible: false,
    langOpen: false,
    scrolled: false,
    navHidden: false,
    lastScroll: 0,
    activeMobileSub: null as number | null,
    scrollY: 0,
    currentPath: window.location.pathname,
    basePath,
    isNavigating: false,
    touchStartY: 0,
    touchCurrentY: 0,
    isDragging: false,
    focusedElement: null as Element | null,
    _ticking: false,
    _pluginPromise: null as Promise<void> | null,
    _pluginsReady: false,
    _menuFocusTriggered: false,

    get pluginsReady() {
      return this._pluginsReady;
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

    hapticFeedback(): void {
      if (navigator.vibrate) navigator.vibrate(10);
    },

    async _loadPlugins(): Promise<void> {
      try {
        const [collapse, focus] = await Promise.all([import('@alpinejs/collapse'), import('@alpinejs/focus')]);
        Alpine.plugin(collapse.default);
        Alpine.plugin(focus.default);
      } catch (e) {
        console.warn('Failed to load Alpine plugins:', e);
      }
      this._pluginsReady = true;
    },

    init(): void {
      this.lastScroll = window.scrollY;
      this.scrolled = this.lastScroll > 20;
      this._pluginPromise = this._loadPlugins();
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

    onAnimationEnd(): void {
      if (this.mobileMenuOpen && this.menuChildrenVisible) {
        this.$nextTick(() => this.focusFirstLink());
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

    async toggleMobile(): Promise<void> {
      if (!this._pluginsReady) await this._pluginPromise;
      if (!this.mobileMenuOpen) {
        this.focusedElement = document.activeElement;
        this.scrollY = window.scrollY;
        document.body.classList.add('menu-open');
        this.mobileMenuOpen = true;
        this.navHidden = false;
        this.hapticFeedback();
        this.menuChildrenVisible = true;
      } else {
        this.closeMobileMenu();
      }
    },

    focusFirstLink(): void {
      if (!this.mobileMenuOpen) return;
      const firstLink = this.$refs.mobileMenu?.querySelector('a[href]') as HTMLElement | null;
      if (firstLink) firstLink.focus();
    },

    onMenuVisible(): void {
      if (this.mobileMenuOpen && !this._menuFocusTriggered) {
        this._menuFocusTriggered = true;
        this.$nextTick(() => this.focusFirstLink());
      }
    },

    resetMenuFocus(): void {
      this._menuFocusTriggered = false;
    },

    isDesktopWidth(): boolean {
      return window.innerWidth >= 1024;
    },

    navigateToHome(): void {
      const homeUrl = this.basePath.endsWith('/') ? this.basePath : `${this.basePath}/`;
      if (this.mobileMenuOpen) {
        this.closeMobileMenu(homeUrl);
      } else {
        window.location.href = homeUrl;
      }
    },

    getCurrentLanguageObj(): { code: string; label: string; flag: string } | null {
      const { languages, current } = this.$store.i18n;
      if (!languages || !current) return null;
      return languages.find((lang: { code: string; label: string; flag: string }) => lang.code === current) ?? null;
    },

    getCurrentFlagUrl(): string {
      const lang = this.getCurrentLanguageObj();
      if (!lang?.flag) return '';
      return `https://flagcdn.com/w20/${lang.flag.toLowerCase()}.png`;
    },

    getCurrentFlagAlt(): string {
      const lang = this.getCurrentLanguageObj();
      if (!lang) return 'Language flag';
      return `${lang.label || 'Language'} flag - ${(lang.flag || '').toUpperCase()}`;
    },

    getCurrentLanguageLabel(): string {
      const lang = this.getCurrentLanguageObj();
      if (!lang?.label) return this.$store.i18n.current.toUpperCase();
      return lang.label;
    },

    selectLanguageOption(event: Event): void {
      const opt = (event.target as HTMLElement).closest('[data-lang-option]');
      if (opt) {
        const langCode = (opt as HTMLElement).dataset.langOption;
        if (langCode) {
          this.$store.i18n.change(langCode);
          this.closeMobileMenu();
          this.hapticFeedback();
        }
      }
    },

    selectLanguageFromClick(event: Event): void {
      const opt = (event.target as HTMLElement).closest('[data-lang-option]');
      if (opt) {
        const langCode = (opt as HTMLElement).dataset.langOption;
        if (langCode) {
          this.$store.i18n.change(langCode);
          this.langOpen = false;
          this.hapticFeedback();
        }
      }
    },
  }));
}
