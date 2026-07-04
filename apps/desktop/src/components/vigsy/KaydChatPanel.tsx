import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { FollowUpAction } from './VigsyFollowUpChips';
import { KaydProgressiveBriefing } from './KaydProgressiveBriefing';
import { VigsyConversationThread } from './VigsyConversationThread';
import { useVigsyConversation } from '../../context/VigsyConversationContext';
import { resetWorkspaceScroll } from '../../utils/workspace-scroll';

interface KaydChatPanelProps {
  briefing: string[];
  composerId: string;
  briefingStatus?: string;
  onBriefingComplete?: () => void;
  children?: ReactNode;
}

/**
 * Unified chatbot shell — section opener first, then follow-up thread when present.
 */
export function KaydChatPanel({
  briefing,
  composerId,
  briefingStatus,
  onBriefingComplete,
  children,
}: KaydChatPanelProps) {
  const { turns, busy, ready, hasConversation, submitQuestion, conversationId } = useVigsyConversation();
  const [input, setInput] = useState('');
  const [briefingDone, setBriefingDone] = useState(false);
  const displayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setBriefingDone(false);
    resetWorkspaceScroll();
    displayRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }, [briefing, conversationId]);

  const handleSubmit = async (text?: string) => {
    const question = (text ?? input).trim();
    if (!question) return;
    setInput('');
    await submitQuestion(question);
  };

  const handleFollowUp = (action: FollowUpAction) => {
    if (action.type === 'ask') {
      void handleSubmit(action.question);
    }
  };

  const handleBriefingComplete = () => {
    setBriefingDone(true);
    onBriefingComplete?.();
  };

  const placeholder = busy
    ? 'KayD is thinking…'
    : hasConversation
      ? 'Ask a follow-up…'
      : briefingDone
        ? 'What would you like to work on today?'
        : 'Listening…';

  return (
    <section className="kayd-chat-panel">
      <div className="kayd-chat-panel__display" ref={displayRef}>
        {!briefingDone ? (
          <KaydProgressiveBriefing
            messages={briefing}
            statusLabel={briefingStatus}
            onComplete={handleBriefingComplete}
          />
        ) : null}
        {briefingDone && hasConversation ? (
          <VigsyConversationThread turns={turns} onFollowUp={handleFollowUp} />
        ) : null}
      </div>

      {briefingDone ? children : null}

      <form
        className="kayd-chat-panel__composer"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit();
        }}
      >
        <label className="sr-only" htmlFor={composerId}>
          Ask KayD
        </label>
        <textarea
          id={composerId}
          className="kayd-chat-panel__input"
          rows={2}
          placeholder={ready ? placeholder : 'Loading conversation…'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void handleSubmit();
            }
          }}
          disabled={busy || !ready}
        />
      </form>
    </section>
  );
}
