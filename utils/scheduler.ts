export const deferTask = (fn: () => void): void => {
  scheduler.postTask(fn, { priority: 'background' });
};

export const deferVisible = (fn: () => void): void => {
  scheduler.postTask(fn, { priority: 'user-visible' });
};
