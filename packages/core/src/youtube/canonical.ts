/** Canonical YouTube URL helpers — deterministic, never from model free text. */

export const YOUTUBE_VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

export function isValidYouTubeVideoId(videoId: string | null | undefined): boolean {
  return typeof videoId === 'string' && YOUTUBE_VIDEO_ID_RE.test(videoId.trim());
}

/** Returns canonical watch URL or null when the video ID is invalid. */
export function buildCanonicalYouTubeWatchUrl(videoId: string | null | undefined): string | null {
  const id = typeof videoId === 'string' ? videoId.trim() : '';
  if (!isValidYouTubeVideoId(id)) return null;
  return `https://www.youtube.com/watch?v=${id}`;
}

/**
 * True only for the exact trusted form:
 * https://www.youtube.com/watch?v={11-char-id}
 * Rejects youtu.be, extras, embeds, and arbitrary hosts.
 */
export function isTrustedYouTubeWatchUrl(url: string | null | undefined): boolean {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  const match = trimmed.match(/^https:\/\/www\.youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})$/);
  return Boolean(match && isValidYouTubeVideoId(match[1]));
}

/** Extract validated video ID from a trusted watch URL, else null. */
export function videoIdFromTrustedYouTubeWatchUrl(url: string | null | undefined): string | null {
  if (!isTrustedYouTubeWatchUrl(url)) return null;
  return String(url).trim().slice('https://www.youtube.com/watch?v='.length);
}
