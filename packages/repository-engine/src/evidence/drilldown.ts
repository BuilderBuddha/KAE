import type {
  EvidenceDrilldown,
  EvidenceDrilldownLink,
  EvidenceDrilldownSection,
  EvidenceIndex,
  EvidenceRecord,
  EvidenceTimelineStep,
} from '@scooper/core';
import { ensureEvidenceIndex } from './search.js';
import { tokenizeQuery, tokenizeSearchTerms } from './tokenize.js';

function inferAttachmentKind(filename: string, assetPath?: string): 'image' | 'video' | 'other' {
  const hint = `${filename} ${assetPath ?? ''}`.toLowerCase();
  if (/\.(png|jpe?g|gif|webp|bmp|svg)/.test(hint) || hint.includes('screenshot')) {
    return 'image';
  }
  if (/\.(mp4|webm|mov|m4v|avi)/.test(hint) || hint.includes('video')) {
    return 'video';
  }
  return 'other';
}

function parseTimestamp(value?: string): number {
  if (!value) return 0;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? 0 : ms;
}

function section(id: string, title: string, items: EvidenceDrilldownLink[], emptyMessage?: string): EvidenceDrilldownSection {
  return { id, title, items, emptyMessage };
}

function link(
  label: string,
  explorerPath: string,
  options?: Partial<EvidenceDrilldownLink>,
): EvidenceDrilldownLink {
  return { label, explorerPath, ...options };
}

function resolveAnchor(record: EvidenceRecord): { krcId?: string; sourcePath: string } {
  if (record.kind === 'executive_session') {
    return {
      krcId: record.session?.linkedKrcId ?? record.repository.krcId,
      sourcePath:
        record.session?.transcriptReference ??
        record.session?.summaryReferences.find((ref) => ref.startsWith('Sources/')) ??
        record.repository.repositoryPath,
    };
  }

  return {
    krcId: record.repository.krcId,
    sourcePath: record.repository.repositoryPath,
  };
}

function recordsForKrc(index: EvidenceIndex, krcId: string): EvidenceRecord[] {
  return index.records.filter((record) => record.repository.krcId === krcId);
}

function findRecord(index: EvidenceIndex, recordId: string): EvidenceRecord | undefined {
  return index.records.find((record) => record.id === recordId);
}

function findSourceRecord(records: EvidenceRecord[], krcId: string): EvidenceRecord | undefined {
  return records.find((record) => record.kind === 'source' && record.id === `${krcId}:source`);
}

function findConversationRecord(records: EvidenceRecord[], krcId: string): EvidenceRecord | undefined {
  return records.find((record) => record.kind === 'conversation' && record.id === `${krcId}:conversation`);
}

function findExecutiveSession(index: EvidenceIndex, krcId?: string): EvidenceRecord | undefined {
  if (!krcId) return undefined;
  return index.records.find(
    (record) =>
      record.kind === 'executive_session' &&
      (record.session?.linkedKrcId === krcId || record.repository.krcId === krcId),
  );
}

function messageMatchesQuery(record: EvidenceRecord, query?: string): boolean {
  if (!query || !record.message) return false;
  const q = query.toLowerCase();
  return (
    record.message.text.toLowerCase().includes(q) ||
    tokenizeQuery(query).some((token) => record.message!.text.toLowerCase().includes(token))
  );
}

function attachmentMatchesQuery(record: EvidenceRecord, query?: string): boolean {
  if (!query || !record.attachment) return false;
  const q = query.toLowerCase();
  const filename = record.attachment.filename.toLowerCase();
  return filename.includes(q) || tokenizeQuery(query).some((token) => filename.includes(token));
}

function buildDecisionSummary(
  anchor: EvidenceRecord,
  krcId: string | undefined,
  title: string,
  query: string | undefined,
  sessionRecord: EvidenceRecord | undefined,
): string {
  const parts: string[] = [];
  parts.push(`Evidence anchor: ${anchor.kind.replace(/_/g, ' ')}`);

  if (krcId) parts.push(`KRC ${krcId}`);
  if (title) parts.push(`"${title}"`);
  if (query) parts.push(`matched query "${query}"`);

  if (sessionRecord?.excerpt) {
    parts.push(`Session summary: ${sessionRecord.excerpt}`);
  } else if (anchor.excerpt) {
    parts.push(anchor.excerpt);
  }

  return parts.join(' · ');
}

