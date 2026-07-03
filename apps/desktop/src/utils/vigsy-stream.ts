/** Natural pacing delay before Vigsy begins streaming (ported from VIGS presence timing). */
export function presenceDelayMs(instant = false): number {
  return instant ? 48 : 400 + Math.floor(Math.random() * 301);
}

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
