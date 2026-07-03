import type {
  EvidenceIndex,
  EvidenceRecord,
  KnowledgeRelationship,
  KnowledgeRelationshipIndex,
  RelatedEvidenceHit,
} from '@scooper/core';
import { tokenizeQuery } from '../evidence/tokenize.js';
import { buildRelationshipsFromEvidence } from './build.js';
import { ensureEvidenceIndex } from '../evidence/search.js';
import { loadRelationshipIndex, saveRelationshipIndex } from './persist.js';

function recordLabel(record: EvidenceRecord): string {
  if (record.kind === 'attachment' && record.attachment) return record.attachment.filename;
  return record.conversation?.title ?? record.repository.krcId ?? record.id;
}

function recordToHit(record: EvidenceRecord, relationship: KnowledgeRelationship): RelatedEvidenceHit {
  return {
    recordId: record.id,
    label: recordLabel(record),
    excerpt: record.excerpt,
    explorerPath: record.repository.repositoryPath,
    krcId: record.repository.krcId,
    kind: record.kind,
    relationshipType: relationship.relationshipType,
    reason: relationship.reason,
    confidence: relationship.confidence,
  };
}

function resolveRecord(index: EvidenceIndex, id: string): EvidenceRecord | undefined {
  return (
    index.records.find((r) => r.id === id) ??
    index.records.find((r) => r.repository.krcId === id) ??
    index.records.find((r) => r.id.startsWith(`${id}:`))
  );
}

/** Builds and persists the relationship index from evidence. */
export async function buildRelationshipIndex(repositoryPath: string): Promise<KnowledgeRelationshipIndex> {
  const evidenceIndex = await ensureEvidenceIndex(repositoryPath);
  const relationships = buildRelationshipsFromEvidence(evidenceIndex);
  const builtAt = new Date().toISOString();
  const index: KnowledgeRelationshipIndex = {
    version: 1,
    repositoryPath,
    builtAt,
    relationshipCount: relationships.length,
    relationships,
  };
  await saveRelationshipIndex(repositoryPath, index);
  return index;
}

export async function ensureRelationshipIndex(
  repositoryPath: string,
): Promise<KnowledgeRelationshipIndex> {
  const existing = await loadRelationshipIndex(repositoryPath);
  if (existing && existing.repositoryPath === repositoryPath) {
    return existing;
  }
  return buildRelationshipIndex(repositoryPath);
}

export function summarizeRelationshipIndex(
  index: KnowledgeRelationshipIndex,
): import('@scooper/core').KnowledgeRelationshipStats {
  const byType: Record<string, number> = {};
  for (const rel of index.relationships) {
    byType[rel.relationshipType] = (byType[rel.relationshipType] ?? 0) + 1;
  }
  return {
    builtAt: index.builtAt,
    relationshipCount: index.relationshipCount,
    byType,
  };
}

/** Searches relationships by query tokens, type, or reason text. */
export function searchRelationships(
  index: KnowledgeRelationshipIndex,
  query: string,
  limit = 50,
): KnowledgeRelationship[] {
  const tokens = tokenizeQuery(query);
  const q = query.toLowerCase();
  const scored: Array<{ rel: KnowledgeRelationship; score: number }> = [];

  for (const rel of index.relationships) {
    const hay = `${rel.fromId} ${rel.toId} ${rel.relationshipType} ${rel.reason}`.toLowerCase();
    let score = 0;
    if (hay.includes(q)) score += 20;
    score += tokens.filter((t) => hay.includes(t)).length * 8;
    if (score > 0) scored.push({ rel, score });
  }

  return scored
    .sort((a, b) => b.score - a.score || b.rel.confidence - a.rel.confidence)
    .slice(0, limit)
    .map((entry) => entry.rel);
}

