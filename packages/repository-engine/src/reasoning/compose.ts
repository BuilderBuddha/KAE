import type {
  AssembledEvidenceContext,
  RelatedEvidenceHit,
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
import {
  composeMetadataOnlyRefusal,
  composeSourceLookupAnswer,
  shouldRefuseMetadataOnlyTranscript,
} from './source-lookup-compose.js';
import {
  governedRecordTypeLabel,
  isGovernedCampaignRelationshipType,
  isGovernedTopicRelationshipType,
} from '../relationships/query.js';
import { extractExactKrcIds } from './krc-ids.js';
import { tokenizeSearchTerms } from '../evidence/tokenize.js';

function toCitation(item: RetrievedEvidenceItem): VigsyEvidenceCitation {
  return {
    recordId: item.recordId,
    label: item.title,
    excerpt: item.excerpt,
    explorerPath: item.explorerPath,
    krcId: item.krcId,
    kind: item.kind,
    ...(item.sourceType ? { sourceType: item.sourceType } : {}),
    ...(item.sourceKey ? { sourceKey: item.sourceKey } : {}),
    ...(item.videoId ? { videoId: item.videoId } : {}),
    ...(item.originalSourceUrl ? { originalSourceUrl: item.originalSourceUrl } : {}),
    ...(typeof item.timestampSeconds === 'number'
      ? { timestampSeconds: item.timestampSeconds }
      : {}),
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

function filterToScope(
  items: RetrievedEvidenceItem[],
  context: AssembledEvidenceContext,
): RetrievedEvidenceItem[] {
  const scope = context.sourceScope;
  if (!scope || scope.authority === 'none' || scope.authorizedKrcIds.length === 0) {
    return items;
  }
  const allowed = new Set(scope.authorizedKrcIds);
  return items.filter((item) => item.krcId && allowed.has(item.krcId.toUpperCase()));
}

function computeConfidence(context: AssembledEvidenceContext): VigsyConfidence {
  const scopedItems = filterToScope(context.items, context);
  const top = scopedItems[0];
  if (!top || scopedItems.length === 0) {
    return {
      level: 'insufficient',
      score: 0,
      rationale: 'No matching evidence was found in the repository index.',
    };
  }

  // Exact-KRC scores are huge — normalize so confidence stays in 0–100.
  let score = Math.min(100, Math.round(Math.min(top.score, 100)));
  if (top.matchReasons.includes('exact_krc_identity')) {
    score = 95;
  }
  const reasons: string[] = [
    top.matchReasons.includes('exact_krc_identity')
      ? 'Exact KRC identity match'
      : `Top hit score ${top.score}`,
  ];

  const scoped = context.sourceScope && context.sourceScope.authority !== 'none';

  // Do not inflate confidence from unrelated Executive Session counts when scoped/exact.
  if (!scoped && context.executiveSessions.length > 0) {
    score += 15;
    reasons.push(`${context.executiveSessions.length} executive session(s)`);
  }

  const krcCount = context.topKrcIds.length;
  if (!scoped && krcCount > 1) {
    score += Math.min(15, krcCount * 5);
    reasons.push(`${krcCount} corroborating KRC sources`);
  }

  if (context.queryTerms.length > 1) {
    const allTermsHit = scopedItems.some((item) =>
      context.queryTerms.every((term) => item.excerpt.toLowerCase().includes(term)),
    );
    if (allTermsHit) {
      score += 10;
      reasons.push('all query terms present in evidence');
    }
  }

  if (scopedItems.length < 3 && !top.matchReasons.includes('exact_krc_identity')) {
    score -= 15;
    reasons.push('limited evidence volume');
  }

  score = Math.max(0, Math.min(100, score));

  let level: VigsyConfidenceLevel = 'low';
  if (score >= 75) level = 'high';
  else if (score >= 50) level = 'medium';
  else if (score < 25) level = 'insufficient';

  if (
    scopedItems.length === 1 &&
    score < 40 &&
    !top.matchReasons.includes('exact_krc_identity')
  ) {
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

function mixedSourceDisclosure(context: AssembledEvidenceContext): string | null {
  const statuses = context.sourceStatuses ?? [];
  if (statuses.length < 2) return null;
  const meta = statuses.filter((s) => s.status === 'exists_metadata_only');
  const withTx = statuses.filter((s) => s.status === 'exists_with_transcript');
  if (meta.length === 0 || withTx.length === 0) return null;
  return [
    `Mixed-source note: ${withTx.map((s) => s.krcId).join(', ')} can support claims from eligible transcript evidence.`,
    `${meta.map((s) => s.krcId).join(', ')} ${meta.length === 1 ? 'is' : 'are'} metadata-only — no spoken-content claims from ${meta.length === 1 ? 'that source' : 'those sources'}.`,
  ].join(' ');
}

function namedAnchorLabel(context: AssembledEvidenceContext): string {
  const named = context.sourceScope?.authorizedKrcIds?.[0];
  if (named) return named;
  const fromQuery = context.searchQuery?.match(/\bKRC-\d{4}\b/i)?.[0];
  return fromQuery?.toUpperCase() ?? (context.searchQuery || 'the named source');
}

function namedPairEndpoints(context: AssembledEvidenceContext): [string, string] | null {
  const fromScope = context.sourceScope?.authorizedKrcIds ?? [];
  const fromQuestion = extractExactKrcIds(context.question);
  const ids = [...new Set([...fromScope, ...fromQuestion])];
  if (ids.length < 2) return null;
  return [ids[0], ids[1]];
}

/** Display-time topic provenance cleanup (also corrected at generation via STOP_WORDS). */
function sanitizeRelationshipProvenance(reason: string): string {
  const match = reason.match(/^(Shared topic:\s*)(.+)$/i);
  if (!match) return reason;
  const cleaned = tokenizeSearchTerms(match[2].replace(/,/g, ' '));
  if (cleaned.length === 0) return 'Shared topic overlap';
  return `${match[1]}${cleaned.slice(0, 4).join(', ')}`;
}

function formatProjectTopicHit(hit: RelatedEvidenceHit, entityLabel: 'project/campaign' | 'topic'): string {
  const typeLabel = governedRecordTypeLabel(hit.kind);
  const idPart = hit.krcId ? ` (${hit.krcId})` : '';
  return [
    `• [${entityLabel}] ${hit.label}${idPart}`,
    `  linked record type: ${typeLabel}`,
    `  relationship type: ${hit.relationshipType}`,
    `  provenance: ${sanitizeRelationshipProvenance(hit.reason)}`,
  ].join('\n');
}

function formatNamedPairPathHit(hit: RelatedEvidenceHit, endpoints: [string, string]): string {
  const linkedType = governedRecordTypeLabel(hit.kind);
  const fromId = hit.fromId ?? endpoints[0];
  const toId = hit.toId ?? hit.recordId;
  return [
    `• ${fromId} —[${hit.relationshipType}]→ ${toId} (${linkedType}${hit.krcId ? `, ${hit.krcId}` : ''})`,
    `  provenance: ${sanitizeRelationshipProvenance(hit.reason)}`,
  ].join('\n');
}

function formatRelationshipTraceHit(hit: RelatedEvidenceHit, anchor: string): string {
  const linkedType = governedRecordTypeLabel(hit.kind);
  const fromId = hit.fromId ?? anchor;
  const toId = hit.toId ?? hit.recordId;
  return [
    `• ${fromId} —[${hit.relationshipType}]→ ${toId} (${linkedType}${hit.krcId ? `, ${hit.krcId}` : ''})`,
    `  provenance: ${sanitizeRelationshipProvenance(hit.reason)}`,
  ].join('\n');
}

function relatedProjectTopicBlock(context: AssembledEvidenceContext): string | null {
  const hits = context.relatedProjectTopics ?? [];
  const anchor = namedAnchorLabel(context);
  const pair = namedPairEndpoints(context);

  if (context.intent === 'project_topic') {
    const campaigns = hits.filter((hit) => isGovernedCampaignRelationshipType(hit.relationshipType));
    const topics = hits.filter((hit) => isGovernedTopicRelationshipType(hit.relationshipType));
    const parts: string[] = [];

    if (campaigns.length === 0) {
      parts.push(
        `No governed project relationship is established for ${anchor} in the current relationship index.`,
      );
    } else {
      parts.push('Related projects/campaigns from the governed relationship index:');
      parts.push(...campaigns.slice(0, 6).map((hit) => formatProjectTopicHit(hit, 'project/campaign')));
    }

    if (topics.length > 0) {
      parts.push('Related topics (not projects) from the governed relationship index:');
      parts.push(...topics.slice(0, 6).map((hit) => formatProjectTopicHit(hit, 'topic')));
    }

    return parts.join('\n');
  }

  if (context.intent === 'relationship_trace') {
    if (pair) {
      if (hits.length === 0) {
        return `No governed relationship path is established between ${pair[0]} and ${pair[1]} in the current relationship index.`;
      }
      return [
        `Governed relationship path between ${pair[0]} and ${pair[1]}:`,
        ...hits.slice(0, 4).map((hit) => formatNamedPairPathHit(hit, pair)),
      ].join('\n');
    }
    if (hits.length === 0) {
      return `No indexed relationship edges matched "${anchor}" in the current relationship index.`;
    }
    return [
      'Governed relationship links (index-backed):',
      ...hits.slice(0, 3).map((hit) => formatRelationshipTraceHit(hit, anchor)),
    ].join('\n');
  }

  if (hits.length === 0) return null;
  const lines = hits.slice(0, 6).map((hit) => `• ${hit.label} — ${sanitizeRelationshipProvenance(hit.reason)}`);
  return `Related governed links:\n${lines.join('\n')}`;
}

/** Deterministic grounded answer composer — no LLM, evidence-only claims. */
export class DeterministicAnswerComposer implements VigsyAnswerComposer {
  compose(context: AssembledEvidenceContext): VigsyKnowledgeAnswer {
    if (context.intent === 'source_lookup') {
      return composeSourceLookupAnswer(context);
    }

    if (shouldRefuseMetadataOnlyTranscript(context)) {
      return composeMetadataOnlyRefusal(context, context.sourceStatuses ?? []);
    }

    const scopedItems = filterToScope(context.items, context);
    const confidence = computeConfidence(context);
    const evidenceUsed = uniqueCitations(scopedItems, 8);
    const attachments = uniqueCitations(filterToScope(context.attachments, context), 6);
    const relatedSources = uniqueCitations(filterToScope(context.relatedSources, context), 5);

    const disclosure = mixedSourceDisclosure(context);
    const relatedBlock = relatedProjectTopicBlock(context);
    const relationshipGrounded =
      context.intent === 'project_topic' || context.intent === 'relationship_trace';

    let directAnswer: string;
    let reasonedSummary: string;
    if (relationshipGrounded && relatedBlock) {
      // Deterministic relationship skeleton only — paint once (not also in reasonedSummary).
      directAnswer = relatedBlock;
      reasonedSummary = '';
    } else {
      directAnswer = buildDirectAnswer(context, confidence);
      reasonedSummary = buildReasonedSummary(context, confidence);
    }

    if (disclosure) {
      directAnswer = `${directAnswer}\n\n${disclosure}`;
      reasonedSummary = `${reasonedSummary} ${disclosure}`;
    }

    return {
      question: context.question,
      intent: context.intent,
      searchQuery: context.searchQuery,
      directAnswer,
      reasonedSummary,
      evidenceUsed,
      confidence,
      timeline: context.timeline,
      relatedSources,
      attachments,
      explorerLinks: buildExplorerLinks(context),
      sourceStatuses: context.sourceStatuses,
      sourceScope: context.sourceScope,
      suppressExecutiveMemory: false,
      lockDeterministicProse: relationshipGrounded,
      relatedProjectTopics: context.relatedProjectTopics,
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
