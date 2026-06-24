import type { AlpineComponent } from 'alpinejs';


export function defineData<T extends { [key in keyof T]: T[key] }>(name: string, factory: () => AlpineComponent<T>) {
  return { type: 'data' as const, name, factory };
}

export function defineStore<T>(name: string, value: T) {
  return { type: 'store' as const, name, value };
}
