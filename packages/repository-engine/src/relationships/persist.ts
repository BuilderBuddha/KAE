import fs from 'node:fs/promises';
import path from 'node:path';
import type { KnowledgeRelationshipIndex } from '@scooper/core';
import { EVIDENCE_INDEX_DIR } from '../evidence/persist.js';

export const RELATIONSHIP_INDEX_FILE = 'relationship-index.json';
export const RELATIONSHIP_INDEX_VERSION = 1 as const;

export function relationshipIndexPath(repositoryPath: string): string {
  return path.join(repositoryPath, EVIDENCE_INDEX_DIR, RELATIONSHIP_INDEX_FILE);
}

export async function loadRelationshipIndex(
  repositoryPath: string,
): Promise<KnowledgeRelationshipIndex | null> {
  try {
    const raw = await fs.readFile(relationshipIndexPath(repositoryPath), 'utf8');
    const parsed = JSON.parse(raw) as KnowledgeRelationshipIndex;
    if (parsed.version !== RELATIONSHIP_INDEX_VERSION || !Array.isArray(parsed.relationships)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function saveRelationshipIndex(
  repositoryPath: string,
  index: KnowledgeRelationshipIndex,
): Promise<string> {
  const dir = path.join(repositoryPath, EVIDENCE_INDEX_DIR);
  await fs.mkdir(dir, { recursive: true });
  const filePath = relationshipIndexPath(repositoryPath);
  await fs.writeFile(filePath, JSON.stringify(index, null, 2), 'utf8');
  return filePath;
}
