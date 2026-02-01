console.log('About page loaded');

const fadeInElements = () => {
  const elements = document.querySelectorAll('.grid > div');
  elements.forEach((el, index) => {
    setTimeout(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, index * 100);
  });
};

document.addEventListener('DOMContentLoaded', () => {
  const elements = document.querySelectorAll('.grid > div');
  elements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  });
  
  fadeInElements();
});
