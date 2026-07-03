import { useEffect, useState } from 'react';
import { ThinkingIndicator } from './CognitionPulse';
import { useStreamReveal } from '../../hooks/useStreamReveal';
import { presenceDelayMs } from '../../utils/vigsy-stream';

type Phase = 'thinking' | 'streaming' | 'fading';

/**
 * Single-slot briefing: one line visible at a time inside the chat panel.
 * Each line streams in, pauses, fades out, then the next line begins.
 */
export function KaydProgressiveBriefing({
  messages,
  onComplete,
}: {
  messages: string[];
  onComplete?: () => void;
}) {
  const [lineIndex, setLineIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('thinking');

  const activeLine = messages[lineIndex] ?? '';
  const streaming = phase === 'streaming' && lineIndex < messages.length;
  const { revealed, done } = useStreamReveal(activeLine, streaming);
  const finished = lineIndex >= messages.length;

  useEffect(() => {
    setLineIndex(0);
    setPhase(messages.length > 0 ? 'thinking' : 'streaming');
  }, [messages]);

  useEffect(() => {
    if (lineIndex >= messages.length || phase !== 'thinking') return undefined;
    const timer = window.setTimeout(() => setPhase('streaming'), presenceDelayMs(lineIndex === 0));
    return () => window.clearTimeout(timer);
  }, [phase, lineIndex, messages.length]);

  useEffect(() => {
    if (lineIndex >= messages.length || phase !== 'streaming' || !done) return undefined;
    const timer = window.setTimeout(() => setPhase('fading'), presenceDelayMs());
    return () => window.clearTimeout(timer);
  }, [phase, done, lineIndex, messages.length]);

  useEffect(() => {
    if (phase !== 'fading') return undefined;
    const timer = window.setTimeout(() => {
      if (lineIndex + 1 < messages.length) {
        setLineIndex((prev) => prev + 1);
        setPhase('thinking');
      } else {
        setLineIndex(messages.length);
        setPhase('streaming');
      }
    }, 280);
    return () => window.clearTimeout(timer);
  }, [phase, lineIndex, messages.length]);

  useEffect(() => {
    if (finished && messages.length > 0) {
      onComplete?.();
    }
  }, [finished, messages.length, onComplete]);

  if (finished) {
    return (
      <p className="kayd-chat__line kayd-chat__line--idle muted">
        What would you like to work on today?
      </p>
    );
  }

  if (phase === 'thinking') {
    return (
      <div className="kayd-chat__line kayd-chat__line--thinking" aria-live="polite">
        <ThinkingIndicator label="KayD is thinking…" />
      </div>
    );
  }

  return (
    <p
      className={`kayd-chat__line${phase === 'fading' ? ' kayd-chat__line--fade' : ''}${streaming && !done ? ' kayd-chat__line--streaming' : ''}`}
      aria-live="polite"
    >
      {revealed}
      {streaming && !done ? <span className="vigsy-cursor" aria-hidden /> : null}
    </p>
  );
}
