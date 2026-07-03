import type { VigsyKnowledgeAnswer } from '@scooper/core';
import { formatConversationalAnswer as formatFromEngine } from '@scooper/repository-engine';

export interface ConversationalAnswerDisplay {
  streamText: string;
  supportingText: string;
}

export function formatConversationalAnswer(answer: VigsyKnowledgeAnswer): ConversationalAnswerDisplay {
  return formatFromEngine(answer);
}
