import Splide from '@splidejs/splide';
// CSS Core Splide
import '@splidejs/splide/css/core'; 
// CSS untuk styling default spinner bawaan Splide (Opsional tapi disarankan untuk lazy load)
import '@splidejs/splide/css'; 

import './carousel-demo.css';

document.addEventListener('DOMContentLoaded', () => {
  const el = document.getElementById('main-carousel');
  
  if (el) {
    new Splide(el, {
      type: 'fade',
      rewind: true,
      autoplay: true,
      interval: 4000,
      speed: 1000,
      
      // === KONFIGURASI LAZY LOAD ===
      // 'nearby': Load slide aktif + 1 slide tetangganya (Kanan/Kiri). 
      // 'sequential': Load satu per satu berurutan (kurang cocok untuk hero banner).
      lazyLoad: 'nearby',
      
      // Berapa banyak slide di samping yang mau di-preload?
      // 1 artinya: Load Slide saat ini, dan 1 slide berikutnya.
      preloadPages: 1, 

      arrows: true,
      pagination: true,
    }).mount();
  }
});