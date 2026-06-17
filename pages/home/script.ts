console.log('Home page loaded');

document.addEventListener('alpine:init', () => {
  window.Alpine?.data('homeHero', () => ({
    title: 'Web Pages Starter',
    subtitle: 'Build lightning-fast web applications',
    isMenuOpen: false,

    init() {
      console.log('Home hero initialized');
    },

    toggleMenu() {
      this.isMenuOpen = !this.isMenuOpen;
    },
  }));
});
