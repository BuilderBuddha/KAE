/** Vigsy-style thinking pulse before text delivery (~1 second). */
export const BRIEFING_THINKING_PULSE_MS = 1000;

/** Brief gap between lines when skipping the thinking pulse. */
export const BRIEFING_SEGMENT_GAP_MS = 280;

/** Thinking pulse on segments 0, 3, 6, … — not every line. */
export function shouldShowThinkingPulse(segmentIndex: number): boolean {
  return segmentIndex % 3 === 0;
}

/** Natural thinking pause before a briefing line appears (non-pulse segments). */
export function briefingThinkingMs(lineIndex: number, textLength: number): number {
  if (shouldShowThinkingPulse(lineIndex)) {
    return BRIEFING_THINKING_PULSE_MS;
  }
  const readAhead = Math.min(textLength * 4, 400);
  const jitter = Math.floor(Math.random() * 120);
  return BRIEFING_SEGMENT_GAP_MS + readAhead + jitter;
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
  let delay = 20 + Math.floor(Math.random() * 8);
  if (char === ' ' || char === ',') delay += 22;
  if (char === '.' || char === '?' || char === '!') delay += 90;
  if (index > 0 && index % 14 === 0) delay += 32;
  return delay;
}
