import fs from 'node:fs/promises';
import path from 'node:path';
import type { ExecutiveBriefing, ExecutiveBriefingCache } from '@scooper/core';
import { EVIDENCE_INDEX_DIR } from '../evidence/persist.js';
import { evidenceIndexPath } from '../evidence/persist.js';
import { loadEvidenceIndex } from '../evidence/persist.js';
import { relationshipIndexPath } from '../relationships/persist.js';
import { loadRelationshipIndex } from '../relationships/persist.js';

export const EXECUTIVE_BRIEFING_CACHE_FILE = 'executive-briefing-cache.json';
export const EXECUTIVE_BRIEFING_CACHE_VERSION = 1 as const;

export function executiveBriefingCachePath(repositoryPath: string): string {
  return path.join(repositoryPath, EVIDENCE_INDEX_DIR, EXECUTIVE_BRIEFING_CACHE_FILE);
}

export interface IndexFreshnessMarkers {
  evidenceIndexBuiltAt: string;
  evidenceIndexMtimeMs: number;
  relationshipIndexBuiltAt: string;
  relationshipIndexMtimeMs: number;
}

export async function captureIndexFreshnessMarkers(
  repositoryPath: string,
): Promise<IndexFreshnessMarkers> {
  const evidencePath = evidenceIndexPath(repositoryPath);
  const relationshipPath = relationshipIndexPath(repositoryPath);

  const [evidenceIndex, relationshipIndex] = await Promise.all([
    loadEvidenceIndex(repositoryPath),
    loadRelationshipIndex(repositoryPath),
  ]);

  let evidenceIndexMtimeMs = 0;
  let relationshipIndexMtimeMs = 0;

  try {
    evidenceIndexMtimeMs = (await fs.stat(evidencePath)).mtimeMs;
  } catch {
    /* index may not exist yet */
  }

  try {
    relationshipIndexMtimeMs = (await fs.stat(relationshipPath)).mtimeMs;
  } catch {
    /* index may not exist yet */
  }

  return {
    evidenceIndexBuiltAt: evidenceIndex?.builtAt ?? '',
    evidenceIndexMtimeMs,
    relationshipIndexBuiltAt: relationshipIndex?.builtAt ?? '',
    relationshipIndexMtimeMs,
  };
}

export async function loadExecutiveBriefingCache(
  repositoryPath: string,
): Promise<ExecutiveBriefingCache | null> {
  try {
    const raw = await fs.readFile(executiveBriefingCachePath(repositoryPath), 'utf8');
    const parsed = JSON.parse(raw) as ExecutiveBriefingCache;
    if (
      parsed.version !== EXECUTIVE_BRIEFING_CACHE_VERSION ||
      !parsed.briefing ||
      !Array.isArray(parsed.briefing.cards)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function saveExecutiveBriefingCache(
  repositoryPath: string,
  briefing: ExecutiveBriefing,
  markers?: IndexFreshnessMarkers,
): Promise<string> {
  const freshness = markers ?? (await captureIndexFreshnessMarkers(repositoryPath));
  const cache: ExecutiveBriefingCache = {
    version: EXECUTIVE_BRIEFING_CACHE_VERSION,
    repositoryPath,
    cachedAt: new Date().toISOString(),
    evidenceIndexBuiltAt: freshness.evidenceIndexBuiltAt,
    evidenceIndexMtimeMs: freshness.evidenceIndexMtimeMs,
    relationshipIndexBuiltAt: freshness.relationshipIndexBuiltAt,
    relationshipIndexMtimeMs: freshness.relationshipIndexMtimeMs,
    briefing,
  };

  const dir = path.join(repositoryPath, EVIDENCE_INDEX_DIR);
  await fs.mkdir(dir, { recursive: true });
  const filePath = executiveBriefingCachePath(repositoryPath);
  await fs.writeFile(filePath, JSON.stringify(cache, null, 2), 'utf8');
  return filePath;
}

/** Returns true when index files are newer than the cached markers. */
export async function isExecutiveBriefingCacheStale(
  repositoryPath: string,
  cache: ExecutiveBriefingCache,
): Promise<boolean> {
  try {
    const evidenceMtime = (await fs.stat(evidenceIndexPath(repositoryPath))).mtimeMs;
    if (evidenceMtime > cache.evidenceIndexMtimeMs) return true;
  } catch {
    return true;
  }

  try {
    const relationshipMtime = (await fs.stat(relationshipIndexPath(repositoryPath))).mtimeMs;
    if (relationshipMtime > cache.relationshipIndexMtimeMs) return true;
  } catch {
    return true;
  }

  return false;
}
