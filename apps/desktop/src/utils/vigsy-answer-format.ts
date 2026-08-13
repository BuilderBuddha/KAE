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

export interface FormatConversationalOptions {
  /** Stable investigation topic (ChatGPT Import), never a fragment. */
  stableTopic?: string;
  /** Only true for explicit capability-chip origin. */
  capabilityOrigin?: boolean;
  /** Raw user question for intent routing. */
  rawQuestion?: string;
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

/** Drop incomplete evidence fragments that should never become the recommendation. */
export function isIncompleteActionFragment(text: string): boolean {
  const t = sanitizeFlowText(text);
  if (!t) return true;
  if (/…$|\.\.\.$/.test(t) && t.split(/\s+/).length < 8) return true;
  if (/^git working\b/i.test(t)) return true;
  if (/^(continue exploring|review more information|keep investigating)\.?$/i.test(t)) return true;
  return false;
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
  if (recommend && !isIncompleteActionFragment(recommend)) {
    parts.push(`I'd move next on this: ${sanitizeFlowText(recommend)}`);
  } else if (recommend && isIncompleteActionFragment(recommend)) {
    parts.push(
      `I'd move next on this: Decide the single outcome you need on "${topic}", then open the strongest supporting source to confirm it.`,
    );
  }
  return parts.length > 0 ? parts.join('\n\n') : text;
}

function executiveWhyBrief(answer: VigsyKnowledgeAnswer, topic: string): string {
  const insufficient = answer.confidence.level === 'insufficient' || answer.confidence.level === 'low';
  const significance =
    sanitizeFlowText(answer.reasonedSummary).slice(0, 280) ||
    sanitizeFlowText(answer.directAnswer).split(/(?<=[.!?])\s+/)[0] ||
    '';

  if (insufficient) {
    return [
      `"${topic}" matters only if we can ground the consequence — and the indexed evidence is still thin.`,
      answer.confidence.rationale
        ? `Uncertainty: ${sanitizeFlowText(answer.confidence.rationale)}`
        : 'I would not act on this until we have a clearer corroborating record.',
    ].join('\n\n');
  }

  const consequence =
    answer.confidence.level === 'high'
      ? `Acting now keeps the decision loop tight; waiting leaves the same open thread unresolved.`
      : `The cost of delay is continued ambiguity on "${topic}"; the cost of acting without a check is a false sense of closure.`;

  return [
    `"${topic}" matters because it changes what you can responsibly decide next.`,
    significance
      ? `The underlying significance: ${significance}`
      : `It sits on the critical path for the current investigation.`,
    consequence,
  ].join('\n\n');
}

function executiveNextActionBrief(answer: VigsyKnowledgeAnswer, topic: string): string {
  const fromDraft =
    answer.directAnswer.match(/i'd move next on this:\s*(.+)$/is)?.[1]?.trim() ||
    answer.directAnswer.match(/what i recommend next\s*[—-]\s*(.+)$/is)?.[1]?.trim() ||
    '';

  let action = sanitizeFlowText(fromDraft);
  if (!action || isIncompleteActionFragment(action)) {
    if (answer.confidence.level === 'insufficient') {
      action = `Do not advance a decision on "${topic}" yet — name the outcome you need, then re-ask with that target.`;
    } else if (answer.explorerLinks[0]) {
      action = `Open "${answer.explorerLinks[0].label}" and confirm whether the recorded outcome still stands for "${topic}".`;
    } else {
      action = `Pick one outcome for "${topic}" (ship, repair, or defer), then ask me to verify it against the strongest indexed source.`;
    }
  }

  if (/^(continue exploring|review more|keep investigating)/i.test(action)) {
    action = `Review the top corroborating source for "${topic}" and decide whether to ship, repair, or defer — then stop.`;
  }

  return `Next on "${topic}": ${action}`;
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
    case 'Why':
      return executiveWhyBrief(answer, topic);
    case 'Summary':
      return gist
        ? `Broader read on "${topic}" — ${gist}`
        : `Here's a broader read on "${topic}" from what we have indexed.`;
    default:
      return gist || `Continuing on "${topic}" — tell me what you want to go deeper on.`;
  }
}

function isNaturalWhyQuestion(question: string): boolean {
  return /^(why does that matter|why does this matter|why does it matter|why is that important|why is this important|why\??)\??$/i.test(
    question.trim(),
  );
}

function isNaturalNextQuestion(question: string): boolean {
  return /^(what should we do next|what do we do next|what'?s next|what next|next step|next action)\??$/i.test(
    question.trim(),
  );
}

/** Conversational delivery — one voice, no stacked intros. */
export function formatConversationalAnswer(
  answer: VigsyKnowledgeAnswer,
  question?: string,
  topicSearchQuery?: string,
  options?: FormatConversationalOptions,
): ConversationalAnswerDisplay {
  const rawQuestion = (options?.rawQuestion ?? question ?? '').trim();
  const topic =
    options?.stableTopic?.trim() ||
    topicSearchQuery?.trim() ||
    (question ? extractInvestigationTopic(question) : '') ||
    extractInvestigationTopic(answer.searchQuery);

  const safeTopic = topic || 'this investigation';
  const capabilityOrigin = Boolean(options?.capabilityOrigin);
  const lens =
    capabilityOrigin && question && isInvestigationCapabilityQuestion(question)
      ? investigationViewLabel(question)
      : null;

  let body: string;
  if (lens) {
    body = capabilityLensBrief(answer, lens, safeTopic);
  } else if (isNaturalWhyQuestion(rawQuestion)) {
    body = executiveWhyBrief(answer, safeTopic);
  } else if (isNaturalNextQuestion(rawQuestion)) {
    body = executiveNextActionBrief(answer, safeTopic);
  } else {
    body = humanizeSteeringEnvelope(answer.directAnswer.trim(), safeTopic);
  }

  const supporting = answer.reasonedSummary.trim();
  // Deduplicate: do not re-paint the same relationship block as supporting context.
  const bodyNormalized = sanitizeFlowText(body);
  const supportingNormalized = supporting ? sanitizeFlowText(supporting) : '';
  const supportingText =
    supportingNormalized && supportingNormalized !== bodyNormalized ? supportingNormalized : '';

  return {
    streamText: body,
    supportingText,
  };
}
