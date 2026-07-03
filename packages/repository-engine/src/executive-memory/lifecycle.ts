import type { ExecutiveSessionRecord, VigsyConversationRecord } from '@scooper/core';
import {
  createEmptyExecutiveSession,
  loadActiveExecutiveSession,
  loadExecutiveMemoryManifest,
  loadExecutiveSessionByConversation,
  saveExecutiveMemoryManifest,
  saveExecutiveSession,
  upsertManifestSession,
} from './persist.js';

/** Ensures an executive session exists for a new or resumed conversation. */
export async function ensureExecutiveSessionForConversation(
  repositoryPath: string,
  record: VigsyConversationRecord,
): Promise<ExecutiveSessionRecord> {
  const existing = await loadExecutiveSessionByConversation(repositoryPath, record.conversationId);
  if (existing) {
    if (existing.lifecycle === 'paused' || existing.lifecycle === 'closed') {
      existing.lifecycle = 'active';
      existing.updatedAt = new Date().toISOString();
      await saveExecutiveSession(repositoryPath, existing);
      await upsertManifestSession(repositoryPath, existing);
    }
    return existing;
  }

  const session = createEmptyExecutiveSession(record.conversationId, record.title);
  await saveExecutiveSession(repositoryPath, session);
  await upsertManifestSession(repositoryPath, session);
  return session;
}

/** Pauses the currently active executive session when starting a new conversation. */
export async function pauseActiveExecutiveSession(repositoryPath: string): Promise<void> {
  const active = await loadActiveExecutiveSession(repositoryPath);
  if (!active || active.lifecycle !== 'active') return;
  active.lifecycle = 'paused';
  active.pausedAt = new Date().toISOString();
  active.updatedAt = active.pausedAt;
  await saveExecutiveSession(repositoryPath, active);
  await upsertManifestSession(repositoryPath, active, false);
}

/** Archives executive memory when a conversation is deleted. */
export async function archiveExecutiveSessionForConversation(
  repositoryPath: string,
  conversationId: string,
): Promise<void> {
  const session = await loadExecutiveSessionByConversation(repositoryPath, conversationId);
  if (!session) return;
  session.lifecycle = 'archived';
  session.archivedAt = new Date().toISOString();
  session.updatedAt = session.archivedAt;
  await saveExecutiveSession(repositoryPath, session, { archive: true });

  const manifest = await loadExecutiveMemoryManifest(repositoryPath);
  manifest.sessions = manifest.sessions.map((item) =>
    item.conversationId === conversationId
      ? { ...item, lifecycle: 'archived', updatedAt: session.updatedAt }
      : item,
  );
  if (manifest.activeSessionId === session.sessionId) {
    manifest.activeSessionId = undefined;
  }
  manifest.lastSyncedAt = session.updatedAt;
  await saveExecutiveMemoryManifest(repositoryPath, manifest);
}

/** Marks the active session closed when the conversation is cleared without delete. */
export async function closeExecutiveSessionForConversation(
  repositoryPath: string,
  conversationId: string,
): Promise<void> {
  const session = await loadExecutiveSessionByConversation(repositoryPath, conversationId);
  if (!session) return;
  session.lifecycle = 'closed';
  session.closedAt = new Date().toISOString();
  session.updatedAt = session.closedAt;
  await saveExecutiveSession(repositoryPath, session);
  await upsertManifestSession(repositoryPath, session, false);
}
