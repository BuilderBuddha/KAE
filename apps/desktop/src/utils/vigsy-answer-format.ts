import type { VigsyKnowledgeAnswer } from '@scooper/core';
import {
  investigationViewLabel,
  isInvestigationCapabilityQuestion,
  extractInvestigationTopic,
} from './investigation-workflow';

export interface ConversationalAnswerDisplay {
  streamText: string;
  supportingText: string;
}

function continuationLead(question: string, searchQuery: string): string {
  const lens = investigationViewLabel(question);
  if (lens) {
    return `Continuing our investigation of "${searchQuery}" — here's the ${lens.toLowerCase()} perspective.\n\n`;
  }
  if (isInvestigationCapabilityQuestion(question)) {
    return `Continuing our investigation of "${searchQuery}".\n\n`;
  }
  return '';
}

/** Pass through steering answers with conversational continuity framing on capability follow-ups. */
export function formatConversationalAnswer(
  answer: VigsyKnowledgeAnswer,
  question?: string,
  topicSearchQuery?: string,
): ConversationalAnswerDisplay {
  const topic =
    topicSearchQuery?.trim() ||
    (question ? extractInvestigationTopic(question) : '') ||
    extractInvestigationTopic(answer.searchQuery);
  const lead = question && topic ? continuationLead(question, topic) : '';
  return {
    streamText: `${lead}${answer.directAnswer.trim()}`,
    supportingText: answer.reasonedSummary.trim(),
  };
}
