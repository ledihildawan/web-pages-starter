export const toDateObj = (date: string | number | Date): Date => typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

export const jsonAttr = (value: unknown): string => {
  return JSON.stringify(value).replace(/"/g, '&quot;');
};

export const getValueByPath = (
  obj: Record<string, any> | null | undefined,
  path: string
): any => {
  if (!obj || !path) return undefined;

  return path.split('.').reduce((prev: any, curr: string) => prev?.[curr], obj);
};