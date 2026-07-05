import type { VigsyKnowledgeAnswer } from '@scooper/core';

export interface ConversationalAnswerDisplay {
  streamText: string;
  supportingText: string;
}

/** Pass through steering answers — evidence detail lives in expandable panels. */
export function formatConversationalAnswer(answer: VigsyKnowledgeAnswer): ConversationalAnswerDisplay {
  return {
    streamText: answer.directAnswer.trim(),
    supportingText: answer.reasonedSummary.trim(),
  };
}
