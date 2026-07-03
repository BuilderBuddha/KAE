import type { ConversationClassification, ParsedDocument } from '@scooper/core';
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

/** Builds a KRC source markdown file from a parsed document. */
export function buildSourceMarkdown(
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
