import fs from 'node:fs/promises';
import { DEFAULT_REPOSITORY_PATH } from '@scooper/core';
import {
  evidenceIndexPath,
  executiveBriefingCachePath,
  getExecutiveBriefing,
  isExecutiveBriefingCacheStale,
  loadExecutiveBriefingCache,
  refreshExecutiveBriefing,
} from '@scooper/repository-engine';

const repositoryPath = process.env.KAE_REPOSITORY_PATH ?? DEFAULT_REPOSITORY_PATH;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  console.log(`Repository: ${repositoryPath}`);

  const first = await getExecutiveBriefing(repositoryPath);
  assert(!first.fromCache || first.briefing.cards.length >= 6, 'first load produces briefing');

  const cachePath = executiveBriefingCachePath(repositoryPath);
  let cacheExists = false;
  try {
    await fs.access(cachePath);
    cacheExists = true;
  } catch {
    cacheExists = false;
  }
  assert(cacheExists, 'first build creates briefing cache');
  console.log('PASS first build creates cache');

  const start = Date.now();
  const cached = await getExecutiveBriefing(repositoryPath);
  const elapsedMs = Date.now() - start;
  assert(cached.fromCache, 'relaunch uses cache');
  assert(elapsedMs < 2000, `cached launch under 2 seconds (${elapsedMs}ms)`);
  console.log(`PASS cached launch under 2 seconds (${elapsedMs}ms)`);

  const refreshed = await refreshExecutiveBriefing(repositoryPath);
  assert(refreshed.cards.length >= 6, 'manual refresh rebuilds briefing');
  console.log('PASS manual refresh');

  const cache = await loadExecutiveBriefingCache(repositoryPath);
  assert(cache, 'cache exists after refresh');
  const beforeStale = await isExecutiveBriefingCacheStale(repositoryPath, cache);
  assert(!beforeStale, 'cache fresh after refresh');

  const evidencePath = evidenceIndexPath(repositoryPath);
  const stat = await fs.stat(evidencePath);
  await fs.utimes(evidencePath, stat.atime, new Date());

  const afterTouch = await isExecutiveBriefingCacheStale(repositoryPath, cache);
  assert(afterTouch, 'stale evidence index triggers refresh');
  console.log('PASS staleness detection');

  const staleLoad = await getExecutiveBriefing(repositoryPath);
  assert(staleLoad.stale, 'getExecutiveBriefing reports stale cache');
  const rebuilt = await refreshExecutiveBriefing(repositoryPath);
  assert(rebuilt.cards.length >= 6, 'stale refresh rebuilds');
  console.log('PASS stale refresh');

  const cardsWithLinks = rebuilt.cards.filter((card) => card.evidenceLinks.length > 0);
  assert(cardsWithLinks.length >= 5, 'evidence links still work');
  console.log(`PASS evidence links — ${cardsWithLinks.length}/${rebuilt.cards.length} cards`);

  console.log('\nAll executive awareness performance tests passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
