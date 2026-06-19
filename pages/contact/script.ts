import { contactFormData } from '../../features/contact-form/contact-form';

document.addEventListener('alpine:init', () => {
  Alpine.data('contactForm', contactFormData);
});
