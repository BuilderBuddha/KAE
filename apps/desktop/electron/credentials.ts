import { app, safeStorage } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { AIProviderId } from '@scooper/core';

const PROVIDER_IDS: AIProviderId[] = [
  'openai',
  'claude',
  'gemini',
  'openrouter',
  'ollama',
];

function credentialsDir(): string {
  return path.join(app.getPath('userData'), 'credentials');
}

function credentialPath(providerId: AIProviderId): string {
  return path.join(credentialsDir(), `${providerId}.cred`);
}

function modePath(): string {
  return path.join(credentialsDir(), '.mode');
}

export function isSecureStorageAvailable(): boolean {
  return safeStorage.isEncryptionAvailable();
}

export function secureStorageMode(): 'available' | 'dev_fallback' {
  return isSecureStorageAvailable() ? 'available' : 'dev_fallback';
}

export async function saveProviderApiKey(providerId: AIProviderId, apiKey: string): Promise<void> {
  const trimmed = apiKey.trim();
  if (!trimmed) {
    await deleteProviderApiKey(providerId);
    return;
  }

  await fs.mkdir(credentialsDir(), { recursive: true });
  if (isSecureStorageAvailable()) {
    const encrypted = safeStorage.encryptString(trimmed);
    await fs.writeFile(credentialPath(providerId), encrypted);
    await fs.writeFile(modePath(), 'secure', 'utf8');
    return;
  }

  await fs.writeFile(credentialPath(providerId), Buffer.from(trimmed, 'utf8').toString('base64'), 'utf8');
  await fs.writeFile(modePath(), 'dev-fallback', 'utf8');
}

export async function loadProviderApiKey(providerId: AIProviderId): Promise<string | undefined> {
  try {
    const raw = await fs.readFile(credentialPath(providerId));
    if (isSecureStorageAvailable()) {
      return safeStorage.decryptString(raw);
    }
    return Buffer.from(raw.toString('utf8'), 'base64').toString('utf8');
  } catch {
    return undefined;
  }
}

export async function deleteProviderApiKey(providerId: AIProviderId): Promise<void> {
  try {
    await fs.unlink(credentialPath(providerId));
  } catch {
    /* already removed */
  }
}

export async function hasProviderApiKey(providerId: AIProviderId): Promise<boolean> {
  const key = await loadProviderApiKey(providerId);
  return Boolean(key?.trim());
}

export async function loadActiveProviderApiKey(providerId: AIProviderId): Promise<string | undefined> {
  if (providerId === 'mock' || providerId === 'deterministic') return undefined;
  return loadProviderApiKey(providerId);
}

export async function listProviderKeyStatus(): Promise<Record<string, boolean>> {
  const status: Record<string, boolean> = {};
  for (const providerId of PROVIDER_IDS) {
    status[providerId] = await hasProviderApiKey(providerId);
  }
  return status;
}
