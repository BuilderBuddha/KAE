import type {
  AssembledEvidenceContext,
  RetrievedEvidenceItem,
  SourceStatusDetail,
  VigsyConfidence,
  VigsyEvidenceCitation,
  VigsyExplorerLink,
  VigsyKnowledgeAnswer,
} from '@scooper/core';
import { isTrustedYouTubeWatchUrl } from '@scooper/core';
import { statusesRequireMetadataOnlyRefusal } from './source-status.js';

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

function statusCitation(status: SourceStatusDetail): VigsyEvidenceCitation | null {
  if (status.status === 'does_not_exist' || !status.recordId || !status.repositoryPath) {
    return null;
  }
  return {
    recordId: status.recordId,
    label: status.title ?? status.krcId,
    excerpt: status.title ?? status.krcId,
    explorerPath: status.repositoryPath,
    krcId: status.krcId,
    kind: 'source',
    ...(status.sourceType ? { sourceType: status.sourceType } : {}),
    ...(status.sourceKey ? { sourceKey: status.sourceKey } : {}),
    ...(status.videoId ? { videoId: status.videoId } : {}),
    ...(status.originalSourceUrl ? { originalSourceUrl: status.originalSourceUrl } : {}),
  };
}

function scopedEvidenceOnly(
  items: RetrievedEvidenceItem[],
  statuses: SourceStatusDetail[],
): VigsyEvidenceCitation[] {
  const allowed = new Set(statuses.map((s) => s.krcId));
  const fromItems = items
    .filter((item) => item.krcId && allowed.has(item.krcId.toUpperCase()))
    .filter((item) => item.kind === 'source' || item.kind === 'message' || item.kind === 'attachment')
    .map(toCitation);

  const seen = new Set(fromItems.map((c) => c.recordId));
  for (const status of statuses) {
    const citation = statusCitation(status);
    if (citation && !seen.has(citation.recordId)) {
      fromItems.push(citation);
      seen.add(citation.recordId);
    }
  }
  return fromItems.slice(0, 8);
}

function originalSourceNote(status: SourceStatusDetail): string {
  const url = status.originalSourceUrl;
  if (url && isTrustedYouTubeWatchUrl(url)) {
    return `Original YouTube source is available at ${url} (open via the trusted Original YouTube Source action).`;
  }
  if (url) {
    return `Stored original source URL is present but not on the trusted YouTube watch allowlist.`;
  }
  return 'No validated original YouTube URL is stored for this source.';
}

function captionNote(status: SourceStatusDetail): string {
  const cap = status.captionStatus?.trim();
  if (!cap) return '';
  return `Caption status: ${cap}.`;
}

