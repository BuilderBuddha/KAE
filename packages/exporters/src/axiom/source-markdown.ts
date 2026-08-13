import type { ConversationClassification, ParsedDocument } from '@scooper/core';
import { buildCanonicalYouTubeWatchUrl, isValidYouTubeVideoId } from '@scooper/core';
import { slugifyTitle } from './krc-utils.js';

function formatTimestamp(ts: unknown): string {
  if (typeof ts !== 'number') return 'Unknown';
  const ms = ts > 1e12 ? ts : ts * 1000;
  return new Date(ms).toISOString();
}

function deriveTopic(doc: ParsedDocument, classification: ConversationClassification): string {
  if (classification.uncertain) return 'Unclassified — review needed';
  const pastedCount = doc.metadata.pastedTranscriptCount;
  if (typeof pastedCount === 'number' && pastedCount > 0) {
    return 'Pasted source text / ChatGPT conversation';
  }
  return `${classification.primaryCategory} / ChatGPT conversation`;
}

function deriveYouTubeTopic(classification: ConversationClassification): string {
  if (classification.uncertain) return 'Unclassified — review needed';
  return `${classification.primaryCategory} / YouTube video`;
}

function buildAppliesTo(classification: ConversationClassification): string[] {
  const lines: string[] = [];
  const products = ['Axiom', 'Founder OS', 'VIGS'] as const;
  for (const product of products) {
    const match = classification.categories.some(
      (c) => c === product || (product === 'Founder OS' && c === 'Founder OS'),
    );
    lines.push(`- ${product}: ${match ? 'Yes' : 'Possible'}`);
  }
  return lines;
}

function captionsLabel(status: unknown): string {
  if (status === 'acquired') return 'Acquired';
  if (status === 'failed') return 'Failed';
  if (status === 'unavailable') return 'Unavailable';
  return 'Unknown';
}

/** Trusted YouTube discriminator — never inferred from free text alone. */
export function isYouTubeSourceDocument(doc: ParsedDocument): boolean {
  return doc.format === 'youtube' || doc.metadata.connectorId === 'youtube';
}

function buildYouTubeSourceMarkdown(
  krcId: string,
  doc: ParsedDocument,
  classification: ConversationClassification,
): string {
  const title = doc.title.trim() || 'Untitled YouTube Video';
  const videoId = String(doc.metadata.videoId ?? '').trim();
  const sourceKey = String(doc.metadata.sourceKey ?? doc.metadata.conversationId ?? doc.id);
  const importDate = new Date().toISOString().slice(0, 10);
  const captionStatus = doc.metadata.captionStatus;
  const captionsAvailable = doc.metadata.captionsAvailable === true;
  const description =
    typeof doc.metadata.description === 'string' && doc.metadata.description.trim()
      ? doc.metadata.description.trim()
      : 'No description available.';
  const transcript =
    captionsAvailable &&
    captionStatus === 'acquired' &&
    typeof doc.metadata.transcript === 'string' &&
    doc.metadata.transcript.trim()
      ? doc.metadata.transcript.trim()
      : '';

  const lines = [
    `# ${krcId} — ${title}`,
    '',
    '## Status',
    classification.uncertain ? 'Review Needed' : 'Inventoried',
    '',
    '## Topic',
    deriveYouTubeTopic(classification),
    '',
    '## Primary Product',
    classification.uncertain ? 'Review Needed' : classification.primaryCategory,
    '',
    '## Categories',
    ...classification.categories.map((c) => `- ${c}`),
    '',
    '## Inferred Project',
    classification.inferredProject,
    '',
    '## Classification Confidence',
    `${classification.confidence}%`,
    '',
    '## Classification Rationale',
    classification.rationale,
    '',
    '## Applies To',
    ...buildAppliesTo(classification),
    '',
    '## Source',
    'YouTube',
    '',
    '## YouTube Video ID',
    isValidYouTubeVideoId(videoId) ? videoId : 'Unknown',
    '',
    '## Original Source URL',
    buildCanonicalYouTubeWatchUrl(videoId) ?? 'Unavailable — invalid video ID',
    '',
    '## Channel',
    String(doc.metadata.channelTitle ?? 'Unknown'),
    '',
    '## Publish Date',
    String(doc.metadata.publishDate ?? 'Unknown'),
    '',
    '## Duration',
    String(doc.metadata.duration ?? 'Unknown'),
    '',
  ];

  if (doc.metadata.thumbnailUrl) {
    lines.push('## Thumbnail', String(doc.metadata.thumbnailUrl), '');
  }

  lines.push(
    '## Description',
    description,
    '',
    '## Captions',
    captionsLabel(captionStatus),
  );

  if (transcript) {
    lines.push('', '## Transcript', transcript);
  }

  lines.push(
    '',
    '## Source Key',
    sourceKey,
    '',
    '## Extraction Status',
    'Pending detailed capability extraction.',
    '',
    '## Notes',
    `Acquired by KAE from YouTube on ${importDate}. Auto-classified.`,
  );

  if (classification.recurringTerms.length > 0) {
    lines.push('', '## Recurring Terms', '');
    for (const term of classification.recurringTerms) {
      lines.push(`- ${term}`);
    }
  }

  return lines.join('\n');
}

