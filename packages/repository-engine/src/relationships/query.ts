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
    fromId: relationship.fromId,
    toId: relationship.toId,
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
  return collectRelatedEvidenceHits(evidenceIndex, relationshipIndex, [anchor], query ?? '', limit);
}

/**
 * Synchronous related-evidence resolution against already-loaded indexes.
 * Checkpoint F0a — used during assemble/retrieve so relationships influence evidence selection.
 */
export function collectRelatedEvidenceHits(
  evidenceIndex: EvidenceIndex,
  relationshipIndex: KnowledgeRelationshipIndex,
  anchors: string[],
  query = '',
  limit = 20,
  allowedRelationshipTypes?: readonly string[],
): RelatedEvidenceHit[] {
  const hits: RelatedEvidenceHit[] = [];
  const seen = new Set<string>();
  const cleanedAnchors = anchors.map((a) => a.trim()).filter(Boolean);
  const typeAllowed = (type: string) =>
    !allowedRelationshipTypes || allowedRelationshipTypes.length === 0
      ? true
      : allowedRelationshipTypes.includes(type);

  const filterRels = (relationships: KnowledgeRelationship[]) =>
    relationships.filter((rel) => typeAllowed(rel.relationshipType));

  const pushFromRelationships = (relationships: KnowledgeRelationship[], preferredAnchor?: string) => {
    for (const rel of filterRels(relationships).sort((a, b) => b.confidence - a.confidence)) {
      const candidates = [rel.fromId, rel.toId, ...rel.supportingEvidenceIds];
      const ordered = preferredAnchor
        ? [
            ...candidates.filter((id) => id !== preferredAnchor),
            ...candidates.filter((id) => id === preferredAnchor),
          ]
        : candidates;
      for (const id of ordered) {
        if (preferredAnchor && id === preferredAnchor) continue;
        const record = resolveRecord(evidenceIndex, id);
        if (!record || seen.has(record.id)) continue;
        seen.add(record.id);
        hits.push(recordToHit(record, rel));
        if (hits.length >= limit) return true;
      }
    }
    return false;
  };

  for (const anchor of cleanedAnchors) {
    let relationships = getRelationshipsForEvidence(relationshipIndex, anchor);
    if (relationships.length === 0 && query) {
      relationships = searchRelationships(relationshipIndex, query, limit * 3);
    }
    if (relationships.length === 0) {
      relationships = searchRelationships(relationshipIndex, anchor, limit * 3);
    }
    if (pushFromRelationships(relationships, anchor)) return hits;
  }

  if (hits.length === 0 && query.trim()) {
    const relationships = searchRelationships(relationshipIndex, query, limit * 3);
    pushFromRelationships(relationships);
  }

  return hits;
}

function endpointNodeIds(endpoint: string): string[] {
  const id = endpoint.trim();
  if (!id) return [];
  const upper = id.toUpperCase();
  if (/^KRC-\d{4}$/i.test(id)) {
    return [upper, `${upper}:source`, `${upper}:conversation`, id, `${id}:source`, `${id}:conversation`];
  }
  return [id, upper];
}

function relationshipTouchesEndpoint(rel: KnowledgeRelationship, endpointNodes: Set<string>): boolean {
  return (
    endpointNodes.has(rel.fromId) ||
    endpointNodes.has(rel.toId) ||
    rel.supportingEvidenceIds.some((sid) => endpointNodes.has(sid))
  );
}

function isSelfEdge(rel: KnowledgeRelationship): boolean {
  return rel.fromId === rel.toId;
}

/**
 * Bounded named-pair path over the existing relationship index (direct edge or ≤1 hop).
 * Not a general graph engine — depth capped at 2 edges.
 */
