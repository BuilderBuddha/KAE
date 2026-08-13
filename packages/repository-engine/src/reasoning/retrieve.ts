import type {
  EvidenceIndex,
  EvidenceRecord,
  EvidenceSearchResult,
  RetrievedEvidenceItem,
  SourceScopeAuthorization,
  VigsyQuestionIntent,
} from '@scooper/core';
import { resolveEvidenceDrilldown } from '../evidence/drilldown.js';
import { searchEvidenceIndex } from '../evidence/search.js';
import { tokenizeQuery } from '../evidence/tokenize.js';
import {
  classifyQuestionIntent,
  extractSearchQuery,
  recordMatchesBlockerTerms,
  recordMatchesDecisionTerms,
} from './intent.js';
import { krcIdsToForceInclude, recordBelongsToAuthorizedScope } from './source-scope.js';

/** Score floor so exact KRC matches survive any top-N cutoff. */
export const EXACT_KRC_SCORE = 100_000;

function parseTimestamp(value?: string): number {
  if (!value) return 0;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? 0 : ms;
}

function recencyBoost(record: EvidenceRecord): number {
  const ts =
    record.message?.timestamp ??
    record.conversation?.updated ??
    record.conversation?.created ??
    '';
  const ms = parseTimestamp(ts);
  if (!ms) return 0;
  const ageDays = (Date.now() - ms) / (1000 * 60 * 60 * 24);
  if (ageDays < 30) return 15;
  if (ageDays < 180) return 8;
  return 0;
}

