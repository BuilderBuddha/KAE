import type {
  ConnectorChangeDetection,
  ConnectorSyncContext,
  FileReference,
  ParsedDocument,
} from '@scooper/core';
import { BaseConnector } from './base.js';
import {
  parseYouTubeTarget,
  resolveVideoIds,
  fetchYouTubeVideo,
  type YouTubeVideoPayload,
} from './youtube-fetch.js';
import { buildYouTubeDocument } from './youtube-markdown.js';

function mockVideosFromSettings(settings: Record<string, unknown>): YouTubeVideoPayload[] {
  const mockVideos = settings.mockVideos;
  return Array.isArray(mockVideos) ? (mockVideos as YouTubeVideoPayload[]) : [];
}

function changeKeysFromContext(context: ConnectorSyncContext): Set<string> | null {
  const keys = context.config.settings.__changeKeys;
  return Array.isArray(keys) ? new Set(keys.map(String)) : null;
}

/** YouTube connector — video, playlist, and channel acquisition. */
export class YouTubeConnector extends BaseConnector {
  readonly id = 'youtube';
  readonly name = 'YouTube Connector';
  readonly description =
    'Acquire video metadata, transcripts, and captions from YouTube videos, playlists, and channels.';
  readonly supportedExtensions = [] as const;
  readonly capabilities = {
    implementationStatus: 'full' as const,
    supportsScheduledSync: true,
    supportsOAuth: false,
    supportsApiKey: false,
    supportsFilePicker: false,
    supportsUrlInput: true,
    supportsFolderPicker: false,
    acquisitionModes: ['video', 'playlist', 'channel'] as const,
  };

  getDefaultConfig() {
    return {
      connectorId: this.id,
      enabled: false,
      connected: false,
      scheduledSyncEnabled: false,
      settings: {
        targetUrl: '',
        maxVideos: 5,
      },
    };
  }

  async discover(source: FileReference) {
    return {
      connectorId: this.id,
      source,
      format: 'youtube',
      metadata: { targetUrl: source.path },
    };
  }

  async extract(_discovered: import('@scooper/core').DiscoveredSource): Promise<import('@scooper/core').ExtractedContent> {
    throw new Error('YouTube connector uses syncInternal.');
  }

  async normalize(_extracted: import('@scooper/core').ExtractedContent): Promise<import('@scooper/core').NormalizedDocument[]> {
    throw new Error('YouTube connector uses syncInternal.');
  }

  async syncInternal(
    _source: FileReference | null,
    context: ConnectorSyncContext,
  ): Promise<ParsedDocument[]> {
    const mockVideos = mockVideosFromSettings(context.config.settings);
    const changedKeys = changeKeysFromContext(context);
    if (mockVideos.length > 0) {
      return mockVideos
        .filter((video) => !changedKeys || changedKeys.has(`youtube:${video.videoId}`))
        .map((video) => buildYouTubeDocument(video));
    }

    const targetUrl = String(
      context.config.settings.targetUrl ?? context.config.settings.url ?? '',
    ).trim();
    if (!targetUrl) {
      throw new Error('YouTube connector requires a video, playlist, or channel URL.');
    }

    const target = parseYouTubeTarget(targetUrl);
    const maxVideos = Number(context.config.settings.maxVideos ?? 5);
    const videoIds = await resolveVideoIds(target, maxVideos, context);
    const documents: ParsedDocument[] = [];

    const filteredVideoIds = changedKeys
      ? videoIds.filter((videoId) => changedKeys.has(`youtube:${videoId}`))
      : videoIds;

    for (const videoId of filteredVideoIds) {
      context.log?.('info', `Acquiring YouTube video ${videoId}`);
      const payload = await fetchYouTubeVideo(videoId, context);
      documents.push(buildYouTubeDocument(payload));
      context.onProgress?.('extract', Math.round((documents.length / filteredVideoIds.length) * 100));
    }

    return documents;
  }

  async detectChanges(context: ConnectorSyncContext): Promise<ConnectorChangeDetection> {
    const checkedAt = new Date().toISOString();
    const mockVideos = mockVideosFromSettings(context.config.settings);
    if (mockVideos.length > 0) {
      const keys = mockVideos.map((video) => `youtube:${video.videoId}`);
      const cursor = mockVideos
        .map((video) => `${video.videoId}:${video.title}:${video.publishDate ?? ''}`)
        .join('|');
      return {
        connectorId: this.id,
        checkedAt,
        cursor,
        changeKeys: keys,
        summary: `Checked ${mockVideos.length} mock YouTube item(s)`,
      };
    }

    const targetUrl = String(
      context.config.settings.targetUrl ?? context.config.settings.url ?? '',
    ).trim();
    if (!targetUrl) {
      throw new Error('YouTube connector requires a video, playlist, or channel URL.');
    }
    const target = parseYouTubeTarget(targetUrl);
    const maxVideos = Number(context.config.settings.maxVideos ?? 5);
    const videoIds = await resolveVideoIds(target, maxVideos, context);
    const keys = videoIds.map((videoId) => `youtube:${videoId}`);
    return {
      connectorId: this.id,
      checkedAt,
      cursor: keys.join('|'),
      changeKeys: keys,
      summary: `Checked ${keys.length} YouTube item(s)`,
    };
  }
}

export const youtubeConnector = new YouTubeConnector();
