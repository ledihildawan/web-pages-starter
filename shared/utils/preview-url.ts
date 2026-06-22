import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'pathe';

const TEMP_DIR = 'temp';
const PREVIEW_URL_FILE = join(TEMP_DIR, 'preview-url.json');

const DEFAULT_EXPIRES_IN_MINUTES = 60;

export type TunnelProvider = 'ngrok' | 'cloudflared';

export interface SavedPreviewUrl {
  url: string;
  provider: TunnelProvider;
  savedAt: string;
  expiresAt: string;
}

export async function verifyUrlAccessible(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function savePreviewUrl(
  url: string,
  provider: TunnelProvider,
  expiresInMinutes: number = DEFAULT_EXPIRES_IN_MINUTES,
): Promise<void> {
  if (!existsSync(TEMP_DIR)) {
    mkdirSync(TEMP_DIR, { recursive: true });
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresInMinutes * 60 * 1000);

  const data: SavedPreviewUrl = {
    url,
    provider,
    savedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  writeFileSync(PREVIEW_URL_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export function loadPreviewUrl(): SavedPreviewUrl | null {
  if (!existsSync(PREVIEW_URL_FILE)) return null;

  try {
    return JSON.parse(readFileSync(PREVIEW_URL_FILE, 'utf-8')) as SavedPreviewUrl;
  } catch {
    return null;
  }
}

export function deletePreviewUrl(): void {
  if (existsSync(PREVIEW_URL_FILE)) {
    unlinkSync(PREVIEW_URL_FILE);
  }
}

export function isExpired(data: SavedPreviewUrl): boolean {
  const expiresAt = new Date(data.expiresAt).getTime();
  return Date.now() > expiresAt;
}

export async function getAndVerifyPreviewUrl(): Promise<{
  url: string;
  reason?: 'expired' | 'unaccessible';
} | null> {
  const data = loadPreviewUrl();

  if (!data) {
    return null;
  }

  if (isExpired(data)) {
    deletePreviewUrl();
    return { url: data.url, reason: 'expired' };
  }

  const accessible = await verifyUrlAccessible(data.url);

  if (!accessible) {
    deletePreviewUrl();
    return { url: data.url, reason: 'unaccessible' };
  }

  return { url: data.url };
}
