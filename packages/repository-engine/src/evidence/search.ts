import type {
  EvidenceIndex,
  EvidenceRecord,
  EvidenceSearchMatchField,
  EvidenceSearchResult,
  RepositorySearchResult,
} from '@scooper/core';
import { buildEvidenceIndex } from './build.js';
import { loadEvidenceIndex } from './persist.js';
import { tokenizeQuery } from './tokenize.js';

function normalizeRole(role: string): string {
  return role.trim().toLowerCase();
}

function isUserRole(role: string): boolean {
  const normalized = normalizeRole(role);
  return normalized === 'user' || normalized.startsWith('user ');
}

function isAssistantRole(role: string): boolean {
  const normalized = normalizeRole(role);
  return normalized === 'assistant' || normalized.startsWith('assistant ');
}

function recordCategory(
  record: EvidenceRecord,
): RepositorySearchResult['category'] {
  if (record.kind === 'executive_session') return 'session';
  if (record.kind === 'attachment') return 'attachment';
  if (record.repository.category === 'sessions') return 'session';
  return 'source';
}

function resultTitle(record: EvidenceRecord): string {
  if (record.kind === 'attachment' && record.attachment) {
    return record.attachment.filename;
  }
  if (record.kind === 'executive_session') {
    return record.conversation?.title ?? record.session?.sessionId ?? 'Executive Session';
  }
  if (record.kind === 'message' && record.message) {
    const title = record.conversation?.title ?? record.repository.krcId ?? 'Message';
    return `${title} — ${record.message.role}`;
  }
  return record.conversation?.title ?? record.repository.krcId ?? record.repository.repositoryPath;
}

function drilldownPath(record: EvidenceRecord): string {
  if (record.kind === 'executive_session') {
    if (record.session?.transcriptReference) {
      return record.session.transcriptReference;
    }
    const sourceRef = record.session?.summaryReferences.find((ref) => ref.startsWith('Sources/'));
    if (sourceRef) return sourceRef;
    return record.repository.repositoryPath;
  }
  if (record.kind === 'attachment' && record.attachment?.assetPath) {
    return record.repository.repositoryPath;
  }
  return record.repository.repositoryPath;
}

function haystackForRecord(record: EvidenceRecord): string {
  const parts: string[] = [
    record.repository.krcId ?? '',
    record.repository.repositoryPath,
    record.conversation?.title ?? '',
    record.conversation?.conversationId ?? '',
    record.excerpt,
  ];

  if (record.message) {
    parts.push(record.message.text, record.message.role, ...record.message.searchTerms);
  }
  if (record.attachment) {
    parts.push(record.attachment.filename, record.attachment.assetPath ?? '');
  }
  if (record.session) {
    parts.push(record.session.sessionId, record.session.linkedKrcId ?? '', ...record.session.summaryReferences);
  }

  return parts.join('\n').toLowerCase();
}

