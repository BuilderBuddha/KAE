import { useEffect, useMemo, useRef } from 'react';
import type { VigsyKnowledgeAnswer } from '@scooper/core';
import type { FollowUpAction } from './VigsyFollowUpChips';
import { VigsyFollowUpChips } from './VigsyFollowUpChips';
import { ThinkingIndicator } from './CognitionPulse';
import type { VigsyConversationTurn } from '../../hooks/useVigsyConversation';

function UserBubble({ text }: { text: string }) {
  return (
    <div className="vigsy-msg vigsy-msg--user vigsy-msg--enter">
      <div className="vigsy-msg__bubble vigsy-msg__bubble--user">{text}</div>
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className="vigsy-msg vigsy-msg--assistant vigsy-msg--enter vigsy-msg--thinking">
      <div className="vigsy-msg__presence" aria-hidden>
        ✦
      </div>
      <div className="vigsy-msg__bubble vigsy-msg__bubble--thinking">
        <ThinkingIndicator label="KayD is thinking…" />
      </div>
    </div>
  );
}

function AssistantBubble({
  text,
  summary,
  streaming,
  answer,
  showCapabilities,
  busy,
  onFollowUp,
}: {
  text: string;
  summary?: string;
  streaming?: boolean;
  answer?: VigsyKnowledgeAnswer;
  showCapabilities?: boolean;
  busy?: boolean;
  onFollowUp: (action: FollowUpAction) => void;
}) {
  return (
    <div className={`vigsy-msg vigsy-msg--assistant vigsy-msg--enter${streaming ? ' vigsy-msg--alive' : ''}`}>
      <div className="vigsy-msg__presence" aria-hidden>
        ✦
      </div>
      <div className="vigsy-msg__content">
        <div className={`vigsy-msg__bubble vigsy-msg__bubble--vigsy${streaming ? ' vigsy-msg__bubble--streaming' : ''}`}>
          <p className="vigsy-msg__text">{text}</p>
          {streaming ? <span className="vigsy-cursor" aria-hidden /> : null}
        </div>
        {!streaming && summary && !answer ? <p className="vigsy-msg__summary muted">{summary}</p> : null}
        {answer && !streaming && showCapabilities ? (
          <VigsyFollowUpChips answer={answer} onAction={onFollowUp} busy={busy} />
        ) : null}
      </div>
    </div>
  );
}

interface VigsyConversationThreadProps {
  turns: VigsyConversationTurn[];
  busy?: boolean;
  onFollowUp: (action: FollowUpAction) => void;
}

function latestAssistantTurnId(turns: VigsyConversationTurn[]): string | null {
  for (let index = turns.length - 1; index >= 0; index -= 1) {
    const turn = turns[index];
    if (turn.role === 'assistant' && !turn.thinking) return turn.id;
  }
  return null;
}

export function VigsyConversationThread({ turns, busy, onFollowUp }: VigsyConversationThreadProps) {
  const topRef = useRef<HTMLDivElement>(null);
  const latestAssistantId = useMemo(() => latestAssistantTurnId(turns), [turns]);

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [turns]);

  return (
    <div className="vigsy-thread">
      <div ref={topRef} />
      {turns.map((turn) => {
        if (turn.role === 'user') {
          return <UserBubble key={turn.id} text={turn.text} />;
        }
        if (turn.thinking) {
          return <ThinkingBubble key={turn.id} />;
        }
        return (
          <AssistantBubble
            key={turn.id}
            text={turn.error ?? turn.text}
            summary={turn.error ? undefined : turn.summary}
            streaming={turn.streaming}
            answer={turn.error ? undefined : turn.answer}
            showCapabilities={turn.id === latestAssistantId}
            busy={busy}
            onFollowUp={onFollowUp}
          />
        );
      })}
    </div>
  );
}
