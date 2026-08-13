import type {
  EvidenceIndex,
  EvidenceRecord,
  SourceExistenceStatus,
  SourceStatusDetail,
} from '@scooper/core';

function isEligibleTranscriptEvidence(record: EvidenceRecord): boolean {
  if (record.kind !== 'message' || !record.message?.text?.trim()) return false;
  if (record.youtube) {
    return record.youtube.provenanceKind === 'youtube_creator_captions';
  }
  // ChatGPT / non-YouTube message evidence counts as eligible transcript/body evidence.
  return true;
}

function findSourceRecord(index: EvidenceIndex, krcId: string): EvidenceRecord | undefined {
  return index.records.find(
    (record) =>
      record.kind === 'source' &&
      record.repository.krcId?.toUpperCase() === krcId &&
      record.id === `${krcId}:source`,
  );
}

function findAnyRecord(index: EvidenceIndex, krcId: string): EvidenceRecord | undefined {
  return index.records.find((record) => record.repository.krcId?.toUpperCase() === krcId);
}

/**
 * Deterministic source existence/status for an exact KRC.
 * Never equates missing transcript with missing source.
 */
export function resolveSourceStatus(index: EvidenceIndex, krcId: string): SourceStatusDetail {
  const normalized = krcId.toUpperCase();
  const source = findSourceRecord(index, normalized);
  const any = source ?? findAnyRecord(index, normalized);

  if (!any) {
    return { krcId: normalized, status: 'does_not_exist' };
  }

  const hasTranscript = index.records.some(
    (record) =>
      record.repository.krcId?.toUpperCase() === normalized && isEligibleTranscriptEvidence(record),
  );

  const status: SourceExistenceStatus = hasTranscript
    ? 'exists_with_transcript'
    : source
      ? 'exists_metadata_only'
      : 'does_not_exist';

  if (status === 'does_not_exist') {
    return { krcId: normalized, status };
  }

  const anchor = source ?? any;
  return {
    krcId: normalized,
    status,
    sourceType: anchor.youtube?.sourceType ?? anchor.repository.sourceType,
    captionStatus: anchor.youtube?.captionStatus,
    provenanceKind: anchor.youtube?.provenanceKind,
    originalSourceUrl: anchor.youtube?.originalSourceUrl,
    sourceKey: anchor.youtube?.sourceKey ?? anchor.conversation?.conversationId,
    videoId: anchor.youtube?.videoId,
    title: anchor.conversation?.title,
    repositoryPath: anchor.repository.repositoryPath,
    recordId: source?.id ?? `${normalized}:source`,
  };
}

export function resolveSourceStatuses(
  index: EvidenceIndex,
  krcIds: string[],
): SourceStatusDetail[] {
  return krcIds.map((id) => resolveSourceStatus(index, id));
}

/** Content verbs — flexible order/fillers/prepositions allowed around these. */
const CONTENT_VERB_PATTERN =
  /\b(?:said|say|says|saying|discussed|discuss|discusses|discussing|claimed|claim|claims|claiming|explained|explain|explains|explaining|recommended|recommend|recommends|recommending|demonstrated|demonstrate|demonstrates|demonstrating|stated|state|states|stating|described|describe|describes|describing|mentioned|mention|mentions|mentioning|taught|teach|teaches|teaching|argued|argue|argues|arguing|concluded|conclude|concludes|concluding)\b/i;

/**
 * True when the question asks for spoken/content claims from a source.
 * Supports flexible word order and fillers (e.g. "what was last said of …").
 */
export function isContentGroundingQuestion(question: string): boolean {
  const q = question.trim();
  if (!q) return false;
  if (/\btranscript\b/i.test(q)) return true;
  if (/\bcaptions?\b/i.test(q)) return true;
  if (/\bspoken\s+content\b/i.test(q)) return true;
  if (/\bsummarize\s+(the\s+)?video\b/i.test(q)) return true;
  return CONTENT_VERB_PATTERN.test(q);
}

/** @deprecated Prefer isContentGroundingQuestion — kept for existing call sites. */
export function isTranscriptGroundingQuestion(question: string): boolean {
  return isContentGroundingQuestion(question);
}

/** Metadata-only (or missing) statuses that cannot support content claims. */
export function statusesRequireMetadataOnlyRefusal(
  statuses: SourceStatusDetail[] | undefined,
): boolean {
  if (!statuses?.length) return false;
  return (
    statuses.some((s) => s.status === 'exists_metadata_only') &&
    statuses.every((s) => s.status === 'exists_metadata_only' || s.status === 'does_not_exist')
  );
}
