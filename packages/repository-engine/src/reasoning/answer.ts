import type { VigsyAnswerComposer, VigsyKnowledgeAnswer } from '@scooper/core';
import { ensureEvidenceIndex } from '../evidence/search.js';
import { enrichAnswerWithRelationships } from '../relationships/enrich.js';
import { assembleEvidenceContext } from './assemble.js';
import { composeGroundedAnswer } from './compose.js';

export { assembleEvidenceContext } from './assemble.js';
export { composeGroundedAnswer, DeterministicAnswerComposer } from './compose.js';
export {
  classifyQuestionIntent,
  extractSearchQuery,
} from './intent.js';
export { retrieveEvidenceForQuestion, loadDrilldownsForItems } from './retrieve.js';

/** Answers a knowledge question using evidence index retrieval and grounded composition. */
export async function answerKnowledgeQuestion(
  repositoryPath: string,
  question: string,
  composer?: VigsyAnswerComposer,
): Promise<VigsyKnowledgeAnswer> {
  const index = await ensureEvidenceIndex(repositoryPath);
  const context = assembleEvidenceContext(index, question);
  const answer = composeGroundedAnswer(context, composer);
  return enrichAnswerWithRelationships(repositoryPath, answer);
}

/** Retrieval-only entry point for testing and future LLM pipelines. */
export async function answerKnowledgeQuestionFromIndex(
  index: import('@scooper/core').EvidenceIndex,
  question: string,
  composer?: VigsyAnswerComposer,
): Promise<VigsyKnowledgeAnswer> {
  const context = assembleEvidenceContext(index, question);
  return composeGroundedAnswer(context, composer);
}
