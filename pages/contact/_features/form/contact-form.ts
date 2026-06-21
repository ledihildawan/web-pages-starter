import i18next from 'i18next';

type ContactFormEl = HTMLInputElement | HTMLTextAreaElement;

interface ContactFormField {
  el: ContactFormEl;
  errorEl: HTMLElement | null;
  message: string;
  validate: (value: string) => string | null;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function contactFormData() {
  return {
    statusMessage: '',

    fields(): ContactFormField[] {
      const form = (this as unknown as { $root: HTMLElement }).$root as HTMLFormElement;
      return Array.from(form.querySelectorAll<ContactFormEl>('input[required], textarea[required]')).map((el) => {
        const id = el.id;
        const errorEl = form.querySelector<HTMLElement>(`[data-error-for="${id}"]`);
        return {
          el,
          errorEl,
          message: '',
          validate(value: string) {
            const trimmed = value.trim();
            if (!trimmed) return i18next.t('contact:contact.form.errors.required');
            if (el.type === 'email' && !EMAIL_PATTERN.test(trimmed)) {
              return i18next.t('contact:contact.form.errors.email_invalid');
            }
            return null;
          },
        };
      });
    },

    clearError(field: ContactFormField) {
      field.el.setAttribute('aria-invalid', 'false');
      if (field.errorEl) {
        field.errorEl.textContent = '';
        field.errorEl.classList.add('hidden');
      }
    },

    setError(field: ContactFormField, message: string) {
      field.el.setAttribute('aria-invalid', 'true');
      if (field.errorEl) {
        field.errorEl.classList.remove('hidden');
        field.errorEl.textContent = message;
      }
    },

    validate() {
      const form = (this as unknown as { $root: HTMLElement }).$root as HTMLFormElement;
      const fieldsList = this.fields();
      const invalid: ContactFormField[] = [];

      for (const field of fieldsList) {
        const message = field.validate(field.el.value);
        if (message) {
          this.setError(field, message);
          invalid.push(field);
        } else {
          this.clearError(field);
        }
      }

      if (invalid.length > 0) {
        this.statusMessage = i18next.t('contact:contact.form.errors.submit_errors', { count: invalid.length });
        invalid[0].el.focus();
        return;
      }

      this.statusMessage = i18next.t('contact:contact.form.submitting');
      form.submit();
    },
  };
}