/** Deterministic metadata-only transcript refusal — generalized from status, not hardcoded KRC. */
export function buildMetadataOnlyTranscriptRefusal(status: SourceStatusDetail): string {
  const cap = captionNote(status);
  return [
    `${status.krcId} exists as a YouTube source, but KAE could not acquire usable captions or transcript evidence.`,
    cap,
    `I can open the original video and show its stored metadata, but I cannot make claims about what was said in the video.`,
    originalSourceNote(status),
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildLookupDirectAnswer(statuses: SourceStatusDetail[]): string {
  const parts: string[] = [];
  for (const status of statuses) {
    if (status.status === 'does_not_exist') {
      parts.push(
        `There is no repository source record for ${status.krcId}. It is not present in the current evidence index.`,
      );
      continue;
    }

    const title = status.title ? ` (“${status.title}”)` : '';
    const type = status.sourceType ? ` (${status.sourceType})` : '';

    if (status.status === 'exists_metadata_only') {
      parts.push(
        [
          `${status.krcId}${title} exists${type} as a metadata-only source.`,
          captionNote(status) || 'No eligible transcript evidence is indexed.',
          `It is discoverable and its stored metadata can be shown, but spoken-content claims are not supported.`,
          originalSourceNote(status),
        ]
          .filter(Boolean)
          .join(' '),
      );
      continue;
    }

    parts.push(
      [
        `${status.krcId}${title} exists${type} with eligible transcript evidence.`,
        captionNote(status),
        originalSourceNote(status),
        `Open the source in Explorer or Evidence Chain for the full record.`,
      ]
        .filter(Boolean)
        .join(' '),
    );
  }
  return parts.join('\n\n');
}

function buildLookupSummary(statuses: SourceStatusDetail[]): string {
  const counts = {
    exists_with_transcript: 0,
    exists_metadata_only: 0,
    does_not_exist: 0,
  };
  for (const status of statuses) counts[status.status] += 1;
  return [
    'Deterministic source lookup (KAE-owned; not model-decided):',
    `${counts.exists_with_transcript} with transcript,`,
    `${counts.exists_metadata_only} metadata-only,`,
    `${counts.does_not_exist} missing.`,
  ].join(' ');
}

function explorerLinksForStatuses(statuses: SourceStatusDetail[]): VigsyExplorerLink[] {
  const links: VigsyExplorerLink[] = [];
  for (const status of statuses) {
    if (!status.repositoryPath || status.status === 'does_not_exist') continue;
    links.push({
      label: `${status.krcId} — ${status.title ?? 'Source'}`,
      path: status.repositoryPath,
      krcId: status.krcId,
    });
  }
  return links;
}

function lookupConfidence(statuses: SourceStatusDetail[]): VigsyConfidence {
  const allResolved = statuses.length > 0;
  return {
    level: allResolved ? 'high' : 'insufficient',
    score: allResolved ? 100 : 0,
    rationale: allResolved
      ? 'Deterministic exact-KRC source identity from the repository evidence index.'
      : 'No exact KRC identifiers to resolve.',
  };
}

/**
 * Compose a navigation-only source_lookup answer.
 * Provider must not decide existence; Executive Session sync should be suppressed.
 */
export function composeSourceLookupAnswer(context: AssembledEvidenceContext): VigsyKnowledgeAnswer {
  const statuses = context.sourceStatuses ?? [];
  const evidenceUsed = scopedEvidenceOnly(context.items, statuses).filter(
    (item) => item.kind === 'source' || item.kind === 'message' || item.kind === 'attachment',
  );

  return {
    question: context.question,
    intent: 'source_lookup',
    searchQuery: context.searchQuery,
    directAnswer: buildLookupDirectAnswer(statuses),
    reasonedSummary: buildLookupSummary(statuses),
    evidenceUsed,
    confidence: lookupConfidence(statuses),
    timeline: [],
    relatedSources: [],
    attachments: [],
    explorerLinks: explorerLinksForStatuses(statuses),
    sourceStatuses: statuses,
    sourceScope: context.sourceScope,
    suppressExecutiveMemory: true,
    lockDeterministicProse: true,
  };
}

/**
 * Compose a metadata-only transcript refusal for scoped YouTube sources.
 */
export function composeMetadataOnlyRefusal(
  context: AssembledEvidenceContext,
  statuses: SourceStatusDetail[],
): VigsyKnowledgeAnswer {
  const refusals = statuses
    .filter((s) => s.status === 'exists_metadata_only')
    .map(buildMetadataOnlyTranscriptRefusal);
  const other = statuses.filter((s) => s.status !== 'exists_metadata_only');
  const otherLines = other.map((s) => {
    if (s.status === 'does_not_exist') return `${s.krcId} does not exist in the repository.`;
    return `${s.krcId} has eligible transcript evidence and can support spoken-content claims from indexed captions only.`;
  });

  const directAnswer = [...refusals, ...otherLines].join('\n\n');
  const evidenceUsed = scopedEvidenceOnly(context.items, statuses).filter(
    (c) => c.kind === 'source',
  );

  return {
    question: context.question,
    intent: context.intent,
    searchQuery: context.searchQuery,
    directAnswer,
    reasonedSummary:
      'Refusal is deterministic from repository source status. No transcript evidence was substituted from unrelated sources.',
    evidenceUsed,
    confidence: {
      level: 'high',
      score: 100,
      rationale: 'Deterministic metadata-only status; transcript grounding refused.',
    },
    timeline: [],
    relatedSources: [],
    attachments: [],
    explorerLinks: explorerLinksForStatuses(statuses),
    sourceStatuses: statuses,
    sourceScope: context.sourceScope,
    // Metadata-only content refusals must not create Executive Sessions / awareness.
    suppressExecutiveMemory: true,
    lockDeterministicProse: true,
  };
}

export function shouldRefuseMetadataOnlyTranscript(
  context: AssembledEvidenceContext,
): boolean {
  if (!context.transcriptGroundingRequested) return false;
  return statusesRequireMetadataOnlyRefusal(context.sourceStatuses);
}
