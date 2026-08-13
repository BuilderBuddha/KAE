import type {
  AssembledEvidenceContext,
  EvidenceDrilldown,
  EvidenceTimelineStep,
  KnowledgeRelationshipIndex,
  RelatedEvidenceHit,
  RetrievedEvidenceItem,
  SourceScopeAuthorization,
  VigsyQuestionIntent,
} from '@scooper/core';
import { tokenizeQuery } from '../evidence/tokenize.js';
import {
  collectNamedPairRelationshipHits,
  collectRelatedEvidenceHits,
  isProjectTopicRelationshipType,
} from '../relationships/query.js';
import { classifyQuestionIntent, extractSearchQuery } from './intent.js';
import { extractExactKrcIds } from './krc-ids.js';
import { collectExactKrcItems, loadDrilldownsForItems, retrieveEvidenceForQuestion } from './retrieve.js';
import { resolveSourceScope } from './source-scope.js';
import {
  isContentGroundingQuestion,
  resolveSourceStatuses,
  statusesRequireMetadataOnlyRefusal,
} from './source-status.js';

function isConversationLocalVigsySession(item: { explorerPath?: string; recordId?: string; kind?: string }): boolean {
  if (item.kind && item.kind !== 'executive_session') return false;
  const hay = `${item.explorerPath ?? ''} ${item.recordId ?? ''}`;
  return /ExecutiveSessions[/\\]KAE[/\\]VIGSY-/i.test(hay) || /VIGSY-[0-9A-F]{8}/i.test(hay);
}
function uniqueKrcIds(items: RetrievedEvidenceItem[]): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    if (!item.krcId || seen.has(item.krcId)) continue;
    seen.add(item.krcId);
    ids.push(item.krcId);
  }
  return ids;
}

function mergeTimeline(drilldowns: EvidenceDrilldown[]): EvidenceTimelineStep[] {
  const steps: EvidenceTimelineStep[] = [];
  const seen = new Set<string>();

  for (const drilldown of drilldowns) {
    for (const step of drilldown.timeline) {
      const key = `${step.kind}:${step.explorerPath}:${step.label}`;
      if (seen.has(key)) continue;
      seen.add(key);
      steps.push(step);
    }
  }

  return steps.slice(0, 8);
}

/** Indexed edge types safe for relationship-trace presentation (no capability spam). */
const TRACEABLE_RELATIONSHIP_TYPES = [
  'campaign_campaign',
  'topic_topic',
  'decision_decision',
  'conversation_conversation',
  'conversation_source',
  'executive_session_source',
  'conversation_executive_session',
  'attachment_source',
  'attachment_conversation',
] as const;

const PROJECT_TOPIC_RELATIONSHIP_TYPES = ['campaign_campaign', 'topic_topic'] as const;

function relatedFromDrilldowns(drilldowns: EvidenceDrilldown[]): RetrievedEvidenceItem[] {
  const items: RetrievedEvidenceItem[] = [];

  for (const drilldown of drilldowns) {
    for (const link of drilldown.sections.relatedSources.items) {
      items.push({
        recordId: link.recordId ?? link.explorerPath,
        kind: link.kind ?? 'source',
        score: 0,
        title: link.label,
        excerpt: link.subtitle ?? link.label,
        explorerPath: link.explorerPath,
        krcId: link.subtitle,
        matchReasons: ['related source'],
      });
    }
  }

  return items;
}

export interface AssembleEvidenceOptions {
  selectedSourceIds?: string[] | null;
  sourceScope?: SourceScopeAuthorization;
  /** Optional loaded relationship index — enables F0a relationship-driven retrieval. */
  relationshipIndex?: KnowledgeRelationshipIndex | null;
  /**
   * When true, ordinary unscoped retrieval excludes prior conversation-local Vigsy
   * executive-session artifacts from steering (New Conversation isolation).
   * Durable repository sources/KRCs remain available.
   */
  excludeConversationLocalSteering?: boolean;
}

