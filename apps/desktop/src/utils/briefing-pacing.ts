/** Natural thinking pause before a briefing line appears. */
export function briefingThinkingMs(lineIndex: number, textLength: number): number {
  const base = lineIndex === 0 ? 520 : 280;
  const readAhead = Math.min(textLength * 6, 720);
  const jitter = Math.floor(Math.random() * 180);
  return base + readAhead + jitter;
}

/** How long a completed line stays visible before fading. */
export function briefingHoldMs(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.min(3800, Math.max(1400, words * 200));
}

/** Fade-out duration between lines. */
export const BRIEFING_FADE_MS = 420;

/** Gap after fade before the next thinking pulse. */
export const BRIEFING_BETWEEN_LINES_MS = 160;

/** Character reveal pacing for briefing lines. */
export function briefingCharDelayMs(char: string, index: number): number {
  let delay = 22 + Math.floor(Math.random() * 10);
  if (char === ' ' || char === ',') delay += 28;
  if (char === '.' || char === '?' || char === '!') delay += 120;
  if (index > 0 && index % 12 === 0) delay += 40;
  return delay;
}