function buildChatGptSourceMarkdown(
  krcId: string,
  doc: ParsedDocument,
  classification: ConversationClassification,
): string {
  const title = doc.title.trim() || 'Untitled Conversation';
  const conversationId = String(doc.metadata.conversationId ?? doc.id);
  const importDate = new Date().toISOString().slice(0, 10);
  const messageCount = doc.metadata.messageCount ?? 0;

  const lines = [
    `# ${krcId} — ${title}`,
    '',
    '## Status',
    classification.uncertain ? 'Review Needed' : 'Inventoried',
    '',
    '## Description',
    messageCount === 0
      ? 'Empty or unparseable ChatGPT conversation — preserved for review.'
      : `ChatGPT conversation acquired by KAE (${messageCount} messages).`,
    '',
    '## Topic',
    deriveTopic(doc, classification),
    '',
    '## Primary Product',
    classification.uncertain ? 'Review Needed' : classification.primaryCategory,
    '',
    '## Categories',
    ...classification.categories.map((c) => `- ${c}`),
    '',
    '## Inferred Project',
    classification.inferredProject,
    '',
    '## Classification Confidence',
    `${classification.confidence}%`,
    '',
    '## Classification Rationale',
    classification.rationale,
    '',
    '## Applies To',
    ...buildAppliesTo(classification),
    '',
    '## ChatGPT Conversation ID',
    conversationId,
    '',
    '## Create Time',
    formatTimestamp(doc.metadata.createTime),
    '',
    '## Update Time',
    formatTimestamp(doc.metadata.updateTime),
    '',
    '## Extraction Status',
    'Pending detailed capability extraction.',
    '',
    '## Notes',
    `Acquired by KAE from ChatGPT export on ${importDate}. Auto-classified.`,
    '',
    '## Transcript',
    '',
    doc.content.trim() || '_No extractable transcript content._',
  ];

  if (classification.recurringTerms.length > 0) {
    lines.push('', '## Recurring Terms', '');
    for (const term of classification.recurringTerms) {
      lines.push(`- ${term}`);
    }
  }

  const fileRefs = doc.metadata.fileReferences;
  if (Array.isArray(fileRefs) && fileRefs.length > 0) {
    lines.push('', '## File References', '');
    for (const ref of fileRefs) {
      if (typeof ref === 'string') lines.push(`- ${ref}`);
    }
  }

  return lines.join('\n');
}

/** Builds a KRC source markdown file from a parsed document. */
export function buildSourceMarkdown(
  krcId: string,
  doc: ParsedDocument,
  classification: ConversationClassification,
): string {
  if (isYouTubeSourceDocument(doc)) {
    return buildYouTubeSourceMarkdown(krcId, doc, classification);
  }
  return buildChatGptSourceMarkdown(krcId, doc, classification);
}

/** Builds the filename for a source record. */
export function buildSourceFilename(krcId: string, doc: ParsedDocument): string {
  return `${krcId}_${slugifyTitle(doc.title)}.md`;
}

/** Resolves the category subfolder for a classification. */
export function resolveCategoryFolder(classification: ConversationClassification): string {
  if (classification.uncertain || classification.primaryCategory === 'Other / Review Needed') {
    return 'Other_Review_Needed';
  }
  const folderMap: Record<string, string> = {
    VIGS: 'VIGS',
    'Founder OS': 'Founder_OS',
    Axiom: 'Axiom',
    Book: 'Book',
    'Knowledge Recovery': 'Knowledge_Recovery',
    'Source Material': 'Source_Material',
    'Technical Build': 'Technical_Build',
    'Other / Review Needed': 'Other_Review_Needed',
  };
  return folderMap[classification.primaryCategory] ?? 'Other_Review_Needed';
}
