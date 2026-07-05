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

function isFlowingExecutiveBrief(text: string): boolean {
  return /i'd move next on this/i.test(text);
}

/** Strip markdown noise so teleprompter text reads naturally. */
export function sanitizeFlowText(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.!?;:])/g, '$1')
    .trim();
}

export function splitFlowParagraphs(text: string): string[] {
  const cleaned = text.trim();
  if (!cleaned) return [];
  return cleaned
    .split(/\n\n+/)
    .map((block) => {
      const lines = block
        .split(/\n/)
        .map((line) => sanitizeFlowText(line))
        .filter(Boolean);
      return lines.join('\n');
    })
    .filter(Boolean);
}

function humanizeSteeringEnvelope(text: string, topic: string): string {
  if (isFlowingExecutiveBrief(text)) return text;

  const whatChanged =
    text.match(/what changed\s*[—-]\s*(.+?)(?=\n\nwhy it matters|\n\nwhat i recommend|$)/is)?.[1]?.trim() ??
    '';
  const whyMatters =
    text.match(/why it matters\s*[—-]\s*(.+?)(?=\n\nwhat i recommend|$)/is)?.[1]?.trim() ?? '';
  const recommend =
    text.match(/what i recommend next\s*[—-]\s*(.+)$/is)?.[1]?.trim() ?? '';

  const parts: string[] = [];
  if (whatChanged) {
    parts.push(`On "${topic}" — ${sanitizeFlowText(whatChanged)}`);
  }
  if (whyMatters) {
    parts.push(sanitizeFlowText(whyMatters));
  }
  if (recommend) {
    parts.push(`I'd move next on this: ${sanitizeFlowText(recommend)}`);
  }
  return parts.length > 0 ? parts.join('\n\n') : text;
}

function capabilityLensBrief(
  answer: VigsyKnowledgeAnswer,
  lens: string,
  topic: string,
): string {
  const excerpt = answer.directAnswer.split('\n\n').find((block) => block.trim()) ?? '';
  const gist = sanitizeFlowText(excerpt).slice(0, 220);

  switch (lens) {
    case 'Timeline':
      return gist
        ? `On the timeline for "${topic}" — ${gist} Dates and sources are below.`
        : `Here's the timeline thread for "${topic}" — scan the dates below and tell me what to pull forward.`;
    case 'Sources':
      return gist
        ? `These are the indexed sources for "${topic}" — ${gist} I've lined up the hits below.`
        : `I've lined up the indexed sources for "${topic}" below — tell me which thread to open first.`;
    case 'Images':
      return gist
        ? `Visual evidence for "${topic}" — ${gist} Images are in the panel below.`
        : `Visual evidence for "${topic}" is below — flag anything that changes the story.`;
    case 'Videos':
      return gist
        ? `Video evidence for "${topic}" — ${gist} Clips are in the panel below.`
        : `Video clips for "${topic}" are below — tell me which one matters most.`;
    case 'Repository':
      return gist
        ? `Repository records for "${topic}" — ${gist} Files are listed below.`
        : `Repository records for "${topic}" are below — open what you want to inspect.`;
    case 'Related Knowledge':
      return gist
        ? `Related threads on "${topic}" — ${gist} Connections are below.`
        : `Related threads on "${topic}" are below — tell me which connection to follow.`;
    case 'Confidence':
      return `Confidence on "${topic}" is ${answer.confidence.level} (${answer.confidence.score}%) — ${sanitizeFlowText(answer.confidence.rationale)}.`;
    case 'Summary':
      return gist
        ? `Broader read on "${topic}" — ${gist}`
        : `Here's a broader read on "${topic}" from what we have indexed.`;
    default:
      return gist || `Continuing on "${topic}" — tell me what you want to go deeper on.`;
  }
}

/** Conversational delivery — one voice, no stacked intros. */
export function formatConversationalAnswer(
  answer: VigsyKnowledgeAnswer,
  question?: string,
  topicSearchQuery?: string,
): ConversationalAnswerDisplay {
  const topic =
    topicSearchQuery?.trim() ||
    (question ? extractInvestigationTopic(question) : '') ||
    extractInvestigationTopic(answer.searchQuery);

  const lens = question ? investigationViewLabel(question) : null;
  const body =
    question && isInvestigationCapabilityQuestion(question) && lens
      ? capabilityLensBrief(answer, lens, topic || answer.searchQuery)
      : humanizeSteeringEnvelope(answer.directAnswer.trim(), topic || 'this');

  const supporting = answer.reasonedSummary.trim();
  const supportingText = supporting ? sanitizeFlowText(supporting) : '';

  return {
    streamText: body,
    supportingText,
  };
}
