type Task = () => void;

interface MicrotaskQueueOptions {
  maxBatchSize?: number;
  flushOnUnload?: boolean;
}

class MicrotaskQueue {
  #queue: Task[] = [];
  #scheduled = false;
  #maxBatchSize: number;
  #flushOnUnload: boolean;

  constructor(options: MicrotaskQueueOptions = {}) {
    this.#maxBatchSize = options.maxBatchSize ?? 100;
    this.#flushOnUnload = options.flushOnUnload ?? true;

    if (
      this.#flushOnUnload &&
      typeof globalThis.addEventListener === 'function'
    ) {
      globalThis.addEventListener('beforeunload', () => this.flush(), {
        once: true,
      });
    }
  }

  push(task: Task): void {
    this.#queue.push(task);
    this.#schedule();
  }

  pushBatch(tasks: Task[]): void {
    this.#queue.push(...tasks);
    this.#schedule();
  }

  #schedule(): void {
    if (this.#scheduled || this.#queue.length === 0) return;
    this.#scheduled = true;
    queueMicrotask(() => this.flush());
  }

  flush(): void {
    this.#scheduled = false;
    const batch = this.#queue.splice(0, this.#maxBatchSize);
    for (const task of batch) {
      try {
        task();
      } catch (err) {
        console.warn('[microtask-queue] task failed:', err);
      }
    }
    if (this.#queue.length > 0) {
      if (typeof globalThis.requestAnimationFrame === 'function') {
        globalThis.requestAnimationFrame(() => this.#schedule());
      } else {
        setTimeout(() => this.#schedule(), 0);
      }
    }
  }

  clear(): void {
    this.#queue = [];
    this.#scheduled = false;
  }

  get size(): number {
    return this.#queue.length;
  }

  get isEmpty(): boolean {
    return this.#queue.length === 0;
  }
}

const microtaskQueue = new MicrotaskQueue();
export const scheduleTask = (task: Task): void => microtaskQueue.push(task);