function intentBoost(record: EvidenceRecord, intent: VigsyQuestionIntent, queryTerms: string[]): {
  boost: number;
  reasons: string[];
} {
  const reasons: string[] = [];
  let boost = 0;
  const text = [
    record.excerpt,
    record.message?.text,
    record.conversation?.title,
    record.session?.summaryReferences?.join(' '),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (intent === 'decision') {
    if (record.kind === 'executive_session') {
      boost += 45;
      reasons.push('executive session');
    }
    if (record.kind === 'message' && record.message?.role.toLowerCase().includes('assistant')) {
      boost += 20;
      reasons.push('assistant response');
    }
    if (recordMatchesDecisionTerms(text)) {
      boost += 25;
      reasons.push('decision language');
    }
    boost += recencyBoost(record);
    if (recencyBoost(record) > 0) reasons.push('recent evidence');
  }

  if (intent === 'summarize' || intent === 'executive_brief') {
    if (record.kind === 'conversation' || record.kind === 'source') {
      boost += 30;
      reasons.push('conversation source');
    }
    if (record.kind === 'executive_session') {
      boost += 25;
      reasons.push('session summary');
    }
  }

  if (intent === 'show_evidence') {
    if (record.kind === 'attachment') {
      boost += 50;
      reasons.push('attachment evidence');
      const filename = record.attachment?.filename.toLowerCase() ?? '';
      if (filename.includes('video') || /\.(mp4|webm|mov)/.test(filename)) {
        boost += 30;
        reasons.push('video attachment');
      }
      if (filename.includes('screenshot') || /\.(png|jpe?g)/.test(filename)) {
        boost += 20;
        reasons.push('image attachment');
      }
    }
    if (record.kind === 'source') {
      boost += 25;
      reasons.push('source file');
    }
    if (record.kind === 'message') {
      boost += 15;
      reasons.push('message evidence');
    }
  }

  if (intent === 'source_lookup') {
    if (record.kind === 'source') {
      boost += 80;
      reasons.push('exact source lookup');
    }
    // Navigation lookups must not prefer unrelated / false VIGSY sessions.
    if (record.kind === 'executive_session') {
      boost -= 40;
      reasons.push('session deprioritized for source lookup');
    }
  }

  if (intent === 'project_topic' || intent === 'relationship_trace') {
    if (record.kind === 'source' || record.kind === 'conversation') {
      boost += 35;
      reasons.push('project/topic source evidence');
    }
    if (record.kind === 'executive_session') {
      boost += 25;
      reasons.push('related session context');
    }
  }

  if (intent === 'blockers') {
    if (recordMatchesBlockerTerms(text)) {
      boost += 50;
      reasons.push('blocker language');
    }
    if (record.kind === 'executive_session' || record.kind === 'message') {
      boost += 15;
      reasons.push('narrative evidence');
    }
  }

  if (queryTerms.length > 1 && queryTerms.every((term) => text.includes(term))) {
    boost += 20;
    reasons.push('all query terms matched');
  }

  return { boost, reasons };
}

function hitToItem(
  hit: EvidenceSearchResult,
  record: EvidenceRecord,
  extraReasons: string[],
): RetrievedEvidenceItem {
  return {
    recordId: hit.recordId,
    kind: hit.kind,
    score: hit.score,
    title: hit.title,
    excerpt: hit.snippet,
    explorerPath: hit.drilldownPath,
    krcId: hit.krcId,
    conversationTitle: hit.conversationTitle,
    messageRole: hit.messageRole,
    matchReasons: [...hit.matchFields, ...extraReasons],
    timestamp:
      record.message?.timestamp ??
      record.conversation?.updated ??
      record.conversation?.created,
    ...(record.youtube
      ? {
          sourceType: record.youtube.sourceType,
          sourceKey: record.youtube.sourceKey,
          videoId: record.youtube.videoId,
          originalSourceUrl: record.youtube.originalSourceUrl,
          ...(typeof record.youtube.timestampSeconds === 'number'
            ? { timestampSeconds: record.youtube.timestampSeconds }
            : {}),
        }
      : {}),
  };
}

function recordToExactItem(record: EvidenceRecord, krcId: string, rankBias: number): RetrievedEvidenceItem {
  const kindBoost =
    record.kind === 'source' ? 1000 : record.kind === 'message' ? 500 : record.kind === 'attachment' ? 400 : 100;
  return {
    recordId: record.id,
    kind: record.kind,
    score: EXACT_KRC_SCORE + kindBoost - rankBias,
    title:
      record.kind === 'attachment' && record.attachment
        ? record.attachment.filename
        : (record.conversation?.title ?? krcId),
    excerpt: record.excerpt,
    explorerPath: record.repository.repositoryPath,
    krcId: record.repository.krcId,
    conversationTitle: record.conversation?.title,
    messageRole: record.message?.role,
    matchReasons: ['exact_krc_identity'],
    timestamp:
      record.message?.timestamp ??
      record.conversation?.updated ??
      record.conversation?.created,
    ...(record.youtube
      ? {
          sourceType: record.youtube.sourceType,
          sourceKey: record.youtube.sourceKey,
          videoId: record.youtube.videoId,
          originalSourceUrl: record.youtube.originalSourceUrl,
          ...(typeof record.youtube.timestampSeconds === 'number'
            ? { timestampSeconds: record.youtube.timestampSeconds }
            : {}),
        }
      : {}),
  };
}

/**
 * Force-include every index record whose repository.krcId matches an exact named/selected KRC.
 * Unrelated sessions with the phrase in the title (e.g. false VIGSY lookup sessions) are excluded.
 */
export function collectExactKrcItems(
  index: EvidenceIndex,
  krcIds: string[],
): RetrievedEvidenceItem[] {
  const items: RetrievedEvidenceItem[] = [];
  let bias = 0;
  for (const krcId of krcIds) {
    const matches = index.records.filter(
      (record) => record.repository.krcId?.toUpperCase() === krcId,
    );
    // Prefer source → message → attachment → other; never include foreign VIGSY krc ids.
    const ordered = [...matches].sort((a, b) => {
      const rank = (r: EvidenceRecord) =>
        r.kind === 'source' ? 0 : r.kind === 'message' ? 1 : r.kind === 'attachment' ? 2 : 3;
      return rank(a) - rank(b);
    });
    for (const record of ordered) {
      items.push(recordToExactItem(record, krcId, bias++));
    }
  }
  return items;
}

export interface RetrieveEvidenceOptions {
  sourceScope?: SourceScopeAuthorization;
  limit?: number;
  /** Record ids surfaced by the governed relationship index — force-include within scope. */
  relatedRecordIds?: string[];
}

/** Score for relationship-backed records — below exact KRC, above ordinary semantic. */
export const RELATIONSHIP_EVIDENCE_SCORE = 50_000;

/** Retrieves and intent-ranks evidence for a natural-language question. */
export function retrieveEvidenceForQuestion(
  index: EvidenceIndex,
  question: string,
  limitOrOptions: number | RetrieveEvidenceOptions = 30,
): {
  intent: VigsyQuestionIntent;
  searchQuery: string;
  queryTerms: string[];
  items: RetrievedEvidenceItem[];
} {
  const options: RetrieveEvidenceOptions =
    typeof limitOrOptions === 'number' ? { limit: limitOrOptions } : limitOrOptions;
  const limit = options.limit ?? 30;
  const scope = options.sourceScope ?? { authorizedKrcIds: [], authority: 'none' as const };

  const intent = classifyQuestionIntent(question);
  const searchQuery = extractSearchQuery(question);
  const queryTerms = tokenizeQuery(searchQuery);
  const forceIds = krcIdsToForceInclude(question, scope);
  const exactItems = collectExactKrcItems(index, forceIds);

  const hits = searchEvidenceIndex(index, searchQuery, 80);
  const recordById = new Map(index.records.map((record) => [record.id, record]));

  const relatedItems: RetrievedEvidenceItem[] = [];
  let relatedBias = 0;
  for (const recordId of options.relatedRecordIds ?? []) {
    const record = recordById.get(recordId);
    if (!record) continue;
    // Relationship-backed peers are authorized by the index edge; do not require same-KRC scope.
    relatedItems.push({
      recordId: record.id,
      kind: record.kind,
      score: RELATIONSHIP_EVIDENCE_SCORE - relatedBias++,
      title:
        record.kind === 'attachment' && record.attachment
          ? record.attachment.filename
          : (record.conversation?.title ?? record.repository.krcId ?? record.id),
      excerpt: record.excerpt,
      explorerPath: record.repository.repositoryPath,
      krcId: record.repository.krcId,
      conversationTitle: record.conversation?.title,
      messageRole: record.message?.role,
      matchReasons: ['governed_relationship'],
      timestamp:
        record.message?.timestamp ??
        record.conversation?.updated ??
        record.conversation?.created,
      ...(record.youtube
        ? {
            sourceType: record.youtube.sourceType,
            sourceKey: record.youtube.sourceKey,
            videoId: record.youtube.videoId,
            originalSourceUrl: record.youtube.originalSourceUrl,
            ...(typeof record.youtube.timestampSeconds === 'number'
              ? { timestampSeconds: record.youtube.timestampSeconds }
              : {}),
          }
        : {}),
    });
  }

  const ranked: RetrievedEvidenceItem[] = [];

  for (const hit of hits) {
    const record = recordById.get(hit.recordId);
    if (!record) continue;
    if (!recordBelongsToAuthorizedScope(record.repository.krcId, scope)) continue;
    // Exact KRC identity outranks semantic similarity — drop foreign sessions for forced ids.
    if (
      forceIds.length > 0 &&
      intent === 'source_lookup' &&
      record.repository.krcId &&
      !forceIds.includes(record.repository.krcId.toUpperCase())
    ) {
      continue;
    }
    const { boost, reasons } = intentBoost(record, intent, queryTerms);
    const relatedBoost = (options.relatedRecordIds ?? []).includes(record.id) ? 40 : 0;
    ranked.push({
      ...hitToItem(hit, record, relatedBoost ? [...reasons, 'governed_relationship'] : reasons),
      score: hit.score + boost + relatedBoost,
    });
  }

  ranked.sort((a, b) => b.score - a.score);

  const deduped: RetrievedEvidenceItem[] = [];
  const seen = new Set<string>();

  // Exact matches first — never removed by top-N.
  for (const item of exactItems) {
    if (scope.authority !== 'none' && !recordBelongsToAuthorizedScope(item.krcId, scope)) continue;
    if (seen.has(item.recordId)) continue;
    seen.add(item.recordId);
    deduped.push(item);
  }

  // Relationship-backed records next — authorized by index edges (may be peer KRCs).
  // Named-KRC scope still constrains ordinary semantic hits below.
  for (const item of relatedItems) {
    if (seen.has(item.recordId)) continue;
    seen.add(item.recordId);
    deduped.push(item);
  }

  for (const item of ranked) {
    if (seen.has(item.recordId)) continue;
    seen.add(item.recordId);
    deduped.push(item);
    // Reserve slots: exact + relationship matches do not count against semantic budget.
    const semanticCount = deduped.filter(
      (entry) =>
        !entry.matchReasons.includes('exact_krc_identity') &&
        !entry.matchReasons.includes('governed_relationship'),
    ).length;
    if (semanticCount >= limit) break;
  }

  if (intent === 'show_evidence') {
    const wantVideo = /video|mp4|webm|mov/i.test(searchQuery);
    const existingAttachments = deduped.some((item) => item.kind === 'attachment');
    if (wantVideo && !existingAttachments) {
      for (const record of index.records) {
        if (record.kind !== 'attachment' || !record.attachment) continue;
        if (!recordBelongsToAuthorizedScope(record.repository.krcId, scope)) continue;
        const filename = record.attachment.filename.toLowerCase();
        if (!filename.includes('video') && !/\.(mp4|webm|mov|m4v)/.test(filename)) continue;
        if (seen.has(record.id)) continue;
        seen.add(record.id);
        deduped.push({
          recordId: record.id,
          kind: 'attachment',
          score: 60,
          title: record.attachment.filename,
          excerpt: record.excerpt,
          explorerPath: record.repository.repositoryPath,
          krcId: record.repository.krcId,
          conversationTitle: record.conversation?.title,
          matchReasons: ['video attachment scan'],
        });
        if (deduped.filter((item) => item.kind === 'attachment').length >= 5) break;
      }
    }
  }

  return { intent, searchQuery, queryTerms, items: deduped };
}

/** Loads drilldown chains for top KRC anchors in retrieved evidence. */
export function loadDrilldownsForItems(
  index: EvidenceIndex,
  items: RetrievedEvidenceItem[],
  searchQuery: string,
  maxDrilldowns = 3,
): ReturnType<typeof resolveEvidenceDrilldown>[] {
  const krcSeen = new Set<string>();
  const drilldowns: ReturnType<typeof resolveEvidenceDrilldown>[] = [];

  for (const item of items) {
    if (!item.krcId || krcSeen.has(item.krcId)) continue;
    krcSeen.add(item.krcId);
    const anchor = items.find((candidate) => candidate.krcId === item.krcId);
    if (!anchor) continue;
    const drilldown = resolveEvidenceDrilldown(index, anchor.recordId, searchQuery);
    if (drilldown) drilldowns.push(drilldown);
    if (drilldowns.length >= maxDrilldowns) break;
  }

  return drilldowns;
}
