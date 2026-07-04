import { useEffect, useMemo, useRef, useState } from 'react';
import { CognitionPulse } from './CognitionPulse';
import { KaydBriefingLine } from './KaydBriefingLine';
import { KaydPresenceHeader } from './KaydPresenceHeader';
import { useBriefingStreamReveal } from '../../hooks/useBriefingStreamReveal';
import {
  BRIEFING_BETWEEN_LINES_MS,
  BRIEFING_FADE_MS,
  BRIEFING_SEGMENT_GAP_MS,
  BRIEFING_THINKING_PULSE_MS,
  briefingHoldMs,
  shouldShowThinkingPulse,
} from '../../utils/briefing-pacing';

type Phase = 'thinking' | 'streaming' | 'hold' | 'fade';

function initialPhase(messages: string[]): Phase {
  if (messages.length === 0) return 'hold';
  return shouldShowThinkingPulse(0) ? 'thinking' : 'streaming';
}

/**
 * Vigsy guided opener — thinking pulse on every third segment, then readable text flow.
 */
export function KaydProgressiveBriefing({
  messages,
  onComplete,
  statusLabel = 'Reviewing your workspace',
  showPresenceName = true,
}: {
  messages: string[];
  onComplete?: () => void;
  statusLabel?: string;
  showPresenceName?: boolean;
}) {
  const [lineIndex, setLineIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>(() => initialPhase(messages));
  const completedRef = useRef(false);
  const messagesKey = useMemo(() => messages.join('\u0001'), [messages]);

  const activeLine = messages[lineIndex] ?? '';
  const streaming = phase === 'streaming';
  const { revealed, done } = useBriefingStreamReveal(activeLine, streaming);
  const finished = lineIndex >= messages.length;
  const thinking = phase === 'thinking';

  useEffect(() => {
    completedRef.current = false;
    setLineIndex(0);
    setPhase(initialPhase(messages));
  }, [messagesKey, messages]);

  useEffect(() => {
    if (finished || phase !== 'thinking') return undefined;
    const timer = window.setTimeout(() => setPhase('streaming'), BRIEFING_THINKING_PULSE_MS);
    return () => window.clearTimeout(timer);
  }, [finished, phase]);

  useEffect(() => {
    if (phase !== 'streaming' || !done) return undefined;
    const timer = window.setTimeout(() => setPhase('hold'), 120);
    return () => window.clearTimeout(timer);
  }, [phase, done]);

  useEffect(() => {
    if (phase !== 'hold') return undefined;
    const timer = window.setTimeout(() => setPhase('fade'), briefingHoldMs(activeLine));
    return () => window.clearTimeout(timer);
  }, [phase, activeLine]);

  useEffect(() => {
    if (phase !== 'fade') return undefined;
    const timer = window.setTimeout(() => {
      const next = lineIndex + 1;
      if (next < messages.length) {
        window.setTimeout(() => {
          setLineIndex(next);
          setPhase(shouldShowThinkingPulse(next) ? 'thinking' : 'streaming');
        }, shouldShowThinkingPulse(next) ? BRIEFING_BETWEEN_LINES_MS : BRIEFING_SEGMENT_GAP_MS);
      } else {
        setLineIndex(messages.length);
        if (!completedRef.current) {
          completedRef.current = true;
          onComplete?.();
        }
      }
    }, BRIEFING_FADE_MS);
    return () => window.clearTimeout(timer);
  }, [phase, lineIndex, messages.length, onComplete]);

  if (finished) {
    return <div className="kayd-briefing-flow kayd-briefing-flow--done" aria-live="polite" />;
  }

  const showLine = phase === 'streaming' || phase === 'hold' || phase === 'fade';
  const lineText = phase === 'streaming' ? revealed : activeLine;

  return (
    <div
      className={`kayd-briefing-flow${thinking ? ' kayd-briefing-flow--thinking' : ' kayd-briefing-flow--alive'}`}
      aria-live="polite"
      data-presence={thinking ? 'thinking' : 'present'}
    >
      <KaydPresenceHeader thinking={thinking} statusLabel={statusLabel} showName={showPresenceName} />
      <div className="kayd-briefing-flow__body">
        {thinking ? (
          <div className="kayd-briefing-flow__thinking">
            <CognitionPulse compact />
            <span className="kayd-briefing-flow__thinking-label">Thinking</span>
          </div>
        ) : null}
        {showLine ? (
          <KaydBriefingLine
            text={lineText}
            streaming={phase === 'streaming' && !done}
            fading={phase === 'fade'}
          />
        ) : null}
      </div>
    </div>
  );
}
