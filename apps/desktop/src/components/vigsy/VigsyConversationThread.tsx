import { useEffect, useRef, useState } from 'react';
import type { VigsyKnowledgeAnswer } from '@scooper/core';
import type { FollowUpAction } from './VigsyFollowUpChips';
import { VigsyEvidencePanel } from './VigsyEvidencePanel';
import { VigsyFollowUpChips } from './VigsyFollowUpChips';
import type { VigsyConversationTurn } from '../../hooks/useVigsyConversation';
import { useNavigation } from '../../context/NavigationContext';

function UserBubble({ text }: { text: string }) {
  return (
    <div className="vigsy-msg vigsy-msg--user">
      <div className="vigsy-msg__bubble">{text}</div>
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className="vigsy-msg vigsy-msg--assistant">
      <div className="vigsy-msg__avatar" aria-hidden>
        ✦
      </div>
      <div className="vigsy-msg__bubble vigsy-msg__bubble--thinking">
        <span className="vigsy-thinking">
          <span />
          <span />
          <span />
        </span>
        Vigsy is reasoning over evidence…
      </div>
    </div>
  );
}

function AssistantBubble({
  text,
  streaming,
  answer,
  expandedSections,
  onFollowUp,
}: {
  text: string;
  streaming?: boolean;
  answer?: VigsyKnowledgeAnswer;
  expandedSections?: Set<string>;
  onFollowUp: (action: FollowUpAction) => void;
}) {
  return (
    <div className="vigsy-msg vigsy-msg--assistant">
      <div className="vigsy-msg__avatar" aria-hidden>
        ✦
      </div>
      <div className="vigsy-msg__content">
        <div className={`vigsy-msg__bubble${streaming ? ' vigsy-msg__bubble--streaming' : ''}`}>
          <pre className="vigsy-msg__text">{text}</pre>
          {streaming ? <span className="vigsy-cursor" aria-hidden /> : null}
        </div>
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
        const sections = new Set(next.get(turnId) ?? ['confidence']);
        sections.add(action.section);
        if (action.section === 'evidence') sections.add('evidence');
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
