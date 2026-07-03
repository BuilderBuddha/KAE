import type { AnswerKnowledgeOptions, VigsyKnowledgeAnswer } from '@scooper/core';
import { getSharedAIProviderManager, verifyGroundedAnswer } from '@scooper/ai-orchestration';
import { getExecutiveBriefing } from '../awareness/query.js';
import { loadActiveExecutiveSession, loadExecutiveSessionByConversation } from '../executive-memory/persist.js';
import { ensureEvidenceIndex } from '../evidence/search.js';
import { enrichAnswerWithRelationships } from '../relationships/enrich.js';
import { assembleEvidenceContext } from './assemble.js';
import { buildReasoningContext, conversationContextFromOptions } from './context-builder.js';
import { composeGroundedAnswer } from './compose.js';

/** Orchestrated answer pipeline — KAE owns memory/evidence; provider only reasons. */
export async function answerKnowledgeQuestion(
  repositoryPath: string,
  question: string,
  options?: AnswerKnowledgeOptions,
): Promise<VigsyKnowledgeAnswer> {
  const index = await ensureEvidenceIndex(repositoryPath);
  const evidenceContext = assembleEvidenceContext(index, question);
  const skeleton = composeGroundedAnswer(evidenceContext);

  const conversation = conversationContextFromOptions(options);
  const executiveMemory = conversation?.conversationId
    ? await loadExecutiveSessionByConversation(repositoryPath, conversation.conversationId)
    : await loadActiveExecutiveSession(repositoryPath);
  const briefingResult = await getExecutiveBriefing(repositoryPath);

  const reasoningContext = buildReasoningContext({
    repositoryPath,
    question,
    evidence: evidenceContext,
    conversation,
    executiveMemory,
    executiveBriefing: briefingResult.briefing,
  });

  const manager = getSharedAIProviderManager();
  const providerId = options?.providerId ?? 'mock';
  manager.setActive(providerId);
  manager.setCredentials({
    apiKey: options?.apiKey,
    model: options?.model,
    baseUrl: options?.baseUrl,
  });

  const aiResponse = await manager.reason({
    context: reasoningContext,
    groundedAnswer: skeleton,
  });

  const verified = verifyGroundedAnswer(skeleton, aiResponse);
  return enrichAnswerWithRelationships(repositoryPath, verified);
}

/** Retrieval-only entry point for testing. */
export async function answerKnowledgeQuestionFromIndex(
  index: import('@scooper/core').EvidenceIndex,
  question: string,
  options?: AnswerKnowledgeOptions,
): Promise<VigsyKnowledgeAnswer> {
  const evidenceContext = assembleEvidenceContext(index, question);
  const skeleton = composeGroundedAnswer(evidenceContext);

  const manager = getSharedAIProviderManager();
  manager.setActive(options?.providerId ?? 'deterministic');
  const aiResponse = await manager.reason({
    context: buildReasoningContext({
      repositoryPath: index.repositoryPath,
      question,
      evidence: evidenceContext,
    }),
    groundedAnswer: skeleton,
  });

  return verifyGroundedAnswer(skeleton, aiResponse);
}