/** Assembles retrieved evidence into a reasoning context with drilldown chains. */
export function assembleEvidenceContext(
  index: import('@scooper/core').EvidenceIndex,
  question: string,
  options?: AssembleEvidenceOptions,
): AssembledEvidenceContext {
  const intentHint = classifyQuestionIntent(question);
  const sourceScope =
    options?.sourceScope ??
    resolveSourceScope({
      question,
      intent: intentHint,
      selectedSourceIds: options?.selectedSourceIds,
    });

  const contentRequested = isContentGroundingQuestion(question);
  const krcsForStatus =
    sourceScope.authorizedKrcIds.length > 0
      ? sourceScope.authorizedKrcIds
      : intentHint === 'source_lookup'
        ? extractExactKrcIds(question)
        : [];

  // Resolve exact-KRC status before semantic retrieval when a named/selected scope exists.
  const sourceStatuses =
    krcsForStatus.length > 0 ? resolveSourceStatuses(index, krcsForStatus) : undefined;

  // Metadata-only content asks: skip broad semantic retrieval; keep exact source records only.
  if (contentRequested && statusesRequireMetadataOnlyRefusal(sourceStatuses)) {
    const searchQuery = extractSearchQuery(question);
    const items = collectExactKrcItems(index, krcsForStatus).filter(
      (item) => item.kind === 'source' || item.kind === 'message' || item.kind === 'attachment',
    );
    return {
      question,
      intent: intentHint,
      searchQuery,
      queryTerms: tokenizeQuery(searchQuery),
      items,
      topKrcIds: uniqueKrcIds(items),
      executiveSessions: [],
      attachments: items.filter((item) => item.kind === 'attachment'),
      messages: items.filter((item) => item.kind === 'message'),
      relatedSources: [],
      timeline: [],
      sourceStatuses,
      sourceScope,
      transcriptGroundingRequested: true,
    };
  }

  // F0a — relationship-driven retrieval for project/topic and relationship-trace intents.
  let relatedProjectTopics: RelatedEvidenceHit[] | undefined;
  let relatedRecordIds: string[] | undefined;
  const relationshipDriven =
    (intentHint === 'project_topic' || intentHint === 'relationship_trace') &&
    options?.relationshipIndex;
  const namedEndpoints = [...new Set([...sourceScope.authorizedKrcIds, ...extractExactKrcIds(question)])];

  if (relationshipDriven && options?.relationshipIndex) {
    const searchQueryPreview = extractSearchQuery(question);

    if (intentHint === 'relationship_trace' && namedEndpoints.length >= 2) {
      // Strict named-pair scope — no star dump, no unrelated high-ranking edges.
      relatedProjectTopics = collectNamedPairRelationshipHits(
        index,
        options.relationshipIndex,
        namedEndpoints[0],
        namedEndpoints[1],
        TRACEABLE_RELATIONSHIP_TYPES,
        2,
      );
      relatedRecordIds = relatedProjectTopics.map((hit) => hit.recordId);
    } else {
      const anchors = [
        ...namedEndpoints,
        ...namedEndpoints.map((id) => `${id}:source`),
        searchQueryPreview,
      ].filter(Boolean);
      const uniqueAnchors = [...new Set(anchors)].slice(0, 8);
      const allowedTypes =
        intentHint === 'project_topic'
          ? PROJECT_TOPIC_RELATIONSHIP_TYPES
          : TRACEABLE_RELATIONSHIP_TYPES;
      const rawHits = collectRelatedEvidenceHits(
        index,
        options.relationshipIndex,
        uniqueAnchors,
        searchQueryPreview,
        intentHint === 'relationship_trace' ? 8 : 40,
        allowedTypes,
      );

      if (intentHint === 'project_topic') {
        const named = new Set(
          namedEndpoints.flatMap((id) => [id.toUpperCase(), `${id.toUpperCase()}:SOURCE`]),
        );
        relatedProjectTopics = rawHits
          .filter((hit) => isProjectTopicRelationshipType(hit.relationshipType))
          .filter((hit) => !named.has(hit.recordId.toUpperCase()))
          .slice(0, 8);
        relatedRecordIds = relatedProjectTopics.map((hit) => hit.recordId);
      } else {
        // Single-endpoint trace: concise, no self-edges, no capability spam.
        relatedProjectTopics = rawHits
          .filter((hit) => hit.fromId !== hit.toId)
          .slice(0, 3);
        relatedRecordIds = relatedProjectTopics.map((hit) => hit.recordId);
      }
    }
  }

  const { intent, searchQuery, queryTerms, items: retrievedItems } = retrieveEvidenceForQuestion(
    index,
    question,
    {
      sourceScope,
      relatedRecordIds,
    },
  );

  let items = retrievedItems;
  // New Conversation isolation: do not let prior Vigsy session artifacts steer ordinary unscoped answers.
  if (
    options?.excludeConversationLocalSteering &&
    sourceScope.authority === 'none' &&
    intent !== 'project_topic' &&
    intent !== 'relationship_trace' &&
    intent !== 'source_lookup'
  ) {
    items = items.filter((item) => !isConversationLocalVigsySession(item));
  }

  const drilldowns = loadDrilldownsForItems(index, items, searchQuery).filter(
    (item): item is EvidenceDrilldown => item !== null,
  );

  const scoped = sourceScope.authority !== 'none';
  let executiveSessions = items.filter((item) => item.kind === 'executive_session');
  let attachments = items.filter((item) => item.kind === 'attachment');
  const messages = items.filter((item) => item.kind === 'message');

  if (options?.excludeConversationLocalSteering && sourceScope.authority === 'none') {
    executiveSessions = executiveSessions.filter((item) => !isConversationLocalVigsySession(item));
  }

  if (scoped || intent === 'source_lookup') {
    executiveSessions = executiveSessions.filter((item) =>
      item.krcId ? sourceScope.authorizedKrcIds.includes(item.krcId.toUpperCase()) : false,
    );
  }

  if (intent === 'show_evidence' && attachments.length === 0) {
    for (const drilldown of drilldowns) {
      if (
        scoped &&
        drilldown.anchorKrcId &&
        !sourceScope.authorizedKrcIds.includes(drilldown.anchorKrcId.toUpperCase())
      ) {
        continue;
      }
      for (const link of drilldown.sections.attachments.items) {
        attachments.push({
          recordId: link.recordId ?? link.explorerPath,
          kind: 'attachment',
          score: 0,
          title: link.label,
          excerpt: link.subtitle ?? link.label,
          explorerPath: link.explorerPath,
          krcId: drilldown.anchorKrcId,
          matchReasons: ['drilldown attachment'],
        });
      }
    }
  }
  const relatedSources = scoped ? [] : relatedFromDrilldowns(drilldowns);

  return {
    question,
    intent,
    searchQuery,
    queryTerms,
    items,
    topKrcIds: uniqueKrcIds(items),
    executiveSessions,
    attachments,
    messages,
    relatedSources,
    timeline: scoped || intent === 'source_lookup' ? [] : mergeTimeline(drilldowns),
    sourceStatuses,
    sourceScope,
    transcriptGroundingRequested: contentRequested,
    relatedProjectTopics,
  };
}

export type { VigsyQuestionIntent };
