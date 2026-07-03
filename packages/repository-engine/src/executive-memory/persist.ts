import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { ExecutiveMemoryManifest, ExecutiveSessionRecord } from '@scooper/core';

export const EXECUTIVE_MEMORY_DIR = 'executive-memory';
export const DEFAULT_FOUNDER_NAME = 'Albert';

export function executiveMemoryRoot(repositoryPath: string): string {
  return path.join(repositoryPath, '.kae-sessions', EXECUTIVE_MEMORY_DIR);
}

function manifestPath(repositoryPath: string): string {
  return path.join(executiveMemoryRoot(repositoryPath), 'manifest.json');
}

function sessionPath(repositoryPath: string, sessionId: string): string {
  return path.join(executiveMemoryRoot(repositoryPath), 'sessions', `${sessionId}.json`);
}

function archivePath(repositoryPath: string, sessionId: string): string {
  return path.join(executiveMemoryRoot(repositoryPath), 'archive', `${sessionId}.json`);
}

async function ensureDirs(repositoryPath: string): Promise<void> {
  const root = executiveMemoryRoot(repositoryPath);
  await fs.mkdir(path.join(root, 'sessions'), { recursive: true });
  await fs.mkdir(path.join(root, 'archive'), { recursive: true });
}

export async function loadExecutiveMemoryManifest(
  repositoryPath: string,
): Promise<ExecutiveMemoryManifest> {
  try {
    const raw = await fs.readFile(manifestPath(repositoryPath), 'utf8');
    const parsed = JSON.parse(raw) as ExecutiveMemoryManifest;
    if (parsed.version === 1 && parsed.repositoryPath) return parsed;
  } catch {
    /* create default */
  }
  return {
    version: 1,
    repositoryPath,
    founderName: DEFAULT_FOUNDER_NAME,
    sessions: [],
  };
}

export async function saveExecutiveMemoryManifest(
  repositoryPath: string,
  manifest: ExecutiveMemoryManifest,
): Promise<void> {
  await ensureDirs(repositoryPath);
  await fs.writeFile(manifestPath(repositoryPath), JSON.stringify(manifest, null, 2), 'utf8');
}

export async function loadExecutiveSessionByConversation(
  repositoryPath: string,
  conversationId: string,
): Promise<ExecutiveSessionRecord | null> {
  const manifest = await loadExecutiveMemoryManifest(repositoryPath);
  const entry = manifest.sessions.find((item) => item.conversationId === conversationId);
  if (!entry) return null;
  return loadExecutiveSessionById(repositoryPath, entry.sessionId);
}

export async function loadExecutiveSessionById(
  repositoryPath: string,
  sessionId: string,
): Promise<ExecutiveSessionRecord | null> {
  for (const loader of [
    () => fs.readFile(sessionPath(repositoryPath, sessionId), 'utf8'),
    () => fs.readFile(archivePath(repositoryPath, sessionId), 'utf8'),
  ]) {
    try {
      const raw = await loader();
      const parsed = JSON.parse(raw) as ExecutiveSessionRecord;
      if (parsed.sessionId && parsed.conversationId) return parsed;
    } catch {
      /* try next */
    }
  }
  return null;
}

export async function loadActiveExecutiveSession(
  repositoryPath: string,
): Promise<ExecutiveSessionRecord | null> {
  const manifest = await loadExecutiveMemoryManifest(repositoryPath);
  if (!manifest.activeSessionId) return null;
  return loadExecutiveSessionById(repositoryPath, manifest.activeSessionId);
}

export async function saveExecutiveSession(
  repositoryPath: string,
  session: ExecutiveSessionRecord,
  options?: { archive?: boolean },
): Promise<void> {
  await ensureDirs(repositoryPath);
  const target = options?.archive
    ? archivePath(repositoryPath, session.sessionId)
    : sessionPath(repositoryPath, session.sessionId);
  await fs.writeFile(target, JSON.stringify(session, null, 2), 'utf8');
  if (options?.archive) {
    try {
      await fs.unlink(sessionPath(repositoryPath, session.sessionId));
    } catch {
      /* already moved */
    }
  }
}

export function createEmptyExecutiveSession(
  conversationId: string,
  title = 'Vigsy conversation',
): ExecutiveSessionRecord {
  const now = new Date().toISOString();
  return {
    sessionId: randomUUID(),
    conversationId,
    lifecycle: 'active',
    title,
    createdAt: now,
    updatedAt: now,
    currentDecisions: [],
    currentBlockers: [],
    currentAccomplishments: [],
    currentFiles: [],
    currentEvidence: [],
    currentRepositoryChanges: [],
    unfinishedWork: [],
  };
}

export async function upsertManifestSession(
  repositoryPath: string,
  session: ExecutiveSessionRecord,
  setActive = true,
): Promise<ExecutiveMemoryManifest> {
  const manifest = await loadExecutiveMemoryManifest(repositoryPath);
  manifest.repositoryPath = repositoryPath;
  manifest.lastSyncedAt = new Date().toISOString();
  if (setActive) manifest.activeSessionId = session.sessionId;

  const idx = manifest.sessions.findIndex((item) => item.sessionId === session.sessionId);
  const entry = {
    sessionId: session.sessionId,
    conversationId: session.conversationId,
    lifecycle: session.lifecycle,
    updatedAt: session.updatedAt,
  };
  if (idx >= 0) manifest.sessions[idx] = entry;
  else manifest.sessions.push(entry);

  await saveExecutiveMemoryManifest(repositoryPath, manifest);
  return manifest;
}
