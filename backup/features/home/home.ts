import i18next from 'i18next';

export default function homeController() {
  return {
    sayHello(): void {
      const message = i18next.t('home.btn_action') ?? 'Hello!';
      alert(message);
    }
  };
}