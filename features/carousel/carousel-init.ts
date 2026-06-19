import '@splidejs/splide/dist/css/splide.min.css';

import Splide from '@splidejs/splide';

export function initCarousel(): void {
  const el = document.getElementById('main-carousel');

  if (el) {
    new Splide(el, {
      type: 'fade',
      rewind: true,
      autoplay: true,
      interval: 4000,
      speed: 1000,
      lazyLoad: 'nearby',
      preloadPages: 1,
      arrows: true,
      pagination: true,
      keyboard: true,
    }).mount();
  }
}
