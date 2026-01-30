export type AlpineCallback = () => void;

export type AlpineComponent<T = Record<string, unknown>> = T & {
  $el?: HTMLElement;
  $refs?: Record<string, HTMLElement>;
  init?: AlpineCallback;
  destroy?: AlpineCallback;
};

export interface AlpineData<T = Record<string, unknown>> {
  (this: HTMLElement): AlpineComponent<T>;
}

export function defineAlpineData<T extends Record<string, unknown>>(
  fn: (this: HTMLElement) => T
): AlpineData<T> {
  return fn as AlpineData<T>;
}