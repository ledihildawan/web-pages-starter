import { contactFormData } from './_features/form/contact-form';

document.addEventListener('alpine:init', () => {
  Alpine.data('contactForm', contactFormData);
});
