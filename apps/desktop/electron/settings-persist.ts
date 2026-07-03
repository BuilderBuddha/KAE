import { app } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import { DEFAULT_APP_SETTINGS, type AppSettings } from '@scooper/core';

function settingsPath(): string {
  return path.join(app.getPath('userData'), 'kae-settings.json');
}

/** Loads persisted app settings (never includes API keys). */
export async function loadPersistedSettings(): Promise<Partial<AppSettings>> {
  try {
    const raw = await fs.readFile(settingsPath(), 'utf8');
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    const { aiApiKey: _removed, ...safe } = parsed as Partial<AppSettings> & { aiApiKey?: string };
    return safe;
  } catch {
    return {};
  }
}

/** Persists app settings without API keys. */
export async function savePersistedSettings(settings: AppSettings): Promise<void> {
  const { aiApiKey: _removed, ...safe } = settings as AppSettings & { aiApiKey?: string };
  await fs.mkdir(path.dirname(settingsPath()), { recursive: true });
  await fs.writeFile(settingsPath(), JSON.stringify(safe, null, 2), 'utf8');
}

export function mergeAppSettings(partial?: Partial<AppSettings>): AppSettings {
  return { ...DEFAULT_APP_SETTINGS, ...partial };
}
