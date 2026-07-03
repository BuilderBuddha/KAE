export interface VigsySessionContext {
  lastQuestion?: string;
  lastSearchQuery?: string;
  lastKrcIds?: string[];
}

/** Enriches short follow-up questions with prior session context. */
export function enrichFollowUpQuestion(question: string, session: VigsySessionContext): string {
  const q = question.trim();
  if (!q || !session.lastSearchQuery) return q;

  const needsContext =
    /^(show me the videos|show videos|show images|show me the images|what decision|why\??|summarize more)/i.test(
      q,
    ) || q.split(/\s+/).length <= 6;

  if (!needsContext) return q;

  if (/^why\??$/i.test(q)) {
    return `Why did we decide about ${session.lastSearchQuery}?`;
  }
  if (/^summarize more/i.test(q)) {
    return `Summarize more about ${session.lastSearchQuery}.`;
  }
  if (/^what decision/i.test(q)) {
    return `What decision did we make about ${session.lastSearchQuery}?`;
  }
  if (/video/i.test(q)) {
    return `Show me the videos related to ${session.lastSearchQuery}.`;
  }
  if (/image/i.test(q)) {
    return `Show me the images and screenshots related to ${session.lastSearchQuery}.`;
  }

  return `${q} (following up on: ${session.lastSearchQuery})`;
}

export function sessionFromAnswer(
  question: string,
  answer: import('@scooper/core').VigsyKnowledgeAnswer,
): VigsySessionContext {
  return {
    lastQuestion: question,
    lastSearchQuery: answer.searchQuery,
    lastKrcIds: answer.explorerLinks.map((link) => link.krcId).filter(Boolean) as string[],
  };
}
