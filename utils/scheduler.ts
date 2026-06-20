const hasScheduler = typeof scheduler !== 'undefined' && 'postTask' in scheduler;

export const deferTask = (fn: () => void): void => {
  if (hasScheduler) {
    scheduler.postTask(fn, { priority: 'background' });
  } else {
    setTimeout(fn, 0);
  }
};

export const deferVisible = (fn: () => void): void => {
  if (hasScheduler) {
    scheduler.postTask(fn, { priority: 'user-visible' });
  } else {
    setTimeout(fn, 0);
  }
};
