import type { AlpineData } from '@/types/alpine';

type StoreKey = string;

type Listener<T> = (state: T) => void;

interface StoreOptions<T> {
  initial: T;
  persist?: boolean;
  persistKey?: string;
}

class AlpineStore<T extends Record<string, unknown>> {
  private state: T;
  private listeners: Set<Listener<T>>;
  private persistKey?: string;

  constructor(options: StoreOptions<T>) {
    this.state = options.initial;
    this.listeners = new Set();
    this.persistKey = options.persistKey;

    if (options.persist && typeof window !== 'undefined') {
      this.loadPersisted();
    }
  }

  get(): T {
    return { ...this.state };
  }

  set(newState: Partial<T>): void {
    this.state = { ...this.state, ...newState };
    this.notify();
    this.persist();
  }

  update(updater: (state: T) => Partial<T>): void {
    const updates = updater(this.state);
    this.set(updates);
  }

  subscribe(listener: Listener<T>): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  private persist(): void {
    if (this.persistKey && typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.persistKey, JSON.stringify(this.state));
      } catch (error) {
        console.error('Failed to persist store:', error);
      }
    }
  }

  private loadPersisted(): void {
    if (this.persistKey && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(this.persistKey);
        if (saved) {
          this.state = JSON.parse(saved);
        }
      } catch (error) {
        console.error('Failed to load persisted store:', error);
      }
    }
  }

  reset(): void {
    this.set({} as Partial<T>);
  }
}

const stores = new Map<StoreKey, AlpineStore<Record<string, unknown>>>();

export function defineStore<T extends Record<string, unknown>>(
  name: string,
  initial: T,
  persist = false
): AlpineData<T> {
  const store = new AlpineStore<T>({
    initial,
    persist,
    persistKey: `store_${name}`,
  });

  stores.set(name, store as AlpineStore<Record<string, unknown>>);

  return () => {
    const state = store.get();

    return Object.entries(state).reduce((acc, [key, value]) => {
      if (typeof value === 'function') {
        (acc as any)[key] = value;
      } else {
        Object.defineProperty(acc, key, {
          get: () => (store.get() as any)[key],
          set: (newValue: unknown) => {
            store.set({ [key]: newValue } as Partial<T>);
          },
          enumerable: true,
        });
      }

      return acc;
    }, {} as T);
  };
}

export function getStore<T extends Record<string, unknown>>(name: string): AlpineStore<T> | undefined {
  return stores.get(name) as AlpineStore<T> | undefined;
}