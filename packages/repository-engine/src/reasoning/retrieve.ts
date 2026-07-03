import type {
  EvidenceIndex,
  EvidenceRecord,
  EvidenceSearchResult,
  RetrievedEvidenceItem,
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

  if (intent === 'summarize') {
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
  };
}

/** Retrieves and intent-ranks evidence for a natural-language question. */
export function retrieveEvidenceForQuestion(
  index: EvidenceIndex,
  question: string,
  limit = 30,
): { intent: VigsyQuestionIntent; searchQuery: string; queryTerms: string[]; items: RetrievedEvidenceItem[] } {
  const intent = classifyQuestionIntent(question);
  const searchQuery = extractSearchQuery(question);
  const queryTerms = tokenizeQuery(searchQuery);
  const hits = searchEvidenceIndex(index, searchQuery, 80);
  const recordById = new Map(index.records.map((record) => [record.id, record]));

  const ranked: RetrievedEvidenceItem[] = [];

  for (const hit of hits) {
    const record = recordById.get(hit.recordId);
    if (!record) continue;
    const { boost, reasons } = intentBoost(record, intent, queryTerms);
    ranked.push({
      ...hitToItem(hit, record, reasons),
      score: hit.score + boost,
    });
  }

  ranked.sort((a, b) => b.score - a.score);

  const deduped: RetrievedEvidenceItem[] = [];
  const seen = new Set<string>();
  for (const item of ranked) {
    if (seen.has(item.recordId)) continue;
    seen.add(item.recordId);
    deduped.push(item);
    if (deduped.length >= limit) break;
  }

  if (intent === 'show_evidence') {
    const wantVideo = /video|mp4|webm|mov/i.test(searchQuery);
    const existingAttachments = deduped.some((item) => item.kind === 'attachment');
    if (wantVideo && !existingAttachments) {
      for (const record of index.records) {
        if (record.kind !== 'attachment' || !record.attachment) continue;
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
