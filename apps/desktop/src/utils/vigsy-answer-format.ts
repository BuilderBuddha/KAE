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

function isSteeringFormattedAnswer(text: string): boolean {
  return /what changed\s*[—-]/i.test(text) && /what i recommend next\s*[—-]/i.test(text);
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
    .map((block) => sanitizeFlowText(block.replace(/\n/g, ' ')))
    .filter(Boolean);
}

function humanizeSteeringEnvelope(text: string, topic: string): string {
  if (!isSteeringFormattedAnswer(text)) return text;

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
    parts.push(`I would start here: ${sanitizeFlowText(recommend)}`);
  }
  parts.push(
    'Pick timeline, sources, or open conversation below — I will keep us on this thread.',
  );
  return parts.join('\n\n');
}

function continuationLead(question: string, searchQuery: string): string {
  const lens = investigationViewLabel(question);
  if (lens) {
    return `Staying with "${searchQuery}" — let me walk you through the ${lens.toLowerCase()}.\n\n`;
  }
  if (isInvestigationCapabilityQuestion(question)) {
    return `Still on "${searchQuery}" — here's what I found.\n\n`;
  }
  return '';
}

/** Conversational delivery with continuity framing and natural pacing. */
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
  const body = humanizeSteeringEnvelope(answer.directAnswer.trim(), topic || 'this');
  return {
    streamText: `${lead}${body}`,
    supportingText: sanitizeFlowText(answer.reasonedSummary.trim()),
  };
}
