import type { AlpineComponent, AlpineData } from '@/types/alpine';

interface HomeController extends AlpineComponent {
  init(): void;
  sayHello(): void;
}

export default function homeController(): AlpineData<HomeController> {
  return () => ({
    init(): void {
      console.log('Home logic ready!');
    },
    sayHello(): void {
      alert('Hello from AlpineJS with Feature-Driven Design!');
    }
  });
}