import { DEFAULT_REPOSITORY_PATH } from '@scooper/core';
import {
  buildEvidenceIndex,
  evidenceResultsToRepositoryResults,
  getEvidenceDrilldown,
  searchEvidence,
} from '@scooper/repository-engine';

const repositoryPath = process.env.KAE_REPOSITORY_PATH ?? DEFAULT_REPOSITORY_PATH;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sectionHasItems(drilldown, sectionKey) {
  return drilldown.sections[sectionKey].items.length > 0;
}

function attachmentLabels(drilldown) {
  return drilldown.sections.attachments.items.map((item) => item.label.toLowerCase());
}

function messageLabels(drilldown) {
  return drilldown.sections.messages.items.map((item) => item.label.toLowerCase());
}

async function drilldownForQuery(query) {
  const hits = evidenceResultsToRepositoryResults(await searchEvidence(repositoryPath, query, 5));
  assert(hits.length > 0, `Expected search hits for "${query}"`);
  const hit = hits[0];
  assert(hit.recordId, `Expected recordId on top search hit for "${query}"`);
  const drilldown = await getEvidenceDrilldown(repositoryPath, hit.recordId, query);
  assert(drilldown, `Expected drilldown for "${query}"`);
  return drilldown;
}

async function testRepositoryRepair() {
  const drilldown = await drilldownForQuery('repository repair');

  assert(sectionHasItems(drilldown, 'sourceFile'), 'source section');
  assert(sectionHasItems(drilldown, 'conversation'), 'conversation section');
  assert(sectionHasItems(drilldown, 'messages'), 'messages section');
  assert(sectionHasItems(drilldown, 'executiveSession'), 'executive session section');
  assert(sectionHasItems(drilldown, 'attachments'), 'attachments section');
  assert(drilldown.timeline.length >= 4, 'timeline with 4 steps');
  assert(drilldown.timeline[0].kind === 'conversation', 'timeline starts with conversation');
  assert(
    drilldown.timeline.some((step) => step.kind === 'executive_session'),
    'timeline includes executive session',
  );
  assert(
    drilldown.timeline.some((step) => step.kind === 'related_sources'),
    'timeline includes related sources',
  );
  assert(
    drilldown.timeline.some((step) => step.kind === 'newest_evidence'),
    'timeline includes newest evidence',
  );
  assert(
    drilldown.timeline.every((step) => step.explorerPath),
    'timeline steps link to Explorer paths',
  );

  console.log('PASS repository repair drilldown');
}

async function testPoscaUx() {
  const drilldown = await drilldownForQuery('POSCA UX');
  const attachments = attachmentLabels(drilldown);
  const messages = messageLabels(drilldown);

  const hasVideo = attachments.some((label) => label.includes('video'));
  const hasScreenshot = attachments.some((label) => label.includes('screenshot'));
  const hasPrompt = messages.some((label) => label.startsWith('user'));
  const hasResponse = messages.some((label) => label.startsWith('assistant'));

  assert(hasVideo, 'videos in attachments');
  assert(hasScreenshot, 'screenshots in attachments');
  assert(hasPrompt, 'prompts in messages');
  assert(hasResponse, 'responses in messages');

  console.log('PASS POSCA UX drilldown');
}

async function main() {
  console.log(`Repository: ${repositoryPath}`);
  await buildEvidenceIndex(repositoryPath);
  await testRepositoryRepair();
  await testPoscaUx();
  console.log('\nAll drilldown acceptance tests passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
