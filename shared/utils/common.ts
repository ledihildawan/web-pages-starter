export const getValueByPath = (obj: Record<string, any> | null | undefined, path: string): any => {
  if (!obj || !path) return undefined;

  return path.split('.').reduce((prev: any, curr: string) => prev?.[curr], obj);
};

export const getCspNonce = (): string | undefined => {
  return document
    .querySelector('meta[http-equiv="Content-Security-Policy"]')
    ?.getAttribute('content')
    ?.match(/nonce-([a-zA-Z0-9+/=]+)/)?.[1];
};
