/** Natural pacing delay before Vigsy begins streaming (ported from VIGS presence timing). */
export function presenceDelayMs(instant = false): number {
  return instant ? 48 : 400 + Math.floor(Math.random() * 301);
}

/** Delay before KayD begins briefing when a workspace tab opens (1.5–2s). */
export function briefingTabStartDelayMs(): number {
  return 1500 + Math.floor(Math.random() * 501);
}

/** Pause between briefing lines while KayD appears to think. */
export function briefingLineThinkingDelayMs(): number {
  return 750 + Math.floor(Math.random() * 451);
}

/** Short gap between lines when KayD skips the thinking indicator. */
export function briefingBetweenLinesDelayMs(): number {
  return 350 + Math.floor(Math.random() * 151);
}

/** Pause after a line finishes streaming so the user can read it. */
export function briefingReadPauseMs(text: string): number {
  const base = 1400;
  const perChar = 14;
  return Math.min(3200, base + text.length * perChar);
}

/** Character delay for workspace briefing stream (slower than live chat). */
export const BRIEFING_CHAR_DELAY_MS = 42;

/** Streams text character-by-character with jitter (VIGS Founder Beta pacing). */
export async function streamTextReveal(
  fullText: string,
  onChunk: (visible: string) => void,
  charDelayMs = 26,
): Promise<void> {
  if (!fullText) {
    onChunk('');
    return;
  }

  let index = 0;
  while (index < fullText.length) {
    index += 1;
    onChunk(fullText.slice(0, index));
    const jitter = Math.floor(Math.random() * 14);
    await new Promise((resolve) => window.setTimeout(resolve, charDelayMs + jitter));
  }
}

/** @deprecated Use streamTextReveal for Founder Beta parity pacing. */
export async function streamText(
  fullText: string,
  onChunk: (visible: string) => void,
  chunkSize = 3,
  delayMs = 12,
): Promise<void> {
  if (!fullText) {
    onChunk('');
    return;
  }

  let index = 0;
  while (index < fullText.length) {
    index = Math.min(fullText.length, index + chunkSize);
    onChunk(fullText.slice(0, index));
    await new Promise((resolve) => window.setTimeout(resolve, delayMs));
  }
}
