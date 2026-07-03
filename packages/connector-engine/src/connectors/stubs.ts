import type { Connector, ConnectorConfig } from '@scooper/core';
import { BaseConnector } from './base.js';

function stubConnector(
  id: string,
  name: string,
  description: string,
  acquisitionModes: string[],
): Connector {
  class StubConnector extends BaseConnector {
    readonly id = id;
    readonly name = name;
    readonly description = description;
    readonly supportedExtensions = [] as const;
    readonly capabilities = {
      implementationStatus: 'stub' as const,
      supportsScheduledSync: true,
      supportsOAuth: id.includes('drive') || id === 'notion',
      supportsApiKey: true,
      supportsFilePicker: false,
      supportsUrlInput: true,
      supportsFolderPicker: id === 'obsidian',
      acquisitionModes,
    };

    getDefaultConfig(): ConnectorConfig {
      return {
        connectorId: id,
        enabled: false,
        connected: false,
        scheduledSyncEnabled: false,
        settings: {},
      };
    }

    async discover(_source: import('@scooper/core').FileReference): Promise<import('@scooper/core').DiscoveredSource> {
      throw new Error(`${name} is API-ready but not yet implemented.`);
    }

    async extract(_discovered: import('@scooper/core').DiscoveredSource): Promise<import('@scooper/core').ExtractedContent> {
      throw new Error(`${name} is API-ready but not yet implemented.`);
    }

    async normalize(_extracted: import('@scooper/core').ExtractedContent): Promise<import('@scooper/core').NormalizedDocument[]> {
      throw new Error(`${name} is API-ready but not yet implemented.`);
    }

    async syncInternal(): Promise<import('@scooper/core').ParsedDocument[]> {
      throw new Error(`${name} is API-ready but not yet implemented.`);
    }

    async checkHealth() {
      return {
        connectorId: id,
        status: 'unavailable' as const,
        message: 'Stub connector — API-ready, awaiting implementation',
        lastCheckedAt: new Date().toISOString(),
      };
    }
  }

  return new StubConnector();
}

export const claudeConnector = stubConnector(
  'claude',
  'Claude Connector',
  'Acquire knowledge from Claude conversation exports.',
  ['export', 'session'],
);

export const cursorConnector = stubConnector(
  'cursor',
  'Cursor Connector',
  'Acquire knowledge from Cursor workspace sessions.',
  ['workspace', 'session'],
);

export const googleDriveConnector = stubConnector(
  'google-drive',
  'Google Drive Connector',
  'Acquire documents from Google Drive folders.',
  ['folder', 'file'],
);

export const oneDriveConnector = stubConnector(
  'onedrive',
  'OneDrive Connector',
  'Acquire documents from OneDrive folders.',
  ['folder', 'file'],
);

export const notionConnector = stubConnector(
  'notion',
  'Notion Connector',
  'Acquire pages and databases from Notion workspaces.',
  ['page', 'database'],
);

export const obsidianConnector = stubConnector(
  'obsidian',
  'Obsidian Connector',
  'Acquire vault notes from Obsidian.',
  ['vault'],
);

export const rssConnector = stubConnector(
  'rss',
  'RSS Connector',
  'Acquire feed entries from RSS/Atom sources.',
  ['feed'],
);

export const websitesConnector = stubConnector(
  'websites',
  'Websites Connector',
  'Acquire content from configured website URLs.',
  ['url', 'sitemap'],
);

export const podcastsConnector = stubConnector(
  'podcasts',
  'Podcasts Connector',
  'Acquire show notes and transcripts from podcast feeds.',
  ['feed', 'episode'],
);

export const stubConnectors = [
  claudeConnector,
  cursorConnector,
  googleDriveConnector,
  oneDriveConnector,
  notionConnector,
  obsidianConnector,
  rssConnector,
  websitesConnector,
  podcastsConnector,
];
