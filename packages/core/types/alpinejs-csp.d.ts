declare module '@alpinejs/csp' {
  export interface XDataContext {
    $el: HTMLElement;
    $refs: Record<string, HTMLElement>;
    $nextTick(callback: () => void): void;
    $store: Record<string, unknown>;
    $dispatch(event: string, detail?: unknown): void;
    $watch(property: string, callback: (value: unknown) => void): void;
  }

  export type AlpineComponent<T> = T & XDataContext & Record<string, unknown>;

  const Alpine: {
    (start?: boolean): void;
    data<T>(name: string, factory: () => AlpineComponent<T>): void;
    store(name: string, value: Record<string, unknown>): void;
    start(): void;
    plugin(plugin: unknown): void;
  };

  export default Alpine;
}
