import { useEffect, useRef, useState } from 'react';
import type { VigsyKnowledgeAnswer } from '@scooper/core';
import type { FollowUpAction } from './VigsyFollowUpChips';
import { VigsyEvidencePanel } from './VigsyEvidencePanel';
import { VigsyFollowUpChips } from './VigsyFollowUpChips';
import { ThinkingIndicator } from './CognitionPulse';
import type { VigsyConversationTurn } from '../../hooks/useVigsyConversation';
import { useNavigation } from '../../context/NavigationContext';

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
        <ThinkingIndicator label="Vigsy is thinking…" />
      </div>
    </div>
  );
}

function AssistantBubble({
  text,
  summary,
  streaming,
  answer,
  expandedSections,
  onFollowUp,
}: {
  text: string;
  summary?: string;
  streaming?: boolean;
  answer?: VigsyKnowledgeAnswer;
  expandedSections?: Set<string>;
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
        {!streaming && summary ? <p className="vigsy-msg__summary muted">{summary}</p> : null}
        {answer && !streaming ? (
          <>
            <VigsyEvidencePanel answer={answer} expandedSections={expandedSections} />
            <VigsyFollowUpChips answer={answer} onAction={onFollowUp} />
          </>
        ) : null}
      </div>
    </div>
  );
}

interface VigsyConversationThreadProps {
  turns: VigsyConversationTurn[];
  onFollowUp: (action: FollowUpAction) => void;
}

export function VigsyConversationThread({ turns, onFollowUp }: VigsyConversationThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [expandedByTurn, setExpandedByTurn] = useState<Map<string, Set<string>>>(new Map());
  const { openInExplorer } = useNavigation();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns]);

  const handleFollowUp = (turnId: string, action: FollowUpAction) => {
    if (action.type === 'expand') {
      setExpandedByTurn((prev) => {
        const next = new Map(prev);
        const sections = new Set(next.get(turnId) ?? []);
        sections.add(action.section);
        next.set(turnId, sections);
        return next;
      });
      return;
    }
    if (action.type === 'explorer' && action.path) {
      openInExplorer(action.path);
      return;
    }
    onFollowUp(action);
  };

  return (
    <div className="vigsy-thread">
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
            expandedSections={expandedByTurn.get(turn.id)}
            onFollowUp={(action) => handleFollowUp(turn.id, action)}
          />
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
