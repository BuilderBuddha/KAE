import fs from 'node:fs/promises';
import path from 'node:path';
import type { EvidenceIndex } from '@scooper/core';

export const EVIDENCE_INDEX_DIR = '.kae-index';
export const EVIDENCE_INDEX_FILE = 'evidence-index.json';
export const EVIDENCE_INDEX_VERSION = 1 as const;

export function evidenceIndexPath(repositoryPath: string): string {
  return path.join(repositoryPath, EVIDENCE_INDEX_DIR, EVIDENCE_INDEX_FILE);
}

/** Loads a persisted evidence index when present. */
export async function loadEvidenceIndex(repositoryPath: string): Promise<EvidenceIndex | null> {
  const indexPath = evidenceIndexPath(repositoryPath);
  try {
    const raw = await fs.readFile(indexPath, 'utf8');
    const parsed = JSON.parse(raw) as EvidenceIndex;
    if (parsed.version !== EVIDENCE_INDEX_VERSION || !Array.isArray(parsed.records)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** Persists the evidence index under `.kae-index/`. */
export async function saveEvidenceIndex(repositoryPath: string, index: EvidenceIndex): Promise<string> {
  const dir = path.join(repositoryPath, EVIDENCE_INDEX_DIR);
  await fs.mkdir(dir, { recursive: true });
  const indexPath = evidenceIndexPath(repositoryPath);
  await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf8');
  return indexPath;
}