function findRelatedSources(
  index: EvidenceIndex,
  anchorKrcId: string | undefined,
  anchorTitle: string,
  query: string | undefined,
  limit = 5,
): EvidenceRecord[] {
  const seedTerms = new Set<string>([
    ...tokenizeSearchTerms(anchorTitle),
    ...(query ? tokenizeQuery(query) : []),
  ]);
  if (seedTerms.size === 0) return [];

  const scored: Array<{ record: EvidenceRecord; score: number }> = [];

  for (const record of index.records) {
    if (record.kind !== 'source' || record.repository.krcId === anchorKrcId) continue;
    const title = record.conversation?.title ?? '';
    const titleTerms = tokenizeSearchTerms(title);
    let score = titleTerms.filter((term) => seedTerms.has(term)).length;
    if (query && title.toLowerCase().includes(query.toLowerCase())) score += 3;
    if (score > 0) scored.push({ record, score });
  }

  return scored
    .sort((a, b) => b.score - a.score || (b.record.conversation?.title ?? '').localeCompare(a.record.conversation?.title ?? ''))
    .slice(0, limit)
    .map((entry) => entry.record);
}

function findNewestEvidence(
  krcRecords: EvidenceRecord[],
): { record: EvidenceRecord; timestamp: string } | null {
  let newest: { record: EvidenceRecord; timestamp: string; ms: number } | null = null;

  for (const record of krcRecords) {
    if (record.kind === 'message' && record.message) {
      const timestamp = record.message.timestamp ?? record.conversation?.updated ?? '';
      const ms = parseTimestamp(timestamp);
      if (!newest || ms >= newest.ms) {
        newest = { record, timestamp, ms };
      }
    }

    if (record.kind === 'attachment' && record.attachment?.resolved) {
      const timestamp = record.conversation?.updated ?? record.conversation?.created ?? '';
      const ms = parseTimestamp(timestamp);
      if (!newest || ms >= newest.ms) {
        newest = { record, timestamp, ms };
      }
    }
  }

  return newest ? { record: newest.record, timestamp: newest.timestamp } : null;
}

