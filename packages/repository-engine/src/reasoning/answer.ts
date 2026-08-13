import type {
  AnswerKnowledgeOptions,
  KnowledgeRelationshipIndex,
  ReasoningStreamChunk,
  VigsyKnowledgeAnswer,
  VigsyConversationRecord,
} from '@scooper/core';
import { getSharedAIProviderManager, verifyGroundedAnswer } from '@scooper/ai-orchestration';
import { getExecutiveBriefing } from '../awareness/query.js';
import { loadActiveExecutiveSession, loadExecutiveSessionByConversation } from '../executive-memory/persist.js';
import { ensureEvidenceIndex } from '../evidence/search.js';
import { enrichAnswerWithRelationships } from '../relationships/enrich.js';
import { ensureRelationshipIndex } from '../relationships/query.js';
import { assembleEvidenceContext } from './assemble.js';
import { buildReasoningContext, conversationContextFromOptions } from './context-builder.js';
import { composeGroundedAnswer } from './compose.js';
import { classifyQuestionIntent } from './intent.js';

function shouldSkipProvider(skeleton: VigsyKnowledgeAnswer): boolean {
  return Boolean(
    skeleton.lockDeterministicProse ||
      skeleton.intent === 'source_lookup' ||
      skeleton.intent === 'project_topic' ||
      skeleton.intent === 'relationship_trace' ||
      skeleton.suppressExecutiveMemory,
  );
}

/** Fresh conversation-local context: no prior assistant turns yet. */
function shouldExcludeConversationLocalSteering(options?: AnswerKnowledgeOptions): boolean {
  const turns = options?.conversationContext?.turns ?? [];
  return !turns.some((turn) => turn.role === 'assistant');
}

function needsRelationshipIndex(question: string): boolean {
  const intent = classifyQuestionIntent(question);
  return intent === 'project_topic' || intent === 'relationship_trace';
}

async function loadRelationshipIndexForQuestion(
  repositoryPath: string,
  question: string,
  provided?: KnowledgeRelationshipIndex | null,
): Promise<KnowledgeRelationshipIndex | undefined> {
  if (provided) return provided;
  if (!needsRelationshipIndex(question)) return undefined;
  return ensureRelationshipIndex(repositoryPath);
}

async function buildOrchestratedAnswer(
  repositoryPath: string,
  question: string,
  options: AnswerKnowledgeOptions | undefined,
  onChunk?: (chunk: ReasoningStreamChunk) => void,
): Promise<VigsyKnowledgeAnswer> {
  const index = await ensureEvidenceIndex(repositoryPath);
  const relationshipIndex = await loadRelationshipIndexForQuestion(repositoryPath, question);
  const evidenceContext = assembleEvidenceContext(index, question, {
    selectedSourceIds: options?.selectedSourceIds,
    relationshipIndex,
    excludeConversationLocalSteering: shouldExcludeConversationLocalSteering(options),
  });
  const skeleton = composeGroundedAnswer(evidenceContext);

  if (shouldSkipProvider(skeleton)) {
    if (onChunk) {
      onChunk({ kind: 'direct_answer', text: skeleton.directAnswer, providerId: 'deterministic' });
      onChunk({ kind: 'summary', text: skeleton.reasonedSummary, providerId: 'deterministic' });
      onChunk({ kind: 'done', text: '', providerId: 'deterministic' });
    }
    return {
      ...skeleton,
      reasoningProviderId: 'deterministic',
    };
  }

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
    temperature: options?.temperature,
    streaming: options?.streaming,
  });

  const request = { context: reasoningContext, groundedAnswer: skeleton };
  const aiResponse = onChunk
    ? await manager.reasonStream(request, onChunk)
    : await manager.reason(request);

  const verified = verifyGroundedAnswer(skeleton, aiResponse);
  return enrichAnswerWithRelationships(repositoryPath, verified);
}

/** Orchestrated answer pipeline — KAE owns memory/evidence; provider only reasons. */
export async function answerKnowledgeQuestion(
  repositoryPath: string,
  question: string,
  options?: AnswerKnowledgeOptions,
): Promise<VigsyKnowledgeAnswer> {
  return buildOrchestratedAnswer(repositoryPath, question, options);
}

/** Streaming variant for native provider token output. */
export async function answerKnowledgeQuestionStream(
  repositoryPath: string,
  question: string,
  options: AnswerKnowledgeOptions | undefined,
  onChunk: (chunk: ReasoningStreamChunk) => void,
): Promise<VigsyKnowledgeAnswer> {
  return buildOrchestratedAnswer(repositoryPath, question, { ...options, streaming: true }, onChunk);
}

export interface AnswerFromIndexOptions extends AnswerKnowledgeOptions {
  /** Optional fixture relationship index for F0a tests (no disk writes). */
  relationshipIndex?: KnowledgeRelationshipIndex | null;
}

/** Retrieval-only entry point for testing. */
export async function answerKnowledgeQuestionFromIndex(
  index: import('@scooper/core').EvidenceIndex,
  question: string,
  options?: AnswerFromIndexOptions,
): Promise<VigsyKnowledgeAnswer> {
  const evidenceContext = assembleEvidenceContext(index, question, {
    selectedSourceIds: options?.selectedSourceIds,
    relationshipIndex: options?.relationshipIndex,
    excludeConversationLocalSteering: shouldExcludeConversationLocalSteering(options),
  });
  const skeleton = composeGroundedAnswer(evidenceContext);

  if (shouldSkipProvider(skeleton)) {
    return { ...skeleton, reasoningProviderId: 'deterministic' };
  }

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

/**
 * True when every answered assistant turn is a navigation-only source lookup.
 * Such conversations must not sync Executive Sessions / awareness / derived evidence.
 */
export function isNavigationOnlyLookupConversation(record: VigsyConversationRecord): boolean {
  const answered = record.turns.filter((turn) => turn.role === 'assistant' && turn.answer);
  if (answered.length === 0) return false;
  return answered.every(
    (turn) =>
      turn.answer?.intent === 'source_lookup' ||
      turn.answer?.suppressExecutiveMemory === true,
  );
}
