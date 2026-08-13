import type { ParsedDocument } from '@scooper/core';
import { buildCanonicalYouTubeWatchUrl, isValidYouTubeVideoId } from '@scooper/core';
import type { YouTubeCaptionStatus, YouTubeVideoPayload } from './youtube-fetch.js';

function resolveCaptionStatus(payload: YouTubeVideoPayload): YouTubeCaptionStatus {
  if (payload.captionStatus) return payload.captionStatus;
  // Backward-compatible mock payloads that only set captionsAvailable.
  return payload.captionsAvailable ? 'acquired' : 'unavailable';
}

function captionsLabel(status: YouTubeCaptionStatus): string {
  switch (status) {
    case 'acquired':
      return 'Acquired';
    case 'unavailable':
      return 'Unavailable';
    case 'failed':
      return 'Failed';
  }
}

export function buildYouTubeDocument(payload: YouTubeVideoPayload): ParsedDocument {
  const sourceKey = `youtube:${payload.videoId}`;
  const captionStatus = resolveCaptionStatus(payload);
  const captionsAvailable = captionStatus === 'acquired' && Boolean(payload.transcript.trim());
  const transcript = captionsAvailable ? payload.transcript.trim() : '';
  const description = payload.description || 'No description available.';

  const lines = [
    `# ${payload.title}`,
    '',
    '## Source',
    'YouTube',
    '',
    '## YouTube Video ID',
    isValidYouTubeVideoId(payload.videoId) ? payload.videoId : 'Unknown',
    '',
    '## Original Source URL',
    buildCanonicalYouTubeWatchUrl(payload.videoId) ?? 'Unavailable — invalid video ID',
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
    description,
    '',
    '## Captions',
    captionsLabel(captionStatus),
  ];

  // Emit Transcript only from successfully acquired caption content.
  if (transcript) {
    lines.push('', '## Transcript', transcript);
  }

  // Internal dedup identity — never labeled as a ChatGPT Conversation ID.
  lines.push('', '## Source Key', sourceKey);

  return {
    id: sourceKey,
    title: payload.title,
    content: lines.join('\n'),
    format: 'youtube',
    metadata: {
      ...payload.metadata,
      watchUrl: buildCanonicalYouTubeWatchUrl(payload.videoId) ?? payload.metadata?.watchUrl,
      conversationId: sourceKey,
      sourceKey,
      connectorId: 'youtube',
      videoId: payload.videoId,
      thumbnailUrl: payload.thumbnailUrl,
      publishDate: payload.publishDate,
      duration: payload.duration,
      channelTitle: payload.channelTitle,
      description,
      messageCount: 1,
      captionsAvailable,
      captionStatus,
      hasTranscriptTimestamps: captionsAvailable ? Boolean(payload.hasTranscriptTimestamps) : false,
      ...(transcript ? { transcript } : {}),
      ...(payload.captionDetail ? { captionDetail: payload.captionDetail } : {}),
    },
  };
}
