import { readFileSync } from 'node:fs';
import path from 'node:path';
import { lookup } from '@generated/paths';

const TEMPLATES_DIR = lookup('@codegen', 'templates');

export function loadTemplate(name: string): string {
  return readFileSync(path.join(TEMPLATES_DIR, name), 'utf-8');
}

export function inject(template: string, values: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replaceAll(`{{codegen:${key}}}`, value);
  }
  return result;
}
