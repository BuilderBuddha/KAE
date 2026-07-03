import {
  buildEvidenceIndex,
  buildRelationshipIndex,
  refreshExecutiveBriefing,
} from '@scooper/repository-engine';

export interface AwarenessRefreshResult {
  evidenceIndexBuiltAt: string;
  relationshipIndexBuiltAt: string;
  briefingGeneratedAt: string;
}

/** Rebuilds evidence, relationships, and executive awareness after connector sync. */
export async function refreshRepositoryAwareness(
  repositoryPath: string,
): Promise<AwarenessRefreshResult> {
  const evidenceIndex = await buildEvidenceIndex(repositoryPath);
  const relationshipIndex = await buildRelationshipIndex(repositoryPath);
  const briefing = await refreshExecutiveBriefing(repositoryPath);
  return {
    evidenceIndexBuiltAt: evidenceIndex.builtAt,
    relationshipIndexBuiltAt: relationshipIndex.builtAt,
    briefingGeneratedAt: briefing.generatedAt,
  };
}
