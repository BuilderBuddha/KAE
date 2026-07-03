import { useEffect, useState } from 'react';
import { ThinkingIndicator } from './CognitionPulse';
import { KaydBriefingBubble } from './KaydBriefingBubble';
import { useStreamReveal } from '../../hooks/useStreamReveal';
import { presenceDelayMs } from '../../utils/vigsy-stream';

function BriefingThinkingBubble() {
  return (
    <div className="vigsy-msg vigsy-msg--assistant vigsy-msg--enter vigsy-msg--thinking kayd-lead__briefing">
      <div className="vigsy-msg__presence kayd-lead__presence" aria-hidden>
        ✦
      </div>
      <div className="vigsy-msg__bubble vigsy-msg__bubble--thinking">
        <ThinkingIndicator label="KayD is thinking…" />
      </div>
    </div>
  );
}

/**
 * Reveals briefing lines one at a time with Founder Beta pacing:
 * thinking pause → character stream → pause → next line.
 */
export function KaydProgressiveBriefing({ messages }: { messages: string[] }) {
  const [lineIndex, setLineIndex] = useState(0);
  const [phase, setPhase] = useState<'thinking' | 'streaming'>('thinking');
  const [completed, setCompleted] = useState<string[]>([]);

  const activeLine = messages[lineIndex] ?? '';
  const streaming = phase === 'streaming' && lineIndex < messages.length;
  const { revealed, done } = useStreamReveal(activeLine, streaming);

  useEffect(() => {
    setLineIndex(0);
    setPhase(messages.length > 0 ? 'thinking' : 'streaming');
    setCompleted([]);
  }, [messages]);

  useEffect(() => {
    if (lineIndex >= messages.length || phase !== 'thinking') return undefined;
    const timer = window.setTimeout(() => setPhase('streaming'), presenceDelayMs(lineIndex === 0));
    return () => window.clearTimeout(timer);
  }, [phase, lineIndex, messages.length]);

  useEffect(() => {
    if (lineIndex >= messages.length || phase !== 'streaming' || !done) return undefined;
    const timer = window.setTimeout(() => {
      setCompleted((prev) => [...prev, activeLine]);
      if (lineIndex + 1 < messages.length) {
        setLineIndex((prev) => prev + 1);
        setPhase('thinking');
      } else {
        setLineIndex(messages.length);
      }
    }, presenceDelayMs());
    return () => window.clearTimeout(timer);
  }, [phase, done, lineIndex, messages.length, activeLine]);

  return (
    <>
      {completed.map((text, i) => (
        <KaydBriefingBubble key={`done-${i}`} text={text} />
      ))}
      {lineIndex < messages.length && phase === 'thinking' ? <BriefingThinkingBubble /> : null}
      {streaming && lineIndex < messages.length ? (
        <KaydBriefingBubble text={revealed} streaming={!done} />
      ) : null}
    </>
  );
}
