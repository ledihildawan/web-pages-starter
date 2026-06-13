import slug from 'limax';

const CUSTOM_MAPPINGS: Record<string, string> = {};

export function romanize(name: string): string {
  return slug(name, {
    tone: true,
    maintainCase: false,
    custom: CUSTOM_MAPPINGS,
  });
}
