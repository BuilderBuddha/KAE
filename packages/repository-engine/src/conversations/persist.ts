import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type {
  VigsyActiveConversationState,
  VigsyConversationRecord,
  VigsyConversationTurnRecord,
} from '@scooper/core';

export const CONVERSATIONS_DIR = 'conversations';
export const ACTIVE_CONVERSATION_FILE = 'active.json';

export function conversationsRoot(repositoryPath: string): string {
  return path.join(repositoryPath, '.kae-sessions', CONVERSATIONS_DIR);
}

function conversationFilePath(repositoryPath: string, conversationId: string): string {
  return path.join(conversationsRoot(repositoryPath), `${conversationId}.json`);
}

function activeStatePath(repositoryPath: string): string {
  return path.join(conversationsRoot(repositoryPath), ACTIVE_CONVERSATION_FILE);
}

async function ensureConversationsDir(repositoryPath: string): Promise<string> {
  const dir = conversationsRoot(repositoryPath);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

function titleFromQuestion(question: string): string {
  const trimmed = question.trim();
  if (!trimmed) return 'Vigsy conversation';
  return trimmed.length > 72 ? `${trimmed.slice(0, 69)}…` : trimmed;
}

export async function loadActiveConversationState(
  repositoryPath: string,
): Promise<VigsyActiveConversationState | null> {
  try {
    const raw = await fs.readFile(activeStatePath(repositoryPath), 'utf8');
    const parsed = JSON.parse(raw) as VigsyActiveConversationState;
    if (!parsed.conversationId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function loadVigsyConversation(
  repositoryPath: string,
  conversationId: string,
): Promise<VigsyConversationRecord | null> {
  try {
    const raw = await fs.readFile(conversationFilePath(repositoryPath, conversationId), 'utf8');
    const parsed = JSON.parse(raw) as VigsyConversationRecord;
    if (!parsed.conversationId || !Array.isArray(parsed.turns)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Loads the active persisted Vigsy conversation, if any. */
export async function loadActiveVigsyConversation(
  repositoryPath: string,
): Promise<VigsyConversationRecord | null> {
  const active = await loadActiveConversationState(repositoryPath);
  if (!active) return null;
  return loadVigsyConversation(repositoryPath, active.conversationId);
}

export async function saveVigsyConversation(
  repositoryPath: string,
  record: VigsyConversationRecord,
): Promise<string> {
  await ensureConversationsDir(repositoryPath);
  const filePath = conversationFilePath(repositoryPath, record.conversationId);
  await fs.writeFile(filePath, JSON.stringify(record, null, 2), 'utf8');
  const active: VigsyActiveConversationState = {
    conversationId: record.conversationId,
    updatedAt: record.updatedAt,
  };
  await fs.writeFile(activeStatePath(repositoryPath), JSON.stringify(active, null, 2), 'utf8');
  return filePath;
}

export function createEmptyVigsyConversation(title?: string): VigsyConversationRecord {
  const now = new Date().toISOString();
  return {
    conversationId: randomUUID(),
    title: title ?? 'Vigsy conversation',
    createdAt: now,
    updatedAt: now,
    turns: [],
  };
}

/** Creates a new empty conversation and marks it active. */
export async function createNewVigsyConversation(
  repositoryPath: string,
): Promise<VigsyConversationRecord> {
  const record = createEmptyVigsyConversation();
  await saveVigsyConversation(repositoryPath, record);
  return record;
}

/** Deletes the active conversation file and clears active state. */
export async function deleteVigsyConversation(
  repositoryPath: string,
  conversationId: string,
): Promise<void> {
  try {
    await fs.unlink(conversationFilePath(repositoryPath, conversationId));
  } catch {
    /* already removed */
  }
  const active = await loadActiveConversationState(repositoryPath);
  if (active?.conversationId === conversationId) {
    try {
      await fs.unlink(activeStatePath(repositoryPath));
    } catch {
      /* ignore */
    }
  }
}

export function buildConversationRecord(
  existing: VigsyConversationRecord | null,
  turns: VigsyConversationTurnRecord[],
): VigsyConversationRecord {
  const now = new Date().toISOString();
  const firstUser = turns.find((turn) => turn.role === 'user' && turn.question);
  const base = existing ?? createEmptyVigsyConversation();
  return {
    ...base,
    title: base.title === 'Vigsy conversation' && firstUser?.question
      ? titleFromQuestion(firstUser.question)
      : base.title,
    updatedAt: now,
    turns,
  };
}
