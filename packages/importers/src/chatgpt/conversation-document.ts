import type { ParsedDocument } from '@scooper/core';
import { buildTranscriptMarkdown } from './parse-conversations.js';
import type { ParsedChatGptConversation, ZipAssetEntry } from './types.js';

export interface ConversationDocumentOptions {
  /** Skips embedding asset binary data — used during read-only validation. */
  validationMode?: boolean;
  /** Lightweight asset list attached only to the first document for upload counts. */
  sharedAssetList?: Array<{ zipPath: string; fileName: string }>;
}

export function conversationToDocument(
  conv: ParsedChatGptConversation,
  assets: ZipAssetEntry[],
  options: ConversationDocumentOptions = {},
): ParsedDocument {
  const { sharedAssetList } = options;
  const transcript = buildTranscriptMarkdown(conv.messages);
  const pastedSection =
    conv.pastedTranscripts.length > 0
      ? `\n\n## Pasted Source Text\n\n${conv.pastedTranscripts.join('\n\n---\n\n')}`
      : '';

  const relatedAssets = assets.filter(
    (a) =>
      conv.fileReferences.some((ref) => a.zipPath.includes(ref) || a.fileName.includes(ref)) ||
      conv.assetPaths.some((ref) => a.zipPath.includes(ref)),
  );

  const metadata: Record<string, unknown> = {
    conversationId: conv.conversationId,
    createTime: conv.createTime,
    updateTime: conv.updateTime,
    messageCount: conv.messages.length,
    userMessageCount: conv.messages.filter((m) => m.role === 'user').length,
    assistantMessageCount: conv.messages.filter((m) => m.role === 'assistant').length,
    pastedTranscriptCount: conv.pastedTranscripts.length,
    fileReferences: conv.fileReferences,
  };

  if (relatedAssets.length > 0) {
    metadata.assets = relatedAssets.map((a) => ({
      zipPath: a.zipPath,
      fileName: a.fileName,
    }));
  }

  if (sharedAssetList) {
    metadata.allZipAssets = sharedAssetList;
  }

  return {
    id: conv.conversationId,
    title: conv.title,
    content: `${transcript}${pastedSection}`,
    format: 'chatgpt-export-zip',
    metadata,
  };
}
