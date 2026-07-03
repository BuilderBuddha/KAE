import path from 'node:path';
import type { EvidenceIndex, EvidenceIndexStats, EvidenceRecord } from '@scooper/core';
import { browseRepository, readRepositoryFile } from '../browse.js';
import {
  buildUploadAssetIndex,
  findLatestChatGptUploadDir,
  isChatGptImportSourceFileName,
  parseChatGptSourceMarkdown,
  resolveUploadRef,
} from '../chatgpt-source.js';
import { parseExecutiveSessionMarkdown } from './parse-session.js';
import { EVIDENCE_INDEX_VERSION, saveEvidenceIndex } from './persist.js';
import { tokenizeSearchTerms } from './tokenize.js';

function excerpt(text: string, max = 160): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, max);
}

function inferSourceType(fileName: string): string {
  if (isChatGptImportSourceFileName(fileName)) return 'chatgpt-import';
  if (fileName.startsWith('KRC-')) return 'krc-source';
  return 'markdown';
}

function countByKind(records: EvidenceRecord[]): EvidenceIndexStats {
  const stats: EvidenceIndexStats = {
    builtAt: new Date().toISOString(),
    recordCount: records.length,
    sources: 0,
    conversations: 0,
    messages: 0,
    attachments: 0,
    executiveSessions: 0,
  };

  for (const record of records) {
    switch (record.kind) {
      case 'source':
        stats.sources += 1;
        break;
      case 'conversation':
        stats.conversations += 1;
        break;
      case 'message':
        stats.messages += 1;
        break;
      case 'attachment':
        stats.attachments += 1;
        break;
      case 'executive_session':
        stats.executiveSessions += 1;
        break;
    }
  }

  return stats;
}

function indexChatGptSource(
  relativePath: string,
  content: string,
  uploadIndex: Map<string, string> | null,
  records: EvidenceRecord[],
): void {
  const parsed = parseChatGptSourceMarkdown(content);
  if (!parsed) return;

  const sourceType = inferSourceType(path.basename(relativePath));
  const repository = {
    krcId: parsed.krcId,
    repositoryPath: relativePath,
    category: 'sources',
    sourceType,
  };
  const conversation = {
    conversationId: parsed.conversationId,
    title: parsed.title,
    created: parsed.createTime,
    updated: parsed.updateTime,
  };

  records.push({
    id: `${parsed.krcId}:source`,
    kind: 'source',
    repository,
    conversation,
    excerpt: excerpt(parsed.description ?? parsed.title),
  });

  records.push({
    id: `${parsed.krcId}:conversation`,
    kind: 'conversation',
    repository,
    conversation,
    excerpt: excerpt(parsed.title),
  });

  const attachmentRefs = new Set<string>(parsed.fileReferences);
  const messageAttachmentLinks = new Map<string, string[]>();

  parsed.messages.forEach((message, index) => {
    const messageId = `${parsed.krcId}:msg:${index}`;
    const searchTerms = tokenizeSearchTerms(message.text);
    messageAttachmentLinks.set(messageId, message.fileReferences);

    records.push({
      id: messageId,
      kind: 'message',
      repository,
      conversation,
      message: {
        messageId,
        role: message.role,
        timestamp: message.timestamp,
        text: message.text,
        searchTerms,
      },
      excerpt: excerpt(message.text),
    });

    for (const ref of message.fileReferences) {
      attachmentRefs.add(ref);
    }
  });

  for (const ref of attachmentRefs) {
    const attachmentId = `${parsed.krcId}:att:${ref}`;
    const assetPath = uploadIndex ? resolveUploadRef(ref, uploadIndex) : null;
    const filename = path.basename(ref);
    let linkedMessageId: string | undefined;
    for (const [messageId, refs] of messageAttachmentLinks.entries()) {
      if (refs.includes(ref)) {
        linkedMessageId = messageId;
        break;
      }
    }

    records.push({
      id: attachmentId,
      kind: 'attachment',
      repository,
      conversation,
      attachment: {
        attachmentId,
        filename,
        assetPath: assetPath ?? undefined,
        linkedMessageId,
        resolved: Boolean(assetPath),
      },
      excerpt: filename,
    });
  }
}

function indexGenericSource(
  relativePath: string,
  content: string,
  records: EvidenceRecord[],
): void {
  const fileName = path.basename(relativePath);
  const titleMatch = content.match(/^#\s*(KRC-\d{4})?\s*[—–-]?\s*(.+)$/m);
  const krcId = titleMatch?.[1];
  const title = titleMatch?.[2]?.trim() ?? fileName.replace(/\.md$/i, '');

  records.push({
    id: `${relativePath}:source`,
    kind: 'source',
    repository: {
      krcId,
      repositoryPath: relativePath,
      category: 'sources',
      sourceType: inferSourceType(fileName),
    },
    conversation: { title },
    excerpt: excerpt(content),
  });
}

function indexExecutiveSession(
  relativePath: string,
  content: string,
  records: EvidenceRecord[],
): void {
  const parsed = parseExecutiveSessionMarkdown(content, path.basename(relativePath));
  if (!parsed) return;

  const summaryText = [parsed.summaryText, ...parsed.summaryReferences].join('\n');
  records.push({
    id: `${relativePath}:session`,
    kind: 'executive_session',
    repository: {
      krcId: parsed.linkedKrcId,
      repositoryPath: relativePath,
      category: 'sessions',
      sourceType: 'executive-session',
    },
    conversation: {
      title: parsed.title,
      created: parsed.sessionDate,
    },
    session: {
      sessionId: parsed.sessionId,
      linkedKrcId: parsed.linkedKrcId,
      summaryReferences: parsed.summaryReferences,
      transcriptReference: parsed.transcriptReference,
    },
    excerpt: excerpt(summaryText || parsed.title),
  });
}

/** Builds the canonical evidence index for a repository. */
export async function buildEvidenceIndex(repositoryPath: string): Promise<EvidenceIndex> {
  const files = await browseRepository(repositoryPath);
  const records: EvidenceRecord[] = [];

  const uploadDir = await findLatestChatGptUploadDir(repositoryPath);
  const uploadIndex = uploadDir
    ? await buildUploadAssetIndex(repositoryPath, uploadDir)
    : null;

  for (const file of files) {
    if (!file.relativePath.endsWith('.md')) continue;
    if (file.category !== 'sources' && file.category !== 'sessions') continue;

    let content: string;
    try {
      content = await readRepositoryFile(repositoryPath, file.relativePath);
    } catch {
      continue;
    }

    if (file.category === 'sessions') {
      indexExecutiveSession(file.relativePath, content, records);
      continue;
    }

    const parsedChatGpt = parseChatGptSourceMarkdown(content);
    if (parsedChatGpt) {
      indexChatGptSource(file.relativePath, content, uploadIndex, records);
    } else {
      indexGenericSource(file.relativePath, content, records);
    }
  }

  const builtAt = new Date().toISOString();
  const index: EvidenceIndex = {
    version: EVIDENCE_INDEX_VERSION,
    repositoryPath,
    builtAt,
    recordCount: records.length,
    records,
  };

  await saveEvidenceIndex(repositoryPath, index);
  return index;
}

/** Returns summary stats for a built evidence index. */
export function summarizeEvidenceIndex(index: EvidenceIndex): EvidenceIndexStats {
  const stats = countByKind(index.records);
  stats.builtAt = index.builtAt;
  return stats;
}
