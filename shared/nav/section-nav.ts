export function registerSectionNavComponent(): void {
  Alpine.data('sectionNav', () => ({
    activeId: '',

    init(): void {
      const observer = new IntersectionObserver(
        (entries: IntersectionObserverEntry[]) => {
          entries.forEach((entry: IntersectionObserverEntry) => {
            if (entry.isIntersecting) {
              this.activeId = (entry.target as HTMLElement).id;
            }
          });
        },
        { rootMargin: '-30% 0px -50% 0px' },
      );

      const sections = document.querySelectorAll('section[id]');
      sections.forEach((section: Element) => {
        observer.observe(section);
      });
    },
  }));
}
