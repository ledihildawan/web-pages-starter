import './index.css';
import type { Alpine as AlpineType } from 'alpinejs';
import { contactFormData } from '../../features/contact/contact-form';

declare global {
  interface Window {
    Alpine?: AlpineType;
  }
}

if (typeof window !== 'undefined') {
  const register = () => {
    window.Alpine?.data('contactForm', contactFormData);
  };

  if (window.Alpine) {
    register();
  } else {
    document.addEventListener('alpine:init', register, { once: true });
  }
}
