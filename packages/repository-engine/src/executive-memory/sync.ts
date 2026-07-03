import type {
  ExecutiveMemorySyncResult,
  ExecutiveSessionRecord,
  VigsyConversationRecord,
} from '@scooper/core';
import { buildEvidenceIndex } from '../evidence/build.js';
import { buildRelationshipIndex } from '../relationships/query.js';
import { refreshExecutiveBriefing } from '../awareness/query.js';
import { extractExecutiveMemory } from './extract.js';
import {
  createEmptyExecutiveSession,
  loadExecutiveMemoryManifest,
  loadExecutiveSessionByConversation,
  loadExecutiveSessionById,
  saveExecutiveSession,
  upsertManifestSession,
} from './persist.js';
import { writeVigsyExecutiveSessionMarkdown } from './session-markdown.js';
import { buildExecutiveContinuity } from './welcome.js';

export { buildExecutiveContinuity };

/** Syncs executive memory from a conversation and refreshes indexes + awareness. */
export async function syncExecutiveMemoryFromConversation(
  repositoryPath: string,
  record: VigsyConversationRecord,
): Promise<ExecutiveMemorySyncResult> {
  const base =
    (await loadExecutiveSessionByConversation(repositoryPath, record.conversationId)) ??
    createEmptyExecutiveSession(record.conversationId, record.title);

  const session = extractExecutiveMemory(record, {
    ...base,
    lifecycle: record.turns.length > 0 ? 'active' : base.lifecycle,
  });

  session.executiveSessionPath = await writeVigsyExecutiveSessionMarkdown(
    repositoryPath,
    session,
    record,
  );
  await saveExecutiveSession(repositoryPath, session);
  await upsertManifestSession(repositoryPath, session);

  const evidenceIndex = await buildEvidenceIndex(repositoryPath);
  const relationshipIndex = await buildRelationshipIndex(repositoryPath);
  const briefing = await refreshExecutiveBriefing(repositoryPath);

  return {
    session,
    evidenceIndexBuiltAt: evidenceIndex.builtAt,
    relationshipIndexBuiltAt: relationshipIndex.builtAt,
    briefingGeneratedAt: briefing.generatedAt,
  };
}

/** Loads continuity context for the active or most recent session. */
export async function getExecutiveContinuity(repositoryPath: string) {
  const manifest = await loadExecutiveMemoryManifest(repositoryPath);
  let session: ExecutiveSessionRecord | null = null;

  if (manifest.activeSessionId) {
    session = await loadExecutiveSessionById(repositoryPath, manifest.activeSessionId);
  }

  return buildExecutiveContinuity(session, manifest.founderName);
}
