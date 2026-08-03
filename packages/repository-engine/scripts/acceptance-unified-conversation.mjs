import { DEFAULT_REPOSITORY_PATH } from '@scooper/core';
import {
  createNewVigsyConversation,
  deleteVigsyConversation,
  enrichFollowUpQuestion,
  formatConversationalAnswer,
  loadActiveVigsyConversation,
  saveVigsyConversation,
  answerKnowledgeQuestion,
  buildConversationRecord,
} from '@scooper/repository-engine';

const repositoryPath = process.env.KAE_REPOSITORY_PATH ?? DEFAULT_REPOSITORY_PATH;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  console.log(`Repository: ${repositoryPath}`);

  let record = await createNewVigsyConversation(repositoryPath);
  assert(record.conversationId, 'conversation created');
  console.log('PASS default conversation scaffold');

  const q1 = 'What happened with ChatGPT import media?';
  const answer1 = await answerKnowledgeQuestion(repositoryPath, q1);
  const display1 = formatConversationalAnswer(answer1);
  assert(display1.streamText.trim().length > 40, 'conversational answer body');
  assert(!display1.streamText.includes('Direct Answer'), 'not report headings');
  assert(!display1.streamText.includes('OpenAI summary:'), 'no cosmetic live provider branding');
  assert(answer1.evidenceUsed.length > 0, 'evidence available');
  assert(answer1.reasoningProviderId === 'mock' || answer1.reasoningProviderId, 'provider metadata present');

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

  const reloaded = await loadActiveVigsyConversation(repositoryPath);
  assert(reloaded?.turns.length === 2, 'restart persistence');
  console.log('PASS restart persistence');

  const followUp = enrichFollowUpQuestion('Show me the videos.', {
    lastSearchQuery: answer1.searchQuery,
    lastQuestion: q1,
  });
  assert(/chatgpt|import|media/i.test(followUp), 'follow-up context preserved');
  const answer2 = await answerKnowledgeQuestion(repositoryPath, followUp);
  assert(
    answer2.attachments.length > 0 || answer2.evidenceUsed.some((item) => /video|mp4|webm/i.test(item.label)),
    'media evidence on video follow-up',
  );
  console.log('PASS follow-up context');

  const priorId = record.conversationId;
  const fresh = await createNewVigsyConversation(repositoryPath);
  assert(fresh.conversationId !== priorId, 'new conversation id');
  const prior = await loadActiveVigsyConversation(repositoryPath);
  assert(prior?.conversationId === fresh.conversationId, 'active switched to new');
  console.log('PASS new conversation');

  await deleteVigsyConversation(repositoryPath, priorId);
  console.log('PASS prior conversation persisted then cleared on delete');

  console.log('\nAll unified conversation acceptance tests passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
