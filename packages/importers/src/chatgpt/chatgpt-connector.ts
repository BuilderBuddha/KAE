import type {
  DiscoveredSource,
  ExtractedContent,
  FileReference,
  KnowledgeConnector,
  NormalizedDocument,
} from '@scooper/core';
import { extractChatGptZip } from './extract-zip.js';
import { parseConversationsJson } from './parse-conversations.js';
import { conversationToDocument } from './conversation-document.js';

/** ChatGPT export connector — reference implementation for KAE. */
export class ChatGptConnector implements KnowledgeConnector {
  readonly id = 'chatgpt-export-zip';
  readonly name = 'ChatGPT Connector';
  readonly description =
    'Acquire knowledge from ChatGPT data export archives (conversations.json + uploads).';
  readonly supportedExtensions = ['.zip'] as const;

  canHandle(file: FileReference): boolean {
    return file.extension?.toLowerCase() === '.zip';
  }

  async discover(source: FileReference): Promise<DiscoveredSource> {
    return {
      connectorId: this.id,
      source,
      format: 'chatgpt-export-zip',
      metadata: {
        fileName: source.name,
      },
    };
  }

  async extract(discovered: DiscoveredSource): Promise<ExtractedContent> {
    const extracted = extractChatGptZip(discovered.source.path, { loadAssetData: false });
    const conversations = parseConversationsJson(extracted.conversationsJson);

    return {
      connectorId: this.id,
      source: discovered.source,
      rawDocuments: conversations,
      assets: extracted.assets.map((a) => ({
        path: a.zipPath,
        fileName: a.fileName,
        dataBase64: a.data?.toString('base64'),
      })),
      metadata: {
        conversationsPath: extracted.conversationsPath,
        conversationCount: conversations.length,
      },
    };
  }

  async normalize(extracted: ExtractedContent): Promise<NormalizedDocument[]> {
    const assets = extracted.assets.map((a) => ({
      zipPath: a.path,
      fileName: a.fileName,
      data: Buffer.from(a.dataBase64 ?? '', 'base64'),
    }));

    const assetList = assets.map((a) => ({ zipPath: a.zipPath, fileName: a.fileName }));

    return (extracted.rawDocuments as Parameters<typeof conversationToDocument>[0][]).map(
      (conv, index) => {
        const doc = conversationToDocument(conv, assets, {
          validationMode: true,
          sharedAssetList: index === 0 ? assetList : undefined,
        });
        return {
          id: doc.id,
          title: doc.title,
          content: doc.content,
          format: doc.format,
          metadata: doc.metadata,
        };
      },
    );
  }
}

export const chatGptConnector = new ChatGptConnector();