/** Returns relationships touching an evidence record or KRC id. */
export function getRelationshipsForEvidence(
  relationshipIndex: KnowledgeRelationshipIndex,
  evidenceId: string,
): KnowledgeRelationship[] {
  const normalized = evidenceId.toLowerCase();
  return relationshipIndex.relationships.filter((rel) => {
    if (rel.fromId === evidenceId || rel.toId === evidenceId) return true;
    if (rel.supportingEvidenceIds.includes(evidenceId)) return true;
    if (normalized.startsWith('krc-')) {
      const matchesKrc = (id: string) => id.toLowerCase().startsWith(normalized);
      if (matchesKrc(rel.fromId) || matchesKrc(rel.toId)) return true;
      if (rel.supportingEvidenceIds.some(matchesKrc)) return true;
    }
    return rel.reason.toLowerCase().includes(normalized);
  });
}

/** Resolves related evidence records for an anchor id or search query. */
export async function getRelatedEvidence(
  repositoryPath: string,
  anchor: string,
  query?: string,
  limit = 20,
): Promise<RelatedEvidenceHit[]> {
  const [evidenceIndex, relationshipIndex] = await Promise.all([
    ensureEvidenceIndex(repositoryPath),
    ensureRelationshipIndex(repositoryPath),
  ]);

  let relationships = getRelationshipsForEvidence(relationshipIndex, anchor);
  if (relationships.length === 0 && query) {
    relationships = searchRelationships(relationshipIndex, query, limit * 3);
  }
  if (relationships.length === 0) {
    relationships = searchRelationships(relationshipIndex, anchor, limit * 3);
  }

  const hits: RelatedEvidenceHit[] = [];
  const seen = new Set<string>();

  for (const rel of relationships.sort((a, b) => b.confidence - a.confidence)) {
    const peerId = rel.fromId === anchor || rel.supportingEvidenceIds[0] === anchor ? rel.toId : rel.fromId;
    const record = resolveRecord(evidenceIndex, peerId);
    if (!record || seen.has(record.id)) continue;
    seen.add(record.id);
    hits.push(recordToHit(record, rel));
    if (hits.length >= limit) break;
  }

  return hits;
}

export function groupRelatedEvidence(hits: RelatedEvidenceHit[]): {
  relatedDecisions: RelatedEvidenceHit[];
  relatedConversations: RelatedEvidenceHit[];
  relatedCampaigns: RelatedEvidenceHit[];
  relatedAttachments: RelatedEvidenceHit[];
  relatedExecutiveSessions: RelatedEvidenceHit[];
} {
  const relatedDecisions: RelatedEvidenceHit[] = [];
  const relatedConversations: RelatedEvidenceHit[] = [];
  const relatedCampaigns: RelatedEvidenceHit[] = [];
  const relatedAttachments: RelatedEvidenceHit[] = [];
  const relatedExecutiveSessions: RelatedEvidenceHit[] = [];

  for (const hit of hits) {
    if (hit.relationshipType === 'decision_decision') relatedDecisions.push(hit);
    if (
      hit.relationshipType === 'conversation_conversation' ||
      hit.relationshipType === 'conversation_source' ||
      hit.kind === 'conversation' ||
      hit.kind === 'source'
    ) {
      relatedConversations.push(hit);
    }
    if (hit.relationshipType === 'campaign_campaign') relatedCampaigns.push(hit);
    if (
      hit.relationshipType === 'attachment_source' ||
      hit.relationshipType === 'attachment_conversation' ||
      hit.relationshipType === 'conversation_attachment' ||
      hit.kind === 'attachment'
    ) {
      relatedAttachments.push(hit);
    }
    if (
      hit.relationshipType === 'conversation_executive_session' ||
      hit.relationshipType === 'executive_session_executive_session' ||
      hit.relationshipType === 'executive_session_source' ||
      hit.kind === 'executive_session'
    ) {
      relatedExecutiveSessions.push(hit);
    }
  }

  return {
    relatedDecisions,
    relatedConversations,
    relatedCampaigns,
    relatedAttachments,
    relatedExecutiveSessions,
  };
}
