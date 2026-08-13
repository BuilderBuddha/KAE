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

async function drilldownForQuery(query, { requireAttachments = false } = {}) {
  const hits = evidenceResultsToRepositoryResults(await searchEvidence(repositoryPath, query, 30));
  assert(hits.length > 0, `Expected search hits for "${query}"`);

  // Prefer a durable source/conversation-bearing hit. Live repos may rank recent Vigsy
  // executive sessions above the ChatGPT source for the same query terms.
  const candidates = [];
  for (const hit of hits) {
    assert(hit.recordId, `Expected recordId on search hit for "${query}"`);
    if (/ExecutiveSessions[/\\]KAE[/\\]VIGSY-/i.test(hit.recordId) || /VIGSY-[0-9A-F]{8}/i.test(hit.recordId)) {
      continue;
    }
    const drilldown = await getEvidenceDrilldown(repositoryPath, hit.recordId, query);
    if (!drilldown) continue;
    if (drilldown.sections.conversation.items.length === 0) continue;
    candidates.push(drilldown);
    if (
      requireAttachments &&
      drilldown.sections.attachments.items.length > 0 &&
      drilldown.sections.messages.items.length > 0 &&
      drilldown.sections.executiveSession.items.length > 0
    ) {
      return drilldown;
    }
    if (!requireAttachments) return drilldown;
  }

  if (requireAttachments) {
    const full = candidates.find(
      (d) =>
        d.sections.attachments.items.length > 0 &&
        d.sections.messages.items.length > 0 &&
        d.sections.executiveSession.items.length > 0,
    );
    if (full) return full;
  }

  assert(candidates[0], `Expected conversation-bearing drilldown for "${query}"`);
  return candidates[0];
}

async function testRepositoryRepair() {
  const drilldown = await drilldownForQuery('repository repair', { requireAttachments: true });

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
