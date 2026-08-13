import type { VigsyKnowledgeAnswer, VigsyRelationshipInsights } from '@scooper/core';
import {
  ensureRelationshipIndex,
  getRelatedEvidence,
  groupRelatedEvidence,
} from './query.js';

/** Enriches a grounded Vigsy answer with relationship-derived related evidence. */
export async function enrichAnswerWithRelationships(
  repositoryPath: string,
  answer: VigsyKnowledgeAnswer,
): Promise<VigsyKnowledgeAnswer> {
  await ensureRelationshipIndex(repositoryPath);

  const anchorIds = [
    ...answer.evidenceUsed.map((item) => item.recordId),
    ...answer.explorerLinks.map((link) => link.krcId).filter(Boolean),
  ] as string[];

  const uniqueAnchors = [...new Set(anchorIds)].slice(0, 5);
  const allHits = [];

  for (const anchor of uniqueAnchors) {
    const hits = await getRelatedEvidence(repositoryPath, anchor, answer.searchQuery, 12);
    allHits.push(...hits);
  }

  const deduped = new Map<string, (typeof allHits)[number]>();
  for (const hit of allHits) {
    const existing = deduped.get(hit.recordId);
    if (!existing || hit.confidence > existing.confidence) {
      deduped.set(hit.recordId, hit);
    }
  }

  const grouped = groupRelatedEvidence([...deduped.values()]);
  const relationshipInsights: VigsyRelationshipInsights = {
    relatedDecisions: grouped.relatedDecisions.slice(0, 6),
    relatedConversations: grouped.relatedConversations.slice(0, 6),
    relatedCampaigns: grouped.relatedCampaigns.slice(0, 6),
    relatedAttachments: grouped.relatedAttachments.slice(0, 6),
    relatedExecutiveSessions: grouped.relatedExecutiveSessions.slice(0, 6),
  };

  // Avoid duplicate presentation when F0a already used relationship context during retrieval.
  const alreadyPresented = new Set<string>([
    ...answer.evidenceUsed.map((item) => item.recordId),
    ...answer.relatedSources.map((item) => item.recordId),
    ...(answer.relatedProjectTopics ?? []).map((item) => item.recordId),
  ]);

  const mergedRelated = [...answer.relatedSources];
  const seen = new Set(mergedRelated.map((item) => item.recordId));
  for (const hit of grouped.relatedConversations.slice(0, 4)) {
    if (seen.has(hit.recordId) || alreadyPresented.has(hit.recordId)) continue;
    seen.add(hit.recordId);
    mergedRelated.push({
      recordId: hit.recordId,
      label: hit.label,
      excerpt: hit.excerpt,
      explorerPath: hit.explorerPath,
      krcId: hit.krcId,
      kind: hit.kind as VigsyKnowledgeAnswer['evidenceUsed'][number]['kind'],
    });
  }

  return {
    ...answer,
    relatedSources: mergedRelated,
    relationshipInsights,
  };
}
