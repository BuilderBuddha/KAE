import { useEffect, useRef, useState } from 'react';
import { ThinkingIndicator } from './CognitionPulse';
import { KaydBriefingBubble } from './KaydBriefingBubble';
import { useStreamReveal } from '../../hooks/useStreamReveal';
import { presenceDelayMs } from '../../utils/vigsy-stream';

type Phase = 'thinking' | 'streaming' | 'hold' | 'fade';

/**
 * One briefing line at a time — streams in place, fades out, then the next line begins.
 */
export function KaydProgressiveBriefing({
  messages,
  onComplete,
}: {
  messages: string[];
  onComplete?: () => void;
}) {
  const [lineIndex, setLineIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>(messages.length > 0 ? 'thinking' : 'hold');
  const completedRef = useRef(false);

  const activeLine = messages[lineIndex] ?? '';
  const streaming = phase === 'streaming';
  const { revealed, done } = useStreamReveal(activeLine, streaming);
  const finished = lineIndex >= messages.length;

  useEffect(() => {
    setLineIndex(0);
    setPhase(messages.length > 0 ? 'thinking' : 'hold');
    completedRef.current = false;
  }, [messages]);

  useEffect(() => {
    if (finished || phase !== 'thinking') return undefined;
    const timer = window.setTimeout(() => setPhase('streaming'), presenceDelayMs(lineIndex === 0));
    return () => window.clearTimeout(timer);
  }, [finished, phase, lineIndex]);

  useEffect(() => {
    if (phase !== 'streaming' || !done) return undefined;
    const timer = window.setTimeout(() => setPhase('hold'), 120);
    return () => window.clearTimeout(timer);
  }, [phase, done]);

  useEffect(() => {
    if (phase !== 'hold') return undefined;
    const timer = window.setTimeout(() => setPhase('fade'), 650);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'fade') return undefined;
    const timer = window.setTimeout(() => {
      const next = lineIndex + 1;
      if (next < messages.length) {
        setLineIndex(next);
        setPhase('thinking');
      } else {
        setLineIndex(messages.length);
        if (!completedRef.current) {
          completedRef.current = true;
          onComplete?.();
        }
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [phase, lineIndex, messages.length, onComplete]);

  if (finished) return <div className="kayd-seq-briefing kayd-seq-briefing--done" aria-live="polite" />;

  return (
    <div
      className={`kayd-seq-briefing${phase === 'fade' ? ' kayd-seq-briefing--fading' : ''}`}
      aria-live="polite"
    >
      {phase === 'thinking' ? (
        <div className="kayd-seq-briefing__thinking">
          <ThinkingIndicator label="KayD is thinking…" />
        </div>
      ) : null}
      {phase === 'streaming' ? (
        <KaydBriefingBubble text={revealed} streaming={!done} compact />
      ) : null}
      {phase === 'hold' || phase === 'fade' ? (
        <KaydBriefingBubble text={activeLine} compact />
      ) : null}
    </div>
  );
}