function scoreRecord(
  record: EvidenceRecord,
  query: string,
  queryTokens: string[],
): { score: number; matchFields: EvidenceSearchMatchField[] } {
  const matchFields = new Set<EvidenceSearchMatchField>();
  let score = 0;
  const qLower = query.toLowerCase();

  const krcId = record.repository.krcId?.toLowerCase();
  if (krcId && (krcId === qLower || krcId.includes(qLower))) {
    score += 100;
    matchFields.add('krcId');
  }

  const title = record.conversation?.title?.toLowerCase() ?? '';
  if (title && title.includes(qLower)) {
    score += 40;
    matchFields.add('title');
  }

  if (record.kind === 'attachment' && record.attachment) {
    const filename = record.attachment.filename.toLowerCase();
    if (filename.includes(qLower) || queryTokens.some((token) => filename.includes(token))) {
      score += 50;
      matchFields.add('filename');
      matchFields.add('attachment');
    }
  }

  if (record.kind === 'message' && record.message) {
    const textLower = record.message.text.toLowerCase();
    const phraseHit = textLower.includes(qLower);
    const tokenHits = queryTokens.filter((token) => textLower.includes(token)).length;

    if (phraseHit || tokenHits > 0) {
      score += phraseHit ? 30 : tokenHits * 8;
      matchFields.add('message');
      matchFields.add('keyword');

      if (isUserRole(record.message.role)) {
        matchFields.add('prompt');
        if (phraseHit) score += 10;
      }
      if (isAssistantRole(record.message.role)) {
        matchFields.add('response');
        if (phraseHit) score += 10;
      }
    }
  }

  if (record.kind === 'executive_session') {
    const haystack = haystackForRecord(record);
    if (haystack.includes(qLower) || queryTokens.some((token) => haystack.includes(token))) {
      score += 25;
      matchFields.add('session');
      matchFields.add('keyword');
    }
  }

  if (record.kind === 'source' || record.kind === 'conversation') {
    const haystack = haystackForRecord(record);
    if (haystack.includes(qLower) || queryTokens.some((token) => haystack.includes(token))) {
      score += 15;
      matchFields.add('keyword');
    }
  }

  if (score === 0) {
    const haystack = haystackForRecord(record);
    if (haystack.includes(qLower)) {
      score += 5;
      matchFields.add('keyword');
    } else {
      const tokenHits = queryTokens.filter((token) => haystack.includes(token)).length;
      if (tokenHits > 0) {
        score += tokenHits * 3;
        matchFields.add('keyword');
      }
    }
  }

  return { score, matchFields: [...matchFields] };
}

function toSearchResult(
  record: EvidenceRecord,
  score: number,
  matchFields: EvidenceSearchMatchField[],
): EvidenceSearchResult {
  return {
    recordId: record.id,
    kind: record.kind,
    score,
    matchFields,
    title: resultTitle(record),
    snippet: record.excerpt,
    drilldownPath: drilldownPath(record),
    krcId: record.repository.krcId,
    conversationTitle: record.conversation?.title,
    messageRole: record.message?.role,
    attachmentFilename: record.attachment?.filename,
    category: recordCategory(record),
  };
}

/** Searches a loaded evidence index. */
export function searchEvidenceIndex(
  index: EvidenceIndex,
  query: string,
  limit = 50,
): EvidenceSearchResult[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const queryTokens = tokenizeQuery(trimmed);
  const hits: EvidenceSearchResult[] = [];

  for (const record of index.records) {
    const { score, matchFields } = scoreRecord(record, trimmed, queryTokens);
    if (score <= 0 || matchFields.length === 0) continue;
    hits.push(toSearchResult(record, score, matchFields));
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** Maps evidence hits to repository search results for IPC/UI compatibility. */
export function evidenceResultsToRepositoryResults(
  hits: EvidenceSearchResult[],
): RepositorySearchResult[] {
  return hits.map((hit) => ({
    path: hit.drilldownPath,
    title: hit.title,
    snippet: hit.snippet,
    category: hit.category,
    score: hit.score,
    evidenceKind: hit.kind,
    recordId: hit.recordId,
    matchFields: hit.matchFields,
    krcId: hit.krcId,
    conversationTitle: hit.conversationTitle,
    messageRole: hit.messageRole,
    attachmentFilename: hit.attachmentFilename,
  }));
}

/** Ensures an evidence index exists, building when missing or stale. */
export async function ensureEvidenceIndex(repositoryPath: string): Promise<EvidenceIndex> {
  const existing = await loadEvidenceIndex(repositoryPath);
  if (existing && existing.repositoryPath === repositoryPath) {
    return existing;
  }
  return buildEvidenceIndex(repositoryPath);
}

/** Searches repository knowledge via the evidence index. */
export async function searchEvidence(
  repositoryPath: string,
  query: string,
  limit = 50,
): Promise<EvidenceSearchResult[]> {
  const index = await ensureEvidenceIndex(repositoryPath);
  return searchEvidenceIndex(index, query, limit);
}
