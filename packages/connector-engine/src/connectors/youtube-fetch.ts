export interface YouTubeTarget {
  kind: 'video' | 'playlist' | 'channel';
  videoId?: string;
  playlistId?: string;
  channelId?: string;
  url: string;
}

export interface YouTubeVideoPayload {
  videoId: string;
  title: string;
  description: string;
  transcript: string;
  thumbnailUrl: string;
  publishDate?: string;
  duration?: string;
  channelTitle?: string;
  captionsAvailable: boolean;
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

function parseTimedTextXml(xml: string): string {
  const lines = [...xml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)].map((match) =>
    decodeEntities(match[1].replace(/\n/g, ' ').trim()),
  );
  return lines.filter(Boolean).join('\n');
}

export async function fetchYouTubeTranscript(videoId: string): Promise<string> {
  try {
    const listXml = await fetchText(
      `https://www.youtube.com/api/timedtext?type=list&v=${videoId}`,
    );
    const langMatch = listXml.match(/lang_code="([^"]+)"/);
    const lang = langMatch?.[1] ?? 'en';
    const transcriptXml = await fetchText(
      `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}`,
    );
    const transcript = parseTimedTextXml(transcriptXml);
    if (transcript.trim()) return transcript;
  } catch {
    // fall through to description-only transcript
  }
  return '';
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

  const transcript = await fetchYouTubeTranscript(videoId);
  const captionsAvailable = transcript.length > 0;

  return {
    videoId,
    title: oEmbed.title,
    description,
    transcript: transcript || description,
    thumbnailUrl: oEmbed.thumbnail_url ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    publishDate,
    duration,
    channelTitle: oEmbed.author_name,
    captionsAvailable,
    metadata: {
      watchUrl,
      connectorId: 'youtube',
    },
  };
}