/** Resolves a deterministic evidence chain for a search hit. */
export function resolveEvidenceDrilldown(
  index: EvidenceIndex,
  recordId: string,
  query?: string,
): EvidenceDrilldown | null {
  const anchorRecord = findRecord(index, recordId);
  if (!anchorRecord) return null;

  const { krcId, sourcePath } = resolveAnchor(anchorRecord);
  const krcRecords = krcId ? recordsForKrc(index, krcId) : [anchorRecord];
  const sourceRecord =
    (krcId ? findSourceRecord(krcRecords, krcId) : undefined) ??
    index.records.find(
      (record) => record.kind === 'source' && record.repository.repositoryPath === sourcePath,
    ) ??
    (anchorRecord.kind === 'source' ? anchorRecord : undefined);
  const conversationRecord = krcId ? findConversationRecord(krcRecords, krcId) : undefined;
  const conversationMeta = conversationRecord ?? sourceRecord;
  const sessionRecord = findExecutiveSession(index, krcId);
  const title =
    conversationRecord?.conversation?.title ??
    conversationMeta?.conversation?.title ??
    anchorRecord.conversation?.title ??
    sourceRecord?.conversation?.title ??
    'Untitled';

  const messageRecords = krcRecords
    .filter((record) => record.kind === 'message')
    .sort((a, b) => {
      const aIdx = Number(a.message?.messageId.split(':msg:')[1] ?? a.message?.messageId.split(':transcript:')[1] ?? 0);
      const bIdx = Number(b.message?.messageId.split(':msg:')[1] ?? b.message?.messageId.split(':transcript:')[1] ?? 0);
      return aIdx - bIdx;
    });

  const attachmentRecords = krcRecords.filter((record) => record.kind === 'attachment');
  const relatedSources = findRelatedSources(index, krcId, title, query);
  const newest = findNewestEvidence(krcRecords);
  const isYouTube =
    sourceRecord?.repository.sourceType === 'youtube' || Boolean(sourceRecord?.youtube);

  const decisionSummary = buildDecisionSummary(anchorRecord, krcId, title, query, sessionRecord);

  const sourceFile = section('sourceFile', 'Source File', [
    link(sourceRecord?.repository.repositoryPath.split('/').pop() ?? sourcePath, sourcePath, {
      recordId: sourceRecord?.id,
      kind: 'source',
      subtitle: krcId,
      highlighted: anchorRecord.kind === 'source',
    }),
  ]);

  if (isYouTube) {
    const yt = sourceRecord?.youtube ?? anchorRecord.youtube;
    const originalUrl = yt?.originalSourceUrl;
    const youtubeEvidence = section(
      'conversation',
      'YouTube Evidence',
      [
        link(title, sourcePath, {
          recordId: sourceRecord?.id,
          kind: 'source',
          subtitle: [yt?.sourceKey, yt?.videoId ? `Video ID ${yt.videoId}` : undefined]
            .filter(Boolean)
            .join(' · '),
          highlighted: true,
        }),
        ...messageRecords.map((record) =>
          link(`Caption transcript: ${record.excerpt}`, sourcePath, {
            recordId: record.id,
            kind: 'message',
            subtitle: record.youtube?.originalSourceUrl,
            highlighted: record.id === anchorRecord.id,
          }),
        ),
      ],
      'No YouTube evidence indexed.',
    );

    const originalSource = section(
      'messages',
      'Original YouTube Source',
      originalUrl
        ? [
            link('Open original YouTube source', sourcePath, {
              recordId: sourceRecord?.id,
              kind: 'source',
              subtitle: originalUrl,
              externalUrl: originalUrl,
              highlighted: true,
            }),
          ]
        : [],
      'No canonical YouTube URL available.',
    );

    const noSession = section(
      'executiveSession',
      'Executive Session',
      [],
      'No automatic Executive Session for YouTube sources.',
    );

    const attachments = section('attachments', 'Attachments', [], 'No attachments indexed.');

    const relatedSourcesSection = section(
      'relatedSources',
      'Related Sources',
      relatedSources.map((record) =>
        link(
          record.conversation?.title ?? record.repository.krcId ?? record.repository.repositoryPath,
          record.repository.repositoryPath,
          {
            recordId: record.id,
            kind: 'source',
            subtitle: record.repository.krcId,
          },
        ),
      ),
      'No related sources found.',
    );

    const timelineSteps: EvidenceTimelineStep[] = [
      {
        kind: 'youtube_evidence',
        label: title,
        subtitle: krcId,
        explorerPath: sourcePath,
        recordId: sourceRecord?.id ?? anchorRecord.id,
      },
      {
        kind: 'youtube_original_source',
        label: 'Original YouTube Source',
        subtitle: originalUrl,
        explorerPath: sourcePath,
        recordId: sourceRecord?.id,
      },
    ];

    const timelineSection = section(
      'timeline',
      'Timeline',
      timelineSteps.map((step) =>
        link(step.label, step.explorerPath, {
          recordId: step.recordId,
          subtitle: [step.subtitle, step.timestamp].filter(Boolean).join(' · '),
          ...(step.kind === 'youtube_original_source' && originalUrl
            ? { externalUrl: originalUrl }
            : {}),
        }),
      ),
    );

    return {
      anchorRecordId: recordId,
      anchorKrcId: krcId,
      anchorSourcePath: sourcePath,
      query,
      decisionSummary,
      sections: {
        decisionSummary: section('decisionSummary', 'Decision Summary', [
          link(decisionSummary, sourcePath, { highlighted: true }),
        ]),
        sourceFile,
        conversation: youtubeEvidence,
        messages: originalSource,
        attachments,
        executiveSession: noSession,
        relatedSources: relatedSourcesSection,
        timeline: timelineSection,
      },
      timeline: timelineSteps,
    };
  }

  const conversation = section(
    'conversation',
    'Conversation',
    conversationMeta
      ? [
          link(title, sourcePath, {
            recordId: conversationRecord?.id ?? sourceRecord?.id,
            kind: conversationRecord?.kind ?? 'conversation',
            subtitle: [
              conversationMeta.conversation?.conversationId,
              conversationMeta.conversation?.created
                ? `Created ${conversationMeta.conversation.created}`
                : undefined,
              conversationMeta.conversation?.updated
                ? `Updated ${conversationMeta.conversation.updated}`
                : undefined,
            ]
              .filter(Boolean)
              .join(' · '),
            highlighted: anchorRecord.kind === 'conversation',
          }),
        ]
      : [],
    'No conversation metadata indexed.',
  );

  const messages = section(
    'messages',
    'Messages',
    messageRecords.map((record) =>
      link(`${record.message?.role ?? 'Message'}: ${record.excerpt}`, sourcePath, {
        recordId: record.id,
        kind: 'message',
        subtitle: record.message?.timestamp,
        highlighted: record.id === anchorRecord.id || messageMatchesQuery(record, query),
      }),
    ),
    'No messages indexed.',
  );

  const attachments = section(
    'attachments',
    'Attachments',
    attachmentRecords.map((record) => {
      const filename = record.attachment?.filename ?? 'Attachment';
      const kind = inferAttachmentKind(filename, record.attachment?.assetPath);
      const typeLabel = kind === 'image' ? 'Screenshot' : kind === 'video' ? 'Video' : 'File';
      return link(`${typeLabel}: ${filename}`, sourcePath, {
        recordId: record.id,
        kind: 'attachment',
        subtitle: record.attachment?.resolved ? record.attachment.assetPath : 'Unresolved reference',
        highlighted: record.id === anchorRecord.id || attachmentMatchesQuery(record, query),
      });
    }),
    'No attachments indexed.',
  );

  const executiveSession = section(
    'executiveSession',
    'Executive Session',
    sessionRecord
      ? [
          link(sessionRecord.conversation?.title ?? sessionRecord.session?.sessionId ?? 'Session', sessionRecord.repository.repositoryPath, {
            recordId: sessionRecord.id,
            kind: 'executive_session',
            subtitle: sessionRecord.session?.linkedKrcId,
            highlighted: anchorRecord.kind === 'executive_session',
          }),
        ]
      : [],
    'No executive session indexed for this KRC.',
  );

  const relatedSourcesSection = section(
    'relatedSources',
    'Related Sources',
    relatedSources.map((record) =>
      link(record.conversation?.title ?? record.repository.krcId ?? record.repository.repositoryPath, record.repository.repositoryPath, {
        recordId: record.id,
        kind: 'source',
        subtitle: record.repository.krcId,
      }),
    ),
    'No related sources found.',
  );

  const timelineSteps: EvidenceTimelineStep[] = [];

  timelineSteps.push({
    kind: 'conversation',
    label: title,
    subtitle: krcId,
    timestamp: conversationRecord?.conversation?.updated ?? conversationRecord?.conversation?.created,
    explorerPath: sourcePath,
    recordId: conversationRecord?.id,
  });

  if (sessionRecord) {
    timelineSteps.push({
      kind: 'executive_session',
      label: sessionRecord.conversation?.title ?? 'Executive Session',
      subtitle: sessionRecord.session?.linkedKrcId,
      timestamp: sessionRecord.conversation?.created,
      explorerPath: sessionRecord.repository.repositoryPath,
      recordId: sessionRecord.id,
    });
  }

  timelineSteps.push({
    kind: 'related_sources',
    label:
      relatedSources.length > 0
        ? `${relatedSources.length} related source${relatedSources.length === 1 ? '' : 's'}`
        : 'No related sources',
    subtitle: relatedSources
      .slice(0, 3)
      .map((record) => record.repository.krcId)
      .filter(Boolean)
      .join(', '),
    explorerPath: relatedSources[0]?.repository.repositoryPath ?? sourcePath,
    recordId: relatedSources[0]?.id,
  });

  if (newest) {
    const newestLabel =
      newest.record.kind === 'message'
        ? `${newest.record.message?.role}: ${newest.record.excerpt}`
        : newest.record.attachment?.filename ?? newest.record.excerpt;
    timelineSteps.push({
      kind: 'newest_evidence',
      label: newestLabel,
      timestamp: newest.timestamp || undefined,
      explorerPath: sourcePath,
      recordId: newest.record.id,
    });
  } else {
    timelineSteps.push({
      kind: 'newest_evidence',
      label: anchorRecord.excerpt || title,
      timestamp: conversationRecord?.conversation?.updated,
      explorerPath: sourcePath,
      recordId: anchorRecord.id,
    });
  }

  const timelineSection = section(
    'timeline',
    'Timeline',
    timelineSteps.map((step) =>
      link(step.label, step.explorerPath, {
        recordId: step.recordId,
        subtitle: [step.subtitle, step.timestamp].filter(Boolean).join(' · '),
      }),
    ),
  );

  return {
    anchorRecordId: recordId,
    anchorKrcId: krcId,
    anchorSourcePath: sourcePath,
    query,
    decisionSummary,
    sections: {
      decisionSummary: section('decisionSummary', 'Decision Summary', [
        link(decisionSummary, sourcePath, { highlighted: true }),
      ]),
      sourceFile,
      conversation,
      messages,
      attachments,
      executiveSession,
      relatedSources: relatedSourcesSection,
      timeline: timelineSection,
    },
    timeline: timelineSteps,
  };
}

/** Resolves an evidence drilldown chain for a search hit record. */
export async function getEvidenceDrilldown(
  repositoryPath: string,
  recordId: string,
  query?: string,
): Promise<EvidenceDrilldown | null> {
  const index = await ensureEvidenceIndex(repositoryPath);
  return resolveEvidenceDrilldown(index, recordId, query);
}
