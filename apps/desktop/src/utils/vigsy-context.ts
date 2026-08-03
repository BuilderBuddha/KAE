import type { VigsyKnowledgeAnswer } from '@scooper/core';
import type { VigsyConversationFollowUpContext } from '@scooper/core';
import { extractInvestigationTopic } from './investigation-workflow';

export type VigsySessionContext = VigsyConversationFollowUpContext;

export interface FollowUpResolution {
  /** Exact text the executive typed — stored and displayed unchanged. */
  rawQuestion: string;
  /** Internal retrieval/prompt question — may resolve pronouns against the topic. */
  retrievalQuestion: string;
  /** Stable investigation topic for lastSearchQuery. */
  stableTopic: string;
  /** True only for explicit capability-chip (or typed capability) origin. */
  isCapabilityLens: boolean;
}

const PRONOUN_FOLLOW_UP =
  /^(why does that matter|why does this matter|why does it matter|why is that important|why is this important|what should we do next|what do we do next|what'?s next|and then what|tell me more|go deeper)\??$/i;

const SHORT_NEXT =
  /^(what next|next step|next action|so what|why|why\?|and\?)\??$/i;

/** Reject fragments and polluted strings as investigation topics. */
export function isViableInvestigationTopic(topic: string | undefined | null): boolean {
  if (!topic) return false;
  const t = topic.trim();
  if (t.length < 3) return false;
  if (/^(ab|the|a|an|it|this|that|why|what|how)$/i.test(t)) return false;
  if (/\(following up on:/i.test(t)) return false;
  if (/^why does\s+"/i.test(t)) return false;
  if (/^(why|what|how|show|walk|explain|summarize|continue)\b/i.test(t) && t.split(/\s+/).length >= 5) {
    return false;
  }
  return true;
}

/**
 * Normalize a candidate topic from searchQuery / question without accepting
 * enriched wrappers or full questions as the stable topic.
 */
export function normalizeStableTopic(
  candidate: string | undefined,
  fallback?: string,
): string {
  const fromCandidate = candidate ? extractInvestigationTopic(candidate).trim() : '';
  if (isViableInvestigationTopic(fromCandidate)) return fromCandidate;

  const whyQuoted = candidate?.match(/^why does\s+"([^"]+)"\s+matter\??$/i)?.[1]?.trim();
  if (isViableInvestigationTopic(whyQuoted)) return whyQuoted!;

  const fromFallback = fallback ? extractInvestigationTopic(fallback).trim() : '';
  if (isViableInvestigationTopic(fromFallback)) return fromFallback;

  return isViableInvestigationTopic(fallback) ? fallback!.trim() : fromCandidate || fromFallback;
}

/**
 * Resolve raw user input into display, retrieval, and stable-topic fields.
 * Never rewrites the visible user turn into `(following up on: …)`.
 */
export function resolveFollowUp(
  rawInput: string,
  session: VigsySessionContext,
  options?: { capabilityOrigin?: boolean },
): FollowUpResolution {
  const rawQuestion = rawInput.trim();
  const priorTopic = normalizeStableTopic(session.lastSearchQuery, session.lastQuestion);
  const capabilityOrigin = Boolean(options?.capabilityOrigin);

  if (!rawQuestion) {
    return {
      rawQuestion: '',
      retrievalQuestion: '',
      stableTopic: priorTopic,
      isCapabilityLens: false,
    };
  }

  if (capabilityOrigin) {
    const topicFromChip =
      normalizeStableTopic(extractInvestigationTopic(rawQuestion), priorTopic) || priorTopic;
    return {
      rawQuestion,
      retrievalQuestion: rawQuestion,
      stableTopic: topicFromChip || priorTopic,
      isCapabilityLens: true,
    };
  }

  if (!priorTopic) {
    return {
      rawQuestion,
      retrievalQuestion: rawQuestion,
      stableTopic: '',
      isCapabilityLens: false,
    };
  }

  // Natural pronoun / short executive follow-ups — resolve internally only.
  if (PRONOUN_FOLLOW_UP.test(rawQuestion) || SHORT_NEXT.test(rawQuestion)) {
    let retrievalQuestion = rawQuestion;
    if (/why does (that|this|it) matter/i.test(rawQuestion)) {
      retrievalQuestion = `Why does ${priorTopic} matter?`;
    } else if (/why is (that|this) important/i.test(rawQuestion)) {
      retrievalQuestion = `Why is ${priorTopic} important?`;
    } else if (/what should we do next|what do we do next|what'?s next|what next|next step|next action/i.test(rawQuestion)) {
      retrievalQuestion = `What should we do next about ${priorTopic}?`;
    } else if (/tell me more|go deeper/i.test(rawQuestion)) {
      retrievalQuestion = `Tell me more about ${priorTopic}.`;
    } else if (/^why\??$/i.test(rawQuestion)) {
      retrievalQuestion = `Why does ${priorTopic} matter?`;
    }

    return {
      rawQuestion,
      retrievalQuestion,
      stableTopic: priorTopic,
      isCapabilityLens: false,
    };
  }

  // Explicit chip-shaped text typed manually still keeps raw display; treat as lens only via origin.
  return {
    rawQuestion,
    retrievalQuestion: rawQuestion,
    stableTopic: priorTopic,
    isCapabilityLens: false,
  };
}

/** @deprecated Prefer resolveFollowUp — kept for engine/acceptance callers. */
export function enrichFollowUpQuestion(question: string, session: VigsySessionContext): string {
  return resolveFollowUp(question, session).retrievalQuestion;
}

/**
 * Update session after an answer — preserves stable topic across follow-ups.
 * Never promotes enriched questions, assistant prose, or fragments into lastSearchQuery.
 */
export function sessionFromAnswer(
  rawQuestion: string,
  answer: VigsyKnowledgeAnswer,
  previous?: VigsySessionContext,
): VigsySessionContext {
  const priorTopic = normalizeStableTopic(previous?.lastSearchQuery, previous?.lastQuestion);
  const fromAnswer = normalizeStableTopic(answer.searchQuery, rawQuestion);
  const stableTopic = priorTopic || fromAnswer || normalizeStableTopic(rawQuestion) || answer.searchQuery;

  return {
    lastQuestion: rawQuestion.trim(),
    lastSearchQuery: isViableInvestigationTopic(stableTopic) ? stableTopic : priorTopic || fromAnswer,
    lastKrcIds: answer.explorerLinks.map((link) => link.krcId).filter(Boolean) as string[],
  };
}