export function collectNamedPairRelationshipHits(
  evidenceIndex: EvidenceIndex,
  relationshipIndex: KnowledgeRelationshipIndex,
  endpointA: string,
  endpointB: string,
  allowedRelationshipTypes?: readonly string[],
  maxDepth = 2,
): RelatedEvidenceHit[] {
  const nodesA = new Set(endpointNodeIds(endpointA));
  const nodesB = new Set(endpointNodeIds(endpointB));
  if (nodesA.size === 0 || nodesB.size === 0) return [];

  const typeAllowed = (type: string) =>
    !allowedRelationshipTypes || allowedRelationshipTypes.length === 0
      ? true
      : allowedRelationshipTypes.includes(type);

  const edges = relationshipIndex.relationships.filter(
    (rel) => typeAllowed(rel.relationshipType) && !isSelfEdge(rel),
  );

  // Direct edge between the named endpoints.
  const direct = edges
    .filter((rel) => relationshipTouchesEndpoint(rel, nodesA) && relationshipTouchesEndpoint(rel, nodesB))
    .sort((a, b) => b.confidence - a.confidence);

  const pathRels: KnowledgeRelationship[] = [];
  if (direct.length > 0) {
    pathRels.push(direct[0]);
  } else if (maxDepth >= 2) {
    // One intermediate hop: A—X—B
    const fromA = edges.filter((rel) => relationshipTouchesEndpoint(rel, nodesA));
    let found: KnowledgeRelationship[] | null = null;
    for (const edgeA of fromA.sort((a, b) => b.confidence - a.confidence)) {
      const midIds = [edgeA.fromId, edgeA.toId, ...edgeA.supportingEvidenceIds].filter(
        (id) => !nodesA.has(id) && !nodesB.has(id),
      );
      for (const mid of midIds) {
        const midNodes = new Set(endpointNodeIds(mid));
        const edgeB = edges
          .filter(
            (rel) =>
              rel.relationshipId !== edgeA.relationshipId &&
              relationshipTouchesEndpoint(rel, midNodes) &&
              relationshipTouchesEndpoint(rel, nodesB),
          )
          .sort((a, b) => b.confidence - a.confidence)[0];
        if (edgeB) {
          found = [edgeA, edgeB];
          break;
        }
      }
      if (found) break;
    }
    if (found) pathRels.push(...found);
  }

  const hits: RelatedEvidenceHit[] = [];
  const seen = new Set<string>();
  for (const rel of pathRels) {
    const peerIds = [rel.fromId, rel.toId].filter((id) => !nodesA.has(id) || nodesB.has(id));
    // Prefer the non-A endpoint for display; include both path peers once.
    for (const id of peerIds) {
      const record = resolveRecord(evidenceIndex, id);
      if (!record || seen.has(`${rel.relationshipId}:${record.id}`)) continue;
      seen.add(`${rel.relationshipId}:${record.id}`);
      hits.push(recordToHit(record, rel));
    }
  }
  return hits;
}

/** Governed campaign/project edges only — never titles, capabilities, or source links. */
export function isGovernedCampaignRelationshipType(type: string): boolean {
  return type === 'campaign_campaign';
}

/** Governed topic edges only — must be labeled as topics, never projects. */
export function isGovernedTopicRelationshipType(type: string): boolean {
  return type === 'topic_topic';
}

/**
 * @deprecated Prefer isGovernedCampaignRelationshipType / isGovernedTopicRelationshipType.
 * Kept for callers that need either campaign or topic (not capabilities/sources).
 */
export function isProjectTopicRelationshipType(type: string): boolean {
  return isGovernedCampaignRelationshipType(type) || isGovernedTopicRelationshipType(type);
}

/** Human-readable governed record type from an evidence kind. */
export function governedRecordTypeLabel(kind: string): string {
  switch (kind) {
    case 'source':
      return 'source';
    case 'conversation':
      return 'conversation';
    case 'message':
      return 'message';
    case 'attachment':
      return 'attachment';
    case 'executive_session':
      return 'executive_session';
    default:
      return kind || 'record';
  }
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
