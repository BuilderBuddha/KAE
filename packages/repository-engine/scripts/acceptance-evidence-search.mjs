import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_REPOSITORY_PATH } from '@scooper/core';
import {
  buildEvidenceIndex,
  evidenceResultsToRepositoryResults,
  searchEvidence,
  summarizeEvidenceIndex,
} from '@scooper/repository-engine';

const repositoryPath = process.env.KAE_REPOSITORY_PATH ?? DEFAULT_REPOSITORY_PATH;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function hasMatch(results, predicate, label) {
  const hit = results.find(predicate);
  assert(hit, `Expected match for: ${label}`);
  return hit;
}

async function main() {
  console.log(`Repository: ${repositoryPath}`);

  const index = await buildEvidenceIndex(repositoryPath);
  const stats = summarizeEvidenceIndex(index);
  console.log('Index built:', stats);

  assert(stats.recordCount > 0, 'Index should contain records');
  assert(stats.messages > 0, 'Index should contain message records');
  assert(stats.executiveSessions > 0, 'Index should contain executive session records');

  const keywordHits = evidenceResultsToRepositoryResults(
    await searchEvidence(repositoryPath, 'repository', 20),
  );
  hasMatch(
    keywordHits,
    (r) => r.matchFields?.includes('keyword') || r.matchFields?.includes('message'),
    'keyword search',
  );
  console.log('PASS keyword search');

  const promptHits = evidenceResultsToRepositoryResults(
    await searchEvidence(repositoryPath, 'import', 20),
  );
  hasMatch(
    promptHits,
    (r) => r.matchFields?.includes('prompt') || r.matchFields?.includes('message'),
    'prompt text search',
  );
  console.log('PASS prompt text search');

  const responseHits = evidenceResultsToRepositoryResults(
    await searchEvidence(repositoryPath, 'ChatGPT', 20),
  );
  hasMatch(
    responseHits,
    (r) =>
      r.matchFields?.includes('response') ||
      r.matchFields?.includes('message') ||
      r.matchFields?.includes('keyword'),
    'ChatGPT response search',
  );
  console.log('PASS ChatGPT response search');

  const filenameHits = evidenceResultsToRepositoryResults(
    await searchEvidence(repositoryPath, 'Screenshot', 20),
  );
  if (filenameHits.length > 0) {
    hasMatch(
      filenameHits,
      (r) => r.matchFields?.includes('filename') || r.matchFields?.includes('attachment'),
      'filename search',
    );
    console.log('PASS filename search');
  } else {
    console.log('SKIP filename search (no Screenshot attachments in index)');
  }

  const krcHits = evidenceResultsToRepositoryResults(
    await searchEvidence(repositoryPath, 'KRC-0122', 10),
  );
  hasMatch(krcHits, (r) => r.krcId?.toUpperCase() === 'KRC-0122', 'KRC search');
  console.log('PASS KRC search');

  const titleHits = evidenceResultsToRepositoryResults(
    await searchEvidence(repositoryPath, 'Scooper Import Review', 10),
  );
  hasMatch(
    titleHits,
    (r) => r.matchFields?.includes('title') || r.conversationTitle?.includes('Scooper'),
    'conversation title search',
  );
  console.log('PASS conversation title search');

  const drilldown = hasMatch(
    krcHits,
    (r) => r.path.includes('Sources/'),
    'Explorer drilldown source path',
  );
  assert(Boolean(drilldown?.path), 'Drilldown path should be set for Explorer preview');
  console.log('PASS Explorer drilldown path');

  console.log('\nAll acceptance tests passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
