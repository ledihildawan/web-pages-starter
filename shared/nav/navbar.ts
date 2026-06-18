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
    basePath: basePath,
    isNavigating: false,
    touchStartY: 0,
    touchCurrentY: 0,
    isDragging: false,
    focusedElement: null,
    _ticking: false,
    _pluginPromise: null as unknown as Promise<void>,
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
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
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
      if (menuButton) {
        setTimeout(() => menuButton.focus(), 100);
      }

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const self = this as any;
      if (!self._pluginsReady) {
        await self._pluginPromise;
      }

      if (!self.mobileMenuOpen) {
        self.focusedElement = document.activeElement;

        self.scrollY = window.scrollY;

        document.body.classList.add('menu-open');

        self.mobileMenuOpen = true;
        self.navHidden = false;

        self.hapticFeedback();

        self.menuChildrenVisible = true;
      } else {
        self.closeMobileMenu();
      }
    },

    focusFirstLink(): void {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const self = this as any;
      if (!self.mobileMenuOpen) return;
      const firstLink = self.$refs.mobileMenu?.querySelector('a[href]') as HTMLElement | null;
      if (firstLink) firstLink.focus();
    },

    onMenuVisible(): void {
      if (this.mobileMenuOpen && !this._menuFocusTriggered) {
        this._menuFocusTriggered = true;
        const self = this as unknown as { $nextTick: (fn: () => void) => void };
        self.$nextTick(() => this.focusFirstLink());
      }
    },

    resetMenuFocus(): void {
      this._menuFocusTriggered = false;
    },

    isDesktopWidth(): boolean {
      return window.innerWidth >= 1024;
    },

    navigateToHome(): void {
      if (this.mobileMenuOpen) {
        this.closeMobileMenu('{{ url("/") }}');
      } else {
        window.location.href = '{{ url("/") }}';
      }
    },

    getCurrentLanguageObj(): Record<string, unknown> | null {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const store = this.$store as any;
      if (!store.i18n || !store.i18n.languages || !store.i18n.current) return null;
      const current = store.i18n.current;
      const languages = store.i18n.languages;
      for (let i = 0; i < languages.length; i++) {
        if (languages[i].code === current) return languages[i];
      }
      return null;
    },

    getCurrentFlagUrl(): string {
      const lang = this.getCurrentLanguageObj();
      if (!lang || !lang.flag) return '';
      return 'https://flagcdn.com/w20/' + String(lang.flag).toLowerCase() + '.png';
    },

    getCurrentFlagAlt(): string {
      const lang = this.getCurrentLanguageObj();
      if (!lang) return 'Language flag';
      const label = lang.label || 'Language';
      const flag = String(lang.flag || '').toUpperCase();
      return label + ' flag - ' + flag;
    },

    getCurrentLanguageLabel(): string {
      const lang = this.getCurrentLanguageObj();
      const store = this.$store as unknown as { i18n: { current: string } };
      if (!lang || !lang.label) return store.i18n.current.toUpperCase();
      return String(lang.label);
    },

    selectLanguageOption(event: Event): void {
      const target = event.target as HTMLElement;
      const opt = target.closest('[data-lang-option]');
      if (opt) {
        const langCode = (opt as unknown as { dataset: { langOption: string } }).dataset.langOption;
        const store = this.$store as unknown as { i18n: { change: (code: string) => void } };
        store.i18n.change(langCode);
        this.closeMobileMenu();
        this.hapticFeedback();
      }
    },

    selectLanguageFromClick(event: Event): void {
      const target = event.target as HTMLElement;
      const opt = target.closest('[data-lang-option]');
      if (opt) {
        const langCode = (opt as unknown as { dataset: { langOption: string } }).dataset.langOption;
        const store = this.$store as unknown as { i18n: { change: (code: string) => void } };
        store.i18n.change(langCode);
        this.langOpen = false;
        this.hapticFeedback();
      }
    },
  }));
}
