import type {
  AssembledEvidenceContext,
  RetrievedEvidenceItem,
  VigsyAnswerComposer,
  VigsyConfidence,
  VigsyConfidenceLevel,
  VigsyEvidenceCitation,
  VigsyExplorerLink,
  VigsyKnowledgeAnswer,
} from '@scooper/core';
import {
  buildSteeringDirectAnswer,
  buildSteeringSupportingSummary,
} from './steering-compose.js';

function toCitation(item: RetrievedEvidenceItem): VigsyEvidenceCitation {
  return {
    recordId: item.recordId,
    label: item.title,
    excerpt: item.excerpt,
    explorerPath: item.explorerPath,
    krcId: item.krcId,
    kind: item.kind,
  };
}

function uniqueCitations(items: RetrievedEvidenceItem[], limit: number): VigsyEvidenceCitation[] {
  const citations: VigsyEvidenceCitation[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.recordId)) continue;
    seen.add(item.recordId);
    citations.push(toCitation(item));
    if (citations.length >= limit) break;
  }
  return citations;
}

function computeConfidence(context: AssembledEvidenceContext): VigsyConfidence {
  const top = context.items[0];
  if (!top || context.items.length === 0) {
    return {
      level: 'insufficient',
      score: 0,
      rationale: 'No matching evidence was found in the repository index.',
    };
  }

  let score = Math.min(100, Math.round(top.score));
  const reasons: string[] = [`Top hit score ${top.score}`];

  if (context.executiveSessions.length > 0) {
    score += 15;
    reasons.push(`${context.executiveSessions.length} executive session(s)`);
  }

  const krcCount = context.topKrcIds.length;
  if (krcCount > 1) {
    score += Math.min(15, krcCount * 5);
    reasons.push(`${krcCount} corroborating KRC sources`);
  }

  if (context.queryTerms.length > 1) {
    const allTermsHit = context.items.some((item) =>
      context.queryTerms.every((term) => item.excerpt.toLowerCase().includes(term)),
    );
    if (allTermsHit) {
      score += 10;
      reasons.push('all query terms present in evidence');
    }
  }

  if (context.items.length < 3) {
    score -= 15;
    reasons.push('limited evidence volume');
  }

  score = Math.max(0, Math.min(100, score));

  let level: VigsyConfidenceLevel = 'low';
  if (score >= 75) level = 'high';
  else if (score >= 50) level = 'medium';
  else if (score < 25) level = 'insufficient';

  if (context.items.length === 1 && score < 40) {
    level = 'insufficient';
    reasons.push('single weak evidence hit');
  }

  return {
    level,
    score,
    rationale: reasons.join('; '),
  };
}

function buildDirectAnswer(context: AssembledEvidenceContext, confidence: VigsyConfidence): string {
  return buildSteeringDirectAnswer(context, confidence);
}

function buildReasonedSummary(context: AssembledEvidenceContext, confidence: VigsyConfidence): string {
  return buildSteeringSupportingSummary(context, confidence);
}

function buildExplorerLinks(context: AssembledEvidenceContext): VigsyExplorerLink[] {
  const links: VigsyExplorerLink[] = [];
  const seen = new Set<string>();

  for (const krcId of context.topKrcIds.slice(0, 5)) {
    const item = context.items.find((candidate) => candidate.krcId === krcId);
    if (!item || seen.has(item.explorerPath)) continue;
    seen.add(item.explorerPath);
    links.push({
      label: `${krcId} — ${item.conversationTitle ?? item.title}`,
      path: item.explorerPath,
      krcId,
    });
  }

  for (const session of context.executiveSessions.slice(0, 2)) {
    if (seen.has(session.explorerPath)) continue;
    seen.add(session.explorerPath);
    links.push({
      label: `Executive Session — ${session.title}`,
      path: session.explorerPath,
      krcId: session.krcId,
    });
  }

  return links;
}

/** Deterministic grounded answer composer — no LLM, evidence-only claims. */
export class DeterministicAnswerComposer implements VigsyAnswerComposer {
  compose(context: AssembledEvidenceContext): VigsyKnowledgeAnswer {
    const confidence = computeConfidence(context);
    const evidenceUsed = uniqueCitations(context.items, 8);
    const attachments = uniqueCitations(context.attachments, 6);
    const relatedSources = uniqueCitations(context.relatedSources, 5);

    return {
      question: context.question,
      intent: context.intent,
      searchQuery: context.searchQuery,
      directAnswer: buildDirectAnswer(context, confidence),
      reasonedSummary: buildReasonedSummary(context, confidence),
      evidenceUsed,
      confidence,
      timeline: context.timeline,
      relatedSources,
      attachments,
      explorerLinks: buildExplorerLinks(context),
    };
  }
}

const defaultComposer = new DeterministicAnswerComposer();

/** Composes a grounded answer from assembled evidence context. */
export function composeGroundedAnswer(
  context: AssembledEvidenceContext,
  composer: VigsyAnswerComposer = defaultComposer,
): VigsyKnowledgeAnswer {
  return composer.compose(context);
}
