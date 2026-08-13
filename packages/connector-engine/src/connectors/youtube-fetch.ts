export interface YouTubeTarget {
  kind: 'video' | 'playlist' | 'channel';
  videoId?: string;
  playlistId?: string;
  channelId?: string;
  url: string;
}

/** Honest caption acquisition outcome — never collapse failure into unavailable. */
export type YouTubeCaptionStatus = 'acquired' | 'unavailable' | 'failed';

export interface YouTubeTranscriptSegment {
  text: string;
  /** Present only when upstream timedtext provides a valid start time. */
  startSeconds?: number;
}

export interface YouTubeCaptionAcquisition {
  status: YouTubeCaptionStatus;
  /** Non-empty only when status is acquired. Never holds description text. */
  transcript: string;
  segments: YouTubeTranscriptSegment[];
  hasTimestamps: boolean;
  detail?: string;
}

export interface YouTubeVideoPayload {
  videoId: string;
  title: string;
  description: string;
  /** Caption text only when captionStatus is acquired; otherwise empty. */
  transcript: string;
  thumbnailUrl: string;
  publishDate?: string;
  duration?: string;
  channelTitle?: string;
  /** True only when usable captions were actually acquired. */
  captionsAvailable: boolean;
  captionStatus: YouTubeCaptionStatus;
  /** True only when acquired segments included valid timing. */
  hasTranscriptTimestamps?: boolean;
  captionDetail?: string;
  metadata: Record<string, unknown>;
}

const VIDEO_ID_PATTERN =
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/;
const PLAYLIST_PATTERN = /[?&]list=([A-Za-z0-9_-]+)/;
const CHANNEL_PATTERN = /youtube\.com\/channel\/([A-Za-z0-9_-]+)/;

export function parseYouTubeTarget(url: string): YouTubeTarget {
  const videoMatch = url.match(VIDEO_ID_PATTERN);
  if (videoMatch) {
    return { kind: 'video', videoId: videoMatch[1], url };
  }
  const channelMatch = url.match(CHANNEL_PATTERN);
  if (channelMatch) {
    return { kind: 'channel', channelId: channelMatch[1], url };
  }
  const playlistMatch = url.match(PLAYLIST_PATTERN);
  if (playlistMatch) {
    return { kind: 'playlist', playlistId: playlistMatch[1], url };
  }
  throw new Error(`Unsupported YouTube URL: ${url}`);
}

async function fetchText(url: string, init?: RequestInit): Promise<string> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return response.text();
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return response.json() as Promise<T>;
}

export async function resolveVideoIds(
  target: YouTubeTarget,
  maxVideos: number,
  context?: { log?: (level: 'debug' | 'info' | 'warn' | 'error', message: string) => void },
): Promise<string[]> {
  if (target.kind === 'video' && target.videoId) {
    return [target.videoId];
  }

  if (target.kind === 'channel' && target.channelId) {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${target.channelId}`;
    context?.log?.('info', `Fetching channel feed: ${rssUrl}`);
    const xml = await fetchText(rssUrl);
    const ids = [...xml.matchAll(/<yt:videoId>([^<]+)<\/yt:videoId>/g)].map((m) => m[1]);
    return ids.slice(0, maxVideos);
  }

  if (target.kind === 'playlist' && target.playlistId) {
    const page = await fetchText(
      `https://www.youtube.com/playlist?list=${target.playlistId}`,
    );
    const ids = [
      ...new Set(
        [...page.matchAll(/"videoId":"([A-Za-z0-9_-]{11})"/g)].map((match) => match[1]),
      ),
    ];
    return ids.slice(0, maxVideos);
  }

  throw new Error('Could not resolve YouTube video IDs.');
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function formatTimestamp(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(whole / 60);
  const secs = whole % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

/** Parse timedtext XML into segments; retain start only when a valid numeric start attribute exists. */
export function parseTimedTextSegments(xml: string): YouTubeTranscriptSegment[] {
  const segments: YouTubeTranscriptSegment[] = [];
  for (const match of xml.matchAll(/<text([^>]*)>([\s\S]*?)<\/text>/g)) {
    const attrs = match[1] ?? '';
    const text = decodeEntities((match[2] ?? '').replace(/\n/g, ' ').trim());
    if (!text) continue;
    const startMatch = attrs.match(/\bstart="([0-9]*\.?[0-9]+)"/);
    const startSeconds = startMatch ? Number(startMatch[1]) : undefined;
    const segment: YouTubeTranscriptSegment = { text };
    if (typeof startSeconds === 'number' && Number.isFinite(startSeconds)) {
      segment.startSeconds = startSeconds;
    }
    segments.push(segment);
  }
  return segments;
}

export function formatTranscriptFromSegments(segments: YouTubeTranscriptSegment[]): {
  transcript: string;
  hasTimestamps: boolean;
} {
  const hasTimestamps = segments.some((segment) => typeof segment.startSeconds === 'number');
  if (!hasTimestamps) {
    return {
      transcript: segments.map((segment) => segment.text).join('\n'),
      hasTimestamps: false,
    };
  }
  const lines = segments.map((segment) => {
    if (typeof segment.startSeconds === 'number') {
      return `[${formatTimestamp(segment.startSeconds)}] ${segment.text}`;
    }
    return segment.text;
  });
  return { transcript: lines.join('\n'), hasTimestamps: true };
}

/** Successful track list with no lang_code → unavailable; otherwise return first lang. */
export function classifyCaptionTrackList(listXml: string): {
  outcome: 'unavailable' | 'has_track';
  lang?: string;
} {
  const langMatch = listXml.match(/lang_code="([^"]+)"/);
  if (!langMatch?.[1]) {
    return { outcome: 'unavailable' };
  }
  return { outcome: 'has_track', lang: langMatch[1] };
}

