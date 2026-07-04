/** Vigsy-style thinking pulse before text delivery (~1 second). */
export const BRIEFING_THINKING_PULSE_MS = 1000;

/** Brief gap between lines when skipping the thinking pulse. */
export const BRIEFING_SEGMENT_GAP_MS = 340;

/** Thinking pulse on segments 0, 3, 6, … — not every line. */
export function shouldShowThinkingPulse(segmentIndex: number): boolean {
  return segmentIndex % 3 === 0;
}

/** Natural thinking pause before a briefing line appears (non-pulse segments). */
export function briefingThinkingMs(lineIndex: number, textLength: number): number {
  if (shouldShowThinkingPulse(lineIndex)) {
    return BRIEFING_THINKING_PULSE_MS;
  }
  const readAhead = Math.min(textLength * 3, 320);
  const jitter = Math.floor(Math.random() * 140);
  return BRIEFING_SEGMENT_GAP_MS + readAhead + jitter;
}

/** How long a completed line stays visible before fading. */
export function briefingHoldMs(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.min(4200, Math.max(1650, words * 215));
}

/** Fade-out duration between lines. */
export const BRIEFING_FADE_MS = 520;

/** Gap after fade before the next thinking pulse. */
export const BRIEFING_BETWEEN_LINES_MS = 200;

/** Character reveal pacing — natural composition rhythm. */
export function briefingCharDelayMs(char: string, index: number): number {
  let delay = 24 + Math.floor(Math.random() * 14);
  if (char === ' ') delay += 20 + Math.floor(Math.random() * 28);
  if (char === ',') delay += 48 + Math.floor(Math.random() * 32);
  if (char === '.' || char === '?' || char === '!') delay += 105 + Math.floor(Math.random() * 75);
  if (char === ':' || char === ';') delay += 52;
  if (index > 0 && index % 18 === 0) delay += 40 + Math.floor(Math.random() * 45);
  return delay;
}
