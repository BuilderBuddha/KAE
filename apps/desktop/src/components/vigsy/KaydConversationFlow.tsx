import { useEffect, useMemo, useRef, useState } from 'react';
import { CognitionPulse } from './CognitionPulse';
import { KaydPresenceHeader } from './KaydPresenceHeader';
import type { VigsyConversationTurn } from '../../hooks/useVigsyConversation';
import { splitFlowParagraphs } from '../../utils/vigsy-answer-format';

interface KaydConversationFlowProps {
  turns: VigsyConversationTurn[];
  statusLabel?: string;
}

function latestAssistantTurn(turns: VigsyConversationTurn[]): VigsyConversationTurn | null {
  for (let index = turns.length - 1; index >= 0; index -= 1) {
    const turn = turns[index];
    if (turn.role === 'assistant') return turn;
  }
  return null;
}

/** Single-pane KayD flow — one text stream; prior content fades when a new answer begins. */
export function KaydConversationFlow({
  turns,
  statusLabel = 'With you on this',
}: KaydConversationFlowProps) {
  const activeTurn = useMemo(() => latestAssistantTurn(turns), [turns]);
  const [displayedTurn, setDisplayedTurn] = useState<VigsyConversationTurn | null>(null);
  const [fading, setFading] = useState(false);
  const displayedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!activeTurn) {
      setDisplayedTurn(null);
      displayedIdRef.current = null;
      return undefined;
    }
    if (displayedIdRef.current && displayedIdRef.current !== activeTurn.id) {
      setFading(true);
      const timer = window.setTimeout(() => {
        setFading(false);
        setDisplayedTurn(activeTurn);
        displayedIdRef.current = activeTurn.id;
      }, 280);
      return () => window.clearTimeout(timer);
    }
    setDisplayedTurn(activeTurn);
    displayedIdRef.current = activeTurn.id;
    return undefined;
  }, [activeTurn]);

  if (!displayedTurn) {
    return <div className="kayd-conversation-flow kayd-conversation-flow--empty" aria-live="polite" />;
  }

  const thinking = Boolean(displayedTurn.thinking);
  const streaming = Boolean(displayedTurn.streaming);
  const bodyText = displayedTurn.error ?? displayedTurn.text;
  const paragraphs = splitFlowParagraphs(bodyText);
  const supporting = displayedTurn.summary?.trim();
  const showSupporting = !thinking && !streaming && Boolean(supporting);
  const answer = displayedTurn.answer;
  const statusFromAnswer = !thinking
    ? answer?.usedOfflineFallback
      ? answer.reasoningProviderId && answer.reasoningProviderId !== 'mock' && answer.reasoningProviderId !== 'deterministic'
        ? 'Offline fallback'
        : 'Offline grounded'
      : answer?.reasoningProviderId === 'openai'
        ? 'Live OpenAI'
        : answer?.reasoningProviderId === 'mock' || answer?.reasoningProviderId === 'deterministic'
          ? 'Offline grounded'
          : statusLabel
    : 'Thinking through your repository…';

  return (
    <div
      className={`kayd-conversation-flow${fading ? ' kayd-conversation-flow--fading' : ''}${streaming ? ' kayd-conversation-flow--alive' : ''}${thinking ? ' kayd-conversation-flow--thinking' : ''}`}
      aria-live="polite"
      data-presence={thinking ? 'thinking' : 'present'}
      data-reasoning={
        answer?.usedOfflineFallback
          ? 'offline-fallback'
          : answer?.reasoningProviderId === 'openai'
            ? 'live'
            : 'offline'
      }
    >
      <KaydPresenceHeader
        thinking={thinking}
        statusLabel={statusFromAnswer}
        showName={false}
      />
      <div className="kayd-conversation-flow__body">
        {thinking ? (
          <div className="kayd-conversation-flow__thinking">
            <CognitionPulse compact />
          </div>
        ) : null}
        {!thinking && paragraphs.length > 0
          ? paragraphs.map((paragraph, index) => (
              <p
                key={`${displayedTurn.id}-${index}`}
                className={`kayd-briefing-line kayd-briefing-line--latest${streaming && index === paragraphs.length - 1 ? ' kayd-briefing-line--streaming' : ''}`}
                style={paragraph.includes('\n') ? { whiteSpace: 'pre-line' } : undefined}
              >
                {paragraph}
                {streaming && index === paragraphs.length - 1 ? (
                  <span className="kayd-briefing-line__cursor" aria-hidden />
                ) : null}
              </p>
            ))
          : null}
        {showSupporting ? (
          <p className="kayd-briefing-line kayd-briefing-line--supporting" style={{ whiteSpace: 'pre-line' }}>
            {supporting}
          </p>
        ) : null}
      </div>
    </div>
  );
}
