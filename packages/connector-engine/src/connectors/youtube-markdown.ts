import type { ParsedDocument } from '@scooper/core';
import type { YouTubeVideoPayload } from './youtube-fetch.js';

export function buildYouTubeDocument(payload: YouTubeVideoPayload): ParsedDocument {
  const sourceKey = `youtube:${payload.videoId}`;
  const lines = [
    `# ${payload.title}`,
    '',
    '## Source',
    'YouTube',
    '',
    '## Video ID',
    payload.videoId,
    '',
    '## Channel',
    payload.channelTitle ?? 'Unknown',
    '',
    '## Publish Date',
    payload.publishDate ?? 'Unknown',
    '',
    '## Duration',
    payload.duration ?? 'Unknown',
    '',
    '## Thumbnail',
    payload.thumbnailUrl,
    '',
    '## Description',
    payload.description || 'No description available.',
    '',
    '## Transcript',
    payload.transcript || 'No transcript available.',
    '',
    '## Captions',
    payload.captionsAvailable ? 'Available' : 'Unavailable',
    '',
    '## ChatGPT Conversation ID',
    sourceKey,
  ];

  return {
    id: sourceKey,
    title: payload.title,
    content: lines.join('\n'),
    format: 'youtube',
    metadata: {
      conversationId: sourceKey,
      sourceKey,
      connectorId: 'youtube',
      videoId: payload.videoId,
      thumbnailUrl: payload.thumbnailUrl,
      publishDate: payload.publishDate,
      duration: payload.duration,
      channelTitle: payload.channelTitle,
      captionsAvailable: payload.captionsAvailable,
      messageCount: 1,
      ...payload.metadata,
    },
  };
}
