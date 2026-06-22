document.addEventListener('alpine:init', () => {
  Alpine.data('homeHero', () => ({
    title: 'Web Pages Starter',
    subtitle: 'Build lightning-fast web applications',
    isMenuOpen: false,

    init() {},

    toggleMenu() {
      this.isMenuOpen = !this.isMenuOpen;
    },
  }));
});
