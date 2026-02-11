import Splide from '@splidejs/splide';
import '@splidejs/splide/dist/css/splide.min.css';

document.addEventListener('DOMContentLoaded', () => {
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
    }).mount();
  }
});
