import { useEffect, useMemo, useRef, useState } from 'react';
import { CognitionPulse } from './CognitionPulse';
import { KaydPresenceHeader } from './KaydPresenceHeader';
import type { VigsyConversationTurn } from '../../hooks/useVigsyConversation';
import { splitFlowParagraphs } from '../../utils/vigsy-answer-format';
import { kaydReasoningStatusLabel } from '../../utils/kayd-provider-status';
import {
  isExecutiveBriefTransitionText,
  selectConversationFlowTurns,
} from '../../utils/kayd-executive-brief-presentation';

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

function TurnBody({
  turn,
  streaming,
  thinking,
}: {
  turn: VigsyConversationTurn;
  streaming?: boolean;
  thinking?: boolean;
}) {
  const bodyText = turn.error ?? turn.text;
  const paragraphs = splitFlowParagraphs(bodyText);
  const supporting = turn.summary?.trim();
  const showSupporting = !thinking && !streaming && Boolean(supporting);

  return (
    <div className="kayd-conversation-flow__body">
      {thinking ? (
        <div className="kayd-conversation-flow__thinking">
          <CognitionPulse compact />
        </div>
      ) : null}
      {!thinking && turn.role === 'user' ? (
        <p className="kayd-briefing-line kayd-briefing-line--user" style={{ whiteSpace: 'pre-line' }}>
          {turn.text}
        </p>
      ) : null}
      {!thinking && turn.role === 'assistant' && paragraphs.length > 0
        ? paragraphs.map((paragraph, index) => (
            <p
              key={`${turn.id}-${index}`}
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
  );
}

/**
 * KayD conversation flow — one progressive stream for ordinary answers.
 * When a governed Executive Brief transition is appended, the prior grounded
 * question+answer remain visible (appended interaction, not replacement).
 */
export function KaydConversationFlow({
  turns,
  statusLabel = 'With you on this',
}: KaydConversationFlowProps) {
  const activeTurn = useMemo(() => latestAssistantTurn(turns), [turns]);
  const visibleTurns = useMemo(
    () => selectConversationFlowTurns(turns) as VigsyConversationTurn[],
    [turns],
  );
  const preservingPrior = useMemo(() => {
    if (!activeTurn) return false;
    return isExecutiveBriefTransitionText(activeTurn.text) && !activeTurn.answer;
  }, [activeTurn]);

  const [displayedActive, setDisplayedActive] = useState<VigsyConversationTurn | null>(null);
  const [fading, setFading] = useState(false);
  const displayedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!activeTurn) {
      setDisplayedActive(null);
      displayedIdRef.current = null;
      return undefined;
    }
    // Task transitions append — do not fade away the preserved grounded answer.
    if (preservingPrior) {
      setFading(false);
      setDisplayedActive(activeTurn);
      displayedIdRef.current = activeTurn.id;
      return undefined;
    }
    if (displayedIdRef.current && displayedIdRef.current !== activeTurn.id) {
      setFading(true);
      const timer = window.setTimeout(() => {
        setFading(false);
        setDisplayedActive(activeTurn);
        displayedIdRef.current = activeTurn.id;
      }, 280);
      return () => window.clearTimeout(timer);
    }
    setDisplayedActive(activeTurn);
    displayedIdRef.current = activeTurn.id;
    return undefined;
  }, [activeTurn, preservingPrior]);

  if (!activeTurn || visibleTurns.length === 0) {
    return <div className="kayd-conversation-flow kayd-conversation-flow--empty" aria-live="polite" />;
  }

  const thinking = Boolean(activeTurn.thinking);
  const streaming = Boolean(activeTurn.streaming);
  const answer = activeTurn.answer ?? visibleTurns.find((turn) => turn.role === 'assistant' && turn.answer)?.answer;
  const statusFromAnswer = kaydReasoningStatusLabel(
    preservingPrior ? (visibleTurns.find((turn) => turn.answer) ?? activeTurn) : (displayedActive ?? activeTurn),
    statusLabel,
  );

  const preserved = preservingPrior
    ? visibleTurns.filter((turn) => turn.id !== activeTurn.id)
    : [];
  const liveTurn = preservingPrior ? activeTurn : (displayedActive ?? activeTurn);

  return (
    <div
      className={`kayd-conversation-flow${fading && !preservingPrior ? ' kayd-conversation-flow--fading' : ''}${streaming ? ' kayd-conversation-flow--alive' : ''}${thinking ? ' kayd-conversation-flow--thinking' : ''}${preservingPrior ? ' kayd-conversation-flow--preserving' : ''}`}
      aria-live="polite"
      data-presence={thinking ? 'thinking' : 'present'}
      data-preserving-prior={preservingPrior ? 'true' : 'false'}
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
      {preserved.map((turn) => (
        <div
          key={turn.id}
          className={`kayd-conversation-flow__turn kayd-conversation-flow__turn--preserved kayd-conversation-flow__turn--${turn.role}`}
          data-turn-id={turn.id}
          data-preserved="true"
        >
          <TurnBody turn={turn} />
        </div>
      ))}
      <div
        className={`kayd-conversation-flow__turn kayd-conversation-flow__turn--active kayd-conversation-flow__turn--${liveTurn.role}`}
        data-turn-id={liveTurn.id}
      >
        <TurnBody turn={liveTurn} streaming={streaming} thinking={thinking} />
      </div>
    </div>
  );
}
