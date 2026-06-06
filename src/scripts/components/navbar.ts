export function navbarData() {
  return {
    mobileMenuOpen: false,
    menuChildrenVisible: false,
    langOpen: false,
    scrolled: false,
    navHidden: false,
    lastScroll: 0,
    activeMobileSub: null,
    scrollY: 0,
    currentPath: window.location.pathname,
    isNavigating: false,
    touchStartY: 0,
    touchCurrentY: 0,
    isDragging: false,
    focusedElement: null as Element | null,
    $cleanup: null as (() => void) | null,

    isActive(path: string) {
      const current = this.currentPath.replace(/\/$/, '') || '/';
      const target = path.replace(/\/$/, '') || '/';
      return current === target;
    },

    hapticFeedback() {
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
    },

    init() {
      this.lastScroll = window.scrollY;
      this.scrolled = this.lastScroll > 20;

      if (window.location.hash) {
        this.navHidden = true;
      }

      let ticking = false;
      const handleScroll = () => {
        if (this.mobileMenuOpen) return;
        if (!ticking) {
          requestAnimationFrame(() => {
            const currentScroll = window.scrollY;
            this.scrolled = currentScroll > 20;
            if (currentScroll > this.lastScroll && currentScroll > 150) {
              this.navHidden = true;
            } else if (currentScroll < this.lastScroll) {
              this.navHidden = false;
            }
            this.lastScroll = currentScroll;
            ticking = false;
          });
          ticking = true;
        }
      };
      window.addEventListener('scroll', handleScroll, { passive: true });

      const handleTouchStart = (e: TouchEvent) => {
        if (!this.mobileMenuOpen) return;
        this.touchStartY = e.touches[0].clientY;
        this.isDragging = true;
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (!this.mobileMenuOpen || !this.isDragging) return;
        this.touchCurrentY = e.touches[0].clientY;
        const diff = this.touchCurrentY - this.touchStartY;

        if (diff > 0) {
          const menu = document.getElementById('mobile-menu');
          if (menu) {
            menu.style.transform = `translateY(${Math.min(diff, 300)}px)`;
          }
        }
      };

      const handleTouchEnd = () => {
        if (!this.mobileMenuOpen || !this.isDragging) return;
        this.isDragging = false;
        const diff = this.touchCurrentY - this.touchStartY;

        const menu = document.getElementById('mobile-menu');
        if (menu) {
          menu.style.transform = '';
        }

        if (diff > 100) {
          this.hapticFeedback();
          this.closeMobileMenu();
        }
      };

      window.addEventListener('touchstart', handleTouchStart, {
        passive: true,
      });
      window.addEventListener('touchmove', handleTouchMove, { passive: true });
      window.addEventListener('touchend', handleTouchEnd);

      this.$cleanup = () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('touchstart', handleTouchStart);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    },

    closeMobileMenu(url: string | null = null) {
      if (this.isNavigating) return;
      this.isNavigating = true;

      this.hapticFeedback();

      this.mobileMenuOpen = false;

      const menuButton = document.querySelector(
        '[aria-controls="mobile-menu"]',
      );
      if (menuButton) {
        setTimeout(() => (menuButton as HTMLElement).focus(), 550);
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

        document.body.classList.remove('no-scroll');
        document.body.style.insetBlockStart = '';
        document.documentElement.style.setProperty('--scrollbar-width', '0px');

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

          const htmlStyle = document.documentElement.style;
          const bodyStyle = document.body.style;
          const originalScrollBehavior = htmlStyle.scrollBehavior || '';

          htmlStyle.scrollBehavior = 'auto';
          bodyStyle.scrollBehavior = 'auto';
          window.scrollTo(0, this.scrollY);

          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              htmlStyle.scrollBehavior = originalScrollBehavior;
              bodyStyle.scrollBehavior = '';
            });
          });
        }
      }, 500);

      return true;
    },

    toggleMobile() {
      if (!this.mobileMenuOpen) {
        this.focusedElement = document.activeElement;

        this.scrollY = window.scrollY;
        const sbWidth =
          window.innerWidth - document.documentElement.clientWidth;

        document.body.style.insetBlockStart = `-${this.scrollY}px`;
        document.body.classList.add('no-scroll');
        document.documentElement.style.setProperty(
          '--scrollbar-width',
          `${sbWidth}px`,
        );

        this.mobileMenuOpen = true;
        this.navHidden = false;

        this.hapticFeedback();

        setTimeout(() => {
          const firstLink = document.querySelector('#mobile-menu a[href]');
          if (firstLink) (firstLink as HTMLElement).focus();
        }, 750);

        setTimeout(() => {
          this.menuChildrenVisible = true;
        }, 50);
      } else {
        this.closeMobileMenu();
      }
    },
  };
}

export function registerNavbarComponent(): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (!globalThis.Alpine) {
    return;
  }

  globalThis.Alpine.data('navbar', navbarData);
}
