import {
  buildCanonicalYouTubeWatchUrl,
  isValidYouTubeVideoId,
  type EvidenceYouTubeFields,
} from '@scooper/core';

export interface ParsedYouTubeSourceMarkdown {
  krcId: string;
  title: string;
  videoId: string;
  sourceKey: string;
  originalSourceUrl: string;
  channel?: string;
  publishDate?: string;
  duration?: string;
  description?: string;
  captionStatus: string;
  transcript?: string;
}

function sectionValue(content: string, heading: string): string | undefined {
  const regex = new RegExp(`## ${heading}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`, 'i');
  const match = content.match(regex);
  return match?.[1]?.trim() || undefined;
}

/** Detect native YouTube KRC markdown (Checkpoint B+). */
export function isYouTubeSourceMarkdown(content: string): boolean {
  const source = sectionValue(content, 'Source');
  if (source === 'YouTube') return true;
  const sourceKey = sectionValue(content, 'Source Key');
  return Boolean(sourceKey?.startsWith('youtube:'));
}

/**
 * Parse Checkpoint B/C YouTube source markdown.
 * Returns null when not YouTube-shaped or video ID is invalid.
 */
export function parseYouTubeSourceMarkdown(content: string): ParsedYouTubeSourceMarkdown | null {
  if (!isYouTubeSourceMarkdown(content)) return null;

  const titleMatch = content.match(/^#\s*(KRC-\d{4})\s*[—–-]\s*(.+)$/m);
  const krcId = titleMatch?.[1]?.toUpperCase();
  const title = titleMatch?.[2]?.trim();
  if (!krcId || !title) return null;

  const videoIdRaw = sectionValue(content, 'YouTube Video ID') ?? '';
  const videoId = videoIdRaw.trim();
  if (!isValidYouTubeVideoId(videoId)) return null;

  const trustedUrl = buildCanonicalYouTubeWatchUrl(videoId);
  if (!trustedUrl) return null;

  // Prefer deterministic derived URL; ignore non-matching persisted URLs.
  const persistedUrl = sectionValue(content, 'Original Source URL');
  const finalUrl =
    persistedUrl && persistedUrl === trustedUrl ? persistedUrl : trustedUrl;

  const sourceKey =
    sectionValue(content, 'Source Key')?.trim() || `youtube:${videoId}`;
  if (sourceKey !== `youtube:${videoId}`) {
    // Identity must match video ID.
    return null;
  }

  const captionStatus = (sectionValue(content, 'Captions') ?? 'Unknown').trim().toLowerCase();
  const transcriptSection = sectionValue(content, 'Transcript');
  const transcript =
    captionStatus === 'acquired' && transcriptSection?.trim()
      ? transcriptSection.trim()
      : undefined;

  return {
    krcId,
    title,
    videoId,
    sourceKey,
    originalSourceUrl: finalUrl,
    channel: sectionValue(content, 'Channel'),
    publishDate: sectionValue(content, 'Publish Date'),
    duration: sectionValue(content, 'Duration'),
    description: sectionValue(content, 'Description'),
    captionStatus: sectionValue(content, 'Captions') ?? 'Unknown',
    transcript,
  };
}

/** First valid [m:ss] / [mm:ss] timestamp from acquired caption lines, else undefined. */
export function firstTranscriptTimestampSeconds(transcript: string): number | undefined {
  const match = transcript.match(/\[(\d{1,2}):([0-5]\d)\]/);
  if (!match) return undefined;
  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return undefined;
  return minutes * 60 + seconds;
}

export function youtubeFieldsFromParsed(
  parsed: ParsedYouTubeSourceMarkdown,
  extras?: Partial<EvidenceYouTubeFields>,
): EvidenceYouTubeFields {
  return {
    sourceType: 'youtube',
    sourceKey: parsed.sourceKey,
    videoId: parsed.videoId,
    originalSourceUrl: parsed.originalSourceUrl,
    captionStatus: parsed.captionStatus,
    ...extras,
  };
}
