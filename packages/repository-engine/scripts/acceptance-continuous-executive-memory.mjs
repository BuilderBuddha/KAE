import fs from 'node:fs/promises';
import path from 'node:path';
import { DEFAULT_REPOSITORY_PATH } from '@scooper/core';
import {
  answerKnowledgeQuestion,
  buildConversationRecord,
  createNewVigsyConversation,
  formatConversationalAnswer,
  getExecutiveContinuity,
  loadActiveVigsyConversation,
  loadExecutiveMemoryManifest,
  loadExecutiveSessionByConversation,
  loadEvidenceIndex,
  loadRelationshipIndex,
  loadExecutiveBriefingCache,
  saveVigsyConversation,
  syncExecutiveMemoryFromConversation,
} from '@scooper/repository-engine';

const repositoryPath = process.env.KAE_REPOSITORY_PATH ?? DEFAULT_REPOSITORY_PATH;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  console.log(`Repository: ${repositoryPath}`);

  let record = await createNewVigsyConversation(repositoryPath);
  const q1 = 'What blockers remain for Campaign 1.6b — Continuous Executive Memory?';
  const answer1 = await answerKnowledgeQuestion(repositoryPath, q1);
  const display1 = formatConversationalAnswer(answer1);

  record = buildConversationRecord(record, [
    {
      turnId: 'u1',
      role: 'user',
      createdAt: new Date().toISOString(),
      question: q1,
      displayText: q1,
    },
    {
      turnId: 'a1',
      role: 'assistant',
      createdAt: new Date().toISOString(),
      displayText: display1.streamText,
      supportingText: display1.supportingText,
      answer: answer1,
      evidenceIds: answer1.evidenceUsed.map((item) => item.recordId),
      confidence: answer1.confidence,
      followUpContext: {
        lastQuestion: q1,
        lastSearchQuery: answer1.searchQuery,
        lastKrcIds: answer1.explorerLinks.map((link) => link.krcId).filter(Boolean),
      },
    },
  ]);

  await saveVigsyConversation(repositoryPath, record);
  const sync = await syncExecutiveMemoryFromConversation(repositoryPath, record);
  assert(sync.session.lifecycle === 'active', 'executive session active');
  assert(sync.session.currentObjective, 'objective captured');
  assert(sync.session.executiveSessionPath?.startsWith('ExecutiveSessions/'), 'executive session markdown');
  console.log('PASS automatic executive session');

  const sessionFile = path.join(repositoryPath, sync.session.executiveSessionPath);
  await fs.access(sessionFile);
  const manifest = await loadExecutiveMemoryManifest(repositoryPath);
  assert(manifest.activeSessionId === sync.session.sessionId, 'manifest active session');
  console.log('PASS continuous memory persistence');

  const evidence = await loadEvidenceIndex(repositoryPath);
  assert(evidence.builtAt === sync.evidenceIndexBuiltAt, 'evidence index refreshed');
  const relationships = await loadRelationshipIndex(repositoryPath);
  assert(relationships.builtAt === sync.relationshipIndexBuiltAt, 'relationship index refreshed');
  const briefingCache = await loadExecutiveBriefingCache(repositoryPath);
  assert(briefingCache?.briefing.generatedAt === sync.briefingGeneratedAt, 'awareness refreshed');
  console.log('PASS automatic awareness and index updates');

  const reloaded = await loadActiveVigsyConversation(repositoryPath);
  assert(reloaded?.turns.length === 2, 'conversation resumes after restart');
  const session = await loadExecutiveSessionByConversation(repositoryPath, record.conversationId);
  assert(session?.sessionId === sync.session.sessionId, 'executive session resumes');
  console.log('PASS restart persistence');

  const continuity = await getExecutiveContinuity(repositoryPath);
  assert(/welcome back/i.test(continuity.welcomeMessage), 'welcome continuity message');
  assert(continuity.session, 'continuity session present');
  console.log('PASS conversation continuity');

  console.log('\nAll continuous executive memory acceptance tests passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
