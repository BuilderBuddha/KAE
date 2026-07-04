import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { FollowUpAction } from './VigsyFollowUpChips';
import { KaydProgressiveBriefing } from './KaydProgressiveBriefing';
import { VigsyConversationThread } from './VigsyConversationThread';
import { useVigsyConversation } from '../../context/VigsyConversationContext';
import type { ScreenId } from '../../types/navigation';
import { resetWorkspaceScroll } from '../../utils/workspace-scroll';

interface KaydChatPanelProps {
  briefing: string[];
  composerId: string;
  briefingStatus?: string;
  workspaceScreen?: ScreenId;
  /** Bumps when the opener should replay (KayD home only). */
  openerKey?: string | number;
  onBriefingComplete?: () => void;
  children?: ReactNode;
}

/**
 * Unified chatbot shell — guided opener on workspace entry, then follow-up thread.
 */
export function KaydChatPanel({
  briefing,
  composerId,
  briefingStatus,
  workspaceScreen,
  openerKey,
  onBriefingComplete,
  children,
}: KaydChatPanelProps) {
  const { turns, busy, ready, hasConversation, submitQuestion } = useVigsyConversation();

  const [input, setInput] = useState('');
  const [briefingDone, setBriefingDone] = useState(() => briefing.length === 0);
  const displayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setBriefingDone(briefing.length === 0);
    resetWorkspaceScroll();
    displayRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }, [workspaceScreen, openerKey, briefing.length]);

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
    <section
      className={`kayd-chat-panel kayd-conversation-shell${briefingDone ? ' kayd-chat-panel--ready' : ' kayd-chat-panel--opener'}`}
    >
      <div className="kayd-chat-panel__display" ref={displayRef}>
        {!briefingDone && briefing.length > 0 ? (
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

      {briefingDone ? (
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
      ) : null}

      {briefingDone ? <div className="kayd-chat-panel__below">{children}</div> : null}
    </section>
  );
}
