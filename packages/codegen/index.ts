import { readFileSync } from 'node:fs';
import path from 'node:path';
import { lookup } from '@generated/paths';

const TEMPLATES_DIR = lookup('@codegen', 'templates');

export function loadTemplate(name: string): string {
  const safeName = name.replace(/\.\./g, '').replace(/^[/\\]/, '');
  const fullPath = path.join(TEMPLATES_DIR, safeName);
  if (!fullPath.startsWith(TEMPLATES_DIR)) {
    throw new Error(`[codegen] Invalid template name: ${name}`);
  }
  return readFileSync(fullPath, 'utf-8');
}

export function inject(template: string, values: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    const escaped = value.replace(/\{\{/g, '\\{\\{').replace(/\}\}/g, '\\}\\}');
    result = result.replaceAll(`{{codegen:${key}}}`, escaped);
  }
  return result;
}
