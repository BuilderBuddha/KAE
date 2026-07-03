import { DEFAULT_REPOSITORY_PATH } from '@scooper/core';
import {
  answerKnowledgeQuestion,
  buildRelationshipIndex,
  ensureEvidenceIndex,
  getRelatedEvidence,
  searchRelationships,
} from '@scooper/repository-engine';

const repositoryPath = process.env.KAE_REPOSITORY_PATH ?? DEFAULT_REPOSITORY_PATH;

const TOPICS = ['Repository Repair', 'POSCA UX', 'ChatGPT Import', 'Campaign 1.3'];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  console.log(`Repository: ${repositoryPath}`);
  await ensureEvidenceIndex(repositoryPath);
  const relIndex = await buildRelationshipIndex(repositoryPath);
  console.log(`Relationship index size: ${relIndex.relationshipCount}`);

  assert(relIndex.relationshipCount > 0, 'relationship index should not be empty');

  for (const topic of TOPICS) {
    const relHits = searchRelationships(relIndex, topic, 10);
    assert(relHits.length > 0, `relationship search for "${topic}"`);
    const evidenceHits = await getRelatedEvidence(repositoryPath, topic, topic, 8);
    assert(evidenceHits.length > 0, `related evidence for "${topic}"`);
    console.log(`PASS ${topic} — ${relHits.length} relationships, ${evidenceHits.length} related evidence`);
  }

  const answer = await answerKnowledgeQuestion(repositoryPath, 'What happened with Repository Repair?');
  assert(answer.relationshipInsights, 'Vigsy answer includes relationshipInsights');
  const totalRelated =
    (answer.relationshipInsights?.relatedConversations.length ?? 0) +
    (answer.relationshipInsights?.relatedDecisions.length ?? 0) +
    (answer.relationshipInsights?.relatedCampaigns.length ?? 0) +
    (answer.relationshipInsights?.relatedAttachments.length ?? 0) +
    (answer.relationshipInsights?.relatedExecutiveSessions.length ?? 0);
  assert(totalRelated > 0, 'Vigsy enrichment has related groups');
  console.log(`PASS Vigsy enrichment — ${totalRelated} relationship hits`);

  console.log('\nAll relationship acceptance tests passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