/**
 * Acquire captions with explicit status.
 * Never returns description text as transcript.
 */
export async function fetchYouTubeCaptionAcquisition(
  videoId: string,
): Promise<YouTubeCaptionAcquisition> {
  let listXml: string;
  try {
    listXml = await fetchText(
      `https://www.youtube.com/api/timedtext?type=list&v=${videoId}`,
    );
  } catch (error) {
    return {
      status: 'failed',
      transcript: '',
      segments: [],
      hasTimestamps: false,
      detail: `Caption track list request failed: ${String(error)}`,
    };
  }

  if (!listXml.trim()) {
    return {
      status: 'failed',
      transcript: '',
      segments: [],
      hasTimestamps: false,
      detail: 'Caption track list returned an empty response',
    };
  }

  const list = classifyCaptionTrackList(listXml);
  if (list.outcome === 'unavailable') {
    return {
      status: 'unavailable',
      transcript: '',
      segments: [],
      hasTimestamps: false,
      detail: 'No caption tracks listed for this video',
    };
  }

  const lang = list.lang ?? 'en';
  let transcriptXml: string;
  try {
    transcriptXml = await fetchText(
      `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}`,
    );
  } catch (error) {
    return {
      status: 'failed',
      transcript: '',
      segments: [],
      hasTimestamps: false,
      detail: `Caption track request failed: ${String(error)}`,
    };
  }

  if (!transcriptXml.trim()) {
    return {
      status: 'unavailable',
      transcript: '',
      segments: [],
      hasTimestamps: false,
      detail: 'Caption track returned no content',
    };
  }

  let segments: YouTubeTranscriptSegment[];
  try {
    segments = parseTimedTextSegments(transcriptXml);
  } catch (error) {
    return {
      status: 'failed',
      transcript: '',
      segments: [],
      hasTimestamps: false,
      detail: `Caption parse failed: ${String(error)}`,
    };
  }

  if (segments.length === 0) {
    if (/<text[\s>]/i.test(transcriptXml) || /<transcript/i.test(transcriptXml)) {
      return {
        status: 'unavailable',
        transcript: '',
        segments: [],
        hasTimestamps: false,
        detail: 'Caption track contained no usable text',
      };
    }
    return {
      status: 'failed',
      transcript: '',
      segments: [],
      hasTimestamps: false,
      detail: 'Unexpected caption track response',
    };
  }

  const formatted = formatTranscriptFromSegments(segments);
  return {
    status: 'acquired',
    transcript: formatted.transcript,
    segments,
    hasTimestamps: formatted.hasTimestamps,
  };
}

export async function fetchYouTubeVideo(
  videoId: string,
  context?: { log?: (level: 'debug' | 'info' | 'warn' | 'error', message: string) => void },
): Promise<YouTubeVideoPayload> {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const oEmbed = await fetchJson<{
    title: string;
    author_name?: string;
    thumbnail_url?: string;
  }>(`https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`);

  let description = '';
  let publishDate: string | undefined;
  let duration: string | undefined;
  try {
    const page = await fetchText(watchUrl);
    const descMatch = page.match(/"shortDescription":"((?:\\.|[^"\\])*)"/);
    if (descMatch) {
      description = JSON.parse(`"${descMatch[1]}"`) as string;
    }
    const dateMatch = page.match(/"publishDate":"([^"]+)"/);
    publishDate = dateMatch?.[1];
    const durationMatch = page.match(/"lengthSeconds":"(\d+)"/);
    if (durationMatch) {
      const seconds = Number(durationMatch[1]);
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      duration = `${mins}:${String(secs).padStart(2, '0')}`;
    }
  } catch (err) {
    context?.log?.('warn', `Could not parse watch page for ${videoId}: ${String(err)}`);
  }

  const captions = await fetchYouTubeCaptionAcquisition(videoId);
  if (captions.status !== 'acquired') {
    context?.log?.(
      captions.status === 'failed' ? 'warn' : 'info',
      `YouTube captions ${captions.status} for ${videoId}${captions.detail ? `: ${captions.detail}` : ''}`,
    );
  }

  return {
    videoId,
    title: oEmbed.title,
    description,
    // Never substitute description into transcript.
    transcript: captions.status === 'acquired' ? captions.transcript : '',
    thumbnailUrl: oEmbed.thumbnail_url ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    publishDate,
    duration,
    channelTitle: oEmbed.author_name,
    captionsAvailable: captions.status === 'acquired',
    captionStatus: captions.status,
    hasTranscriptTimestamps: captions.status === 'acquired' ? captions.hasTimestamps : false,
    captionDetail: captions.detail,
    metadata: {
      watchUrl,
      connectorId: 'youtube',
      captionStatus: captions.status,
      hasTranscriptTimestamps: captions.status === 'acquired' ? captions.hasTimestamps : false,
      ...(captions.detail ? { captionDetail: captions.detail } : {}),
    },
  };
}
