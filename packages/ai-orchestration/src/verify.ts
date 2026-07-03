import type { ReasoningResponse, VigsyKnowledgeAnswer } from '@scooper/core';

/** Ensures provider output cannot replace grounded evidence fields. */
export function verifyGroundedAnswer(
  skeleton: VigsyKnowledgeAnswer,
  response: ReasoningResponse,
): VigsyKnowledgeAnswer {
  return {
    question: skeleton.question,
    intent: skeleton.intent,
    searchQuery: skeleton.searchQuery,
    directAnswer: response.directAnswer.trim() || skeleton.directAnswer,
    reasonedSummary: response.reasonedSummary.trim() || skeleton.reasonedSummary,
    evidenceUsed: skeleton.evidenceUsed,
    confidence: skeleton.confidence,
    timeline: skeleton.timeline,
    relatedSources: skeleton.relatedSources,
    attachments: skeleton.attachments,
    explorerLinks: skeleton.explorerLinks,
    relationshipInsights: skeleton.relationshipInsights,
  };
}

export function evidenceFingerprint(answer: VigsyKnowledgeAnswer): string {
  return [
    answer.evidenceUsed.map((item) => item.recordId).join('|'),
    answer.attachments.map((item) => item.recordId).join('|'),
    answer.explorerLinks.map((item) => item.path).join('|'),
  ].join('::');
}
