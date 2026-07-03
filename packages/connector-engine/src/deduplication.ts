import type { ParsedDocument } from '@scooper/core';
import { loadExistingConversationMap } from '@scooper/exporters';

export interface DeduplicationResult {
  documents: ParsedDocument[];
  skippedCount: number;
  updatedCount: number;
}

/** Detects existing sources and filters documents that are unchanged duplicates. */
export async function deduplicateDocuments(
  repositoryPath: string,
  documents: ParsedDocument[],
): Promise<DeduplicationResult> {
  const existing = await loadExistingConversationMap(repositoryPath);
  const kept: ParsedDocument[] = [];
  let skippedCount = 0;
  let updatedCount = 0;

  for (const doc of documents) {
    const sourceKey = String(doc.metadata.conversationId ?? doc.metadata.sourceKey ?? doc.id);
    const existingKrc = existing.get(sourceKey);
    if (existingKrc) {
      doc.metadata.existingKrcId = existingKrc;
      doc.metadata.conversationId = sourceKey;
      kept.push(doc);
      updatedCount += 1;
      continue;
    }
    doc.metadata.conversationId = sourceKey;
    kept.push(doc);
  }

  return { documents: kept, skippedCount, updatedCount };
}
