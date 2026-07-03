import type { VigsyKnowledgeAnswer } from '@scooper/core';

export interface ConversationalAnswerDisplay {
  streamText: string;
  supportingText: string;
}

/** Formats a grounded answer as natural Vigsy speech (not a report). */
export function formatConversationalAnswer(answer: VigsyKnowledgeAnswer): ConversationalAnswerDisplay {
  const direct = answer.directAnswer.trim();
  const streamText = /^here'?s what i found/i.test(direct) ? direct : `Here's what I found: ${direct}`;

  const strongest = answer.evidenceUsed[0]?.label;
  const confidenceLine =
    answer.confidence.level === 'high'
      ? `I'd treat this as high confidence because ${answer.confidence.rationale}`
      : answer.confidence.level === 'medium'
        ? `I'd treat this as medium confidence because ${answer.confidence.rationale}`
        : strongest
          ? `The strongest evidence is ${strongest}.`
          : 'I grounded this in indexed repository evidence.';

  const summary = answer.reasonedSummary.trim();
  const supportingText =
    summary && !confidenceLine.toLowerCase().includes(summary.slice(0, 24).toLowerCase())
      ? `${confidenceLine} ${summary}`
      : confidenceLine;

  return { streamText, supportingText };
}
