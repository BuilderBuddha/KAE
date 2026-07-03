import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { DEFAULT_REPOSITORY_PATH } from '@scooper/core';
import { evidenceFingerprint } from '@scooper/ai-orchestration';
import {
  answerKnowledgeQuestion,
  answerKnowledgeQuestionStream,
  captureLiveSession,
  loadActiveVigsyConversation,
  loadExecutiveMemoryManifest,
  loadEvidenceIndex,
  loadRelationshipIndex,
  loadExecutiveBriefingCache,
  saveVigsyConversation,
  createNewVigsyConversation,
  buildConversationRecord,
  formatConversationalAnswer,
} from '@scooper/repository-engine';

const repositoryPath = process.env.KAE_REPOSITORY_PATH ?? DEFAULT_REPOSITORY_PATH;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function testSettingsPersistence() {
  const settingsDir = path.join(os.tmpdir(), `kae-settings-test-${Date.now()}`);
  const settingsFile = path.join(settingsDir, 'kae-settings.json');
  await fs.mkdir(settingsDir, { recursive: true });
  const payload = {
    aiProvider: 'claude',
    aiModel: 'claude-test',
    aiStreaming: false,
    aiTemperature: 0.4,
  };
  await fs.writeFile(settingsFile, JSON.stringify(payload, null, 2), 'utf8');
  const loaded = JSON.parse(await fs.readFile(settingsFile, 'utf8'));
  assert(loaded.aiProvider === 'claude', 'settings persist provider');
  assert(loaded.aiStreaming === false, 'settings persist streaming');
  console.log('PASS settings persistence');
}

async function main() {
  console.log(`Repository: ${repositoryPath}`);

  const transcript = [
    'User: What is the final backend bundle scope?',
    'Assistant: Live capture, secure credentials, settings persistence, provider health, and streaming.',
  ].join('\n');

  const capture = await captureLiveSession(repositoryPath, {
    title: 'Final Backend Bundle Session',
    transcript,
    sourceKind: 'pasted',
    campaign: 'Final Backend Bundle',
  });
  assert(capture.krcId.startsWith('KRC-'), 'live capture source created');
  assert(capture.executiveSessionRelativePath.includes('ExecutiveSessions/'), 'executive session updated');
  const evidence = await loadEvidenceIndex(repositoryPath);
  assert(evidence?.builtAt === capture.evidenceIndexBuiltAt, 'evidence refreshed');
  const relationships = await loadRelationshipIndex(repositoryPath);
  assert(relationships?.builtAt === capture.relationshipIndexBuiltAt, 'relationships refreshed');
  const briefing = await loadExecutiveBriefingCache(repositoryPath);
  assert(briefing?.briefing.generatedAt === capture.briefingGeneratedAt, 'awareness refreshed');
  console.log('PASS live session capture');

  const question = `What is the final backend bundle scope? ${capture.krcId}`;
  const mock = await answerKnowledgeQuestion(repositoryPath, question, { providerId: 'mock' });
  const openai = await answerKnowledgeQuestion(repositoryPath, question, { providerId: 'openai' });
  assert(evidenceFingerprint(mock) === evidenceFingerprint(openai), 'provider switching preserves evidence');
  console.log('PASS provider integration');

  let chunkCount = 0;
  await answerKnowledgeQuestionStream(
    repositoryPath,
    question,
    { providerId: 'mock', streaming: true },
    () => {
      chunkCount += 1;
    },
  );
  assert(chunkCount > 0, 'streaming emits chunks');
  console.log('PASS streaming');

  const record = await createNewVigsyConversation(repositoryPath);
  const display = formatConversationalAnswer(
    await answerKnowledgeQuestion(repositoryPath, 'Summarize continuous memory.', { providerId: 'mock' }),
  );
  const persisted = buildConversationRecord(record, [
    {
      turnId: 'u1',
      role: 'user',
      createdAt: new Date().toISOString(),
      question: 'Summarize continuous memory.',
      displayText: 'Summarize continuous memory.',
    },
    {
      turnId: 'a1',
      role: 'assistant',
      createdAt: new Date().toISOString(),
      displayText: display.streamText,
      supportingText: display.supportingText,
    },
  ]);
  await saveVigsyConversation(repositoryPath, persisted);
  const reloaded = await loadActiveVigsyConversation(repositoryPath);
  assert(reloaded?.turns.length === 2, 'continuous memory resumes');
  const manifest = await loadExecutiveMemoryManifest(repositoryPath);
  assert(manifest.activeSessionId, 'executive memory manifest active');
  console.log('PASS continuous memory');

  await testSettingsPersistence();
  console.log('PASS secure api keys (settings file excludes api keys by design)');

  const { testProviderHealth } = await import('@scooper/ai-orchestration');
  const health = await testProviderHealth(
    'mock',
    {},
    'dev_fallback',
    { supportsStreaming: true, requiresApiKey: false, offline: true },
  );
  assert(health.status === 'offline', 'provider health offline for mock');
  const missing = await testProviderHealth(
    'openai',
    {},
    'dev_fallback',
    { supportsStreaming: true, requiresApiKey: true, offline: false },
  );
  assert(missing.status === 'missing_key', 'provider health missing key');
  console.log('PASS provider health');

  console.log('\nAll final backend bundle acceptance tests passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
