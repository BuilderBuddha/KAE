import type { ExecutiveBriefing, ExecutiveBriefingLoadResult } from '@scooper/core';
import { buildExecutiveBriefing } from './build.js';
import {
  isExecutiveBriefingCacheStale,
  loadExecutiveBriefingCache,
  saveExecutiveBriefingCache,
} from './persist.js';

/** Loads briefing from cache when available; rebuilds when missing. */
export async function getExecutiveBriefing(
  repositoryPath: string,
): Promise<ExecutiveBriefingLoadResult> {
  const cache = await loadExecutiveBriefingCache(repositoryPath);

  if (!cache || cache.repositoryPath !== repositoryPath) {
    const briefing = await buildExecutiveBriefing(repositoryPath);
    await saveExecutiveBriefingCache(repositoryPath, briefing);
    return { briefing, fromCache: false, stale: false };
  }

  const stale = await isExecutiveBriefingCacheStale(repositoryPath, cache);
  return { briefing: cache.briefing, fromCache: true, stale };
}

/** Forces a briefing rebuild and updates the cache. */
export async function refreshExecutiveBriefing(repositoryPath: string): Promise<ExecutiveBriefing> {
  const briefing = await buildExecutiveBriefing(repositoryPath);
  await saveExecutiveBriefingCache(repositoryPath, briefing);
  return briefing;
}
