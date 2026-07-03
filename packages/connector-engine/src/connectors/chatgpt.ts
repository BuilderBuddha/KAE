import type {
  ConnectorConfig,
  ConnectorSyncContext,
  DiscoveredSource,
  ExtractedContent,
  FileReference,
  NormalizedDocument,
  ParsedDocument,
} from '@scooper/core';
import { BaseConnector } from './base.js';

async function core() {
  const mod = await import('@scooper/importers');
  return mod.chatGptConnector;
}

/** ChatGPT connector — ZIP export and session acquisition via connector architecture. */
export class ChatGptFrameworkConnector extends BaseConnector {
  readonly id = 'chatgpt-export-zip';
  readonly name = 'ChatGPT Connector';
  readonly description =
    'Acquire knowledge from ChatGPT data export archives (conversations.json + uploads).';
  readonly supportedExtensions = ['.zip'] as const;
  readonly capabilities = {
    implementationStatus: 'full' as const,
    supportsScheduledSync: true,
    supportsOAuth: false,
    supportsApiKey: false,
    supportsFilePicker: true,
    supportsUrlInput: false,
    supportsFolderPicker: false,
    acquisitionModes: ['zip-export', 'live-session'] as const,
  };

  getDefaultConfig(): ConnectorConfig {
    return {
      connectorId: this.id,
      enabled: false,
      connected: false,
      scheduledSyncEnabled: false,
      settings: {},
    };
  }

  canHandle(file: FileReference): boolean {
    return file.extension?.toLowerCase() === '.zip';
  }

  async discover(source: FileReference): Promise<DiscoveredSource> {
    return (await core()).discover(source);
  }

  async extract(discovered: DiscoveredSource): Promise<ExtractedContent> {
    return (await core()).extract(discovered);
  }

  async normalize(extracted: ExtractedContent): Promise<NormalizedDocument[]> {
    return (await core()).normalize(extracted);
  }

  async syncInternal(
    source: FileReference | null,
    context: ConnectorSyncContext,
  ): Promise<ParsedDocument[]> {
    if (!source) {
      throw new Error('ChatGPT sync requires a ZIP export file.');
    }
    const { runConnectorPipeline } = await import('../pipeline.js');
    const importPackage = await runConnectorPipeline(this, source, context);
    return importPackage.documents;
  }
}

export const chatGptFrameworkConnector = new ChatGptFrameworkConnector();
