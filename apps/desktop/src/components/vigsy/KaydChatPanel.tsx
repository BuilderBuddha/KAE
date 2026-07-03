import { useState } from 'react';
import type { FollowUpAction } from './VigsyFollowUpChips';
import { KaydProgressiveBriefing } from './KaydProgressiveBriefing';
import { VigsyConversationThread } from './VigsyConversationThread';
import { useVigsyConversation } from '../../hooks/useVigsyConversation';

interface KaydChatPanelProps {
  briefing: string[];
  composerId: string;
  onBriefingComplete?: () => void;
  showBriefing?: boolean;
}

/**
 * Founder Beta–style chatbot shell: single-line KayD briefing + integrated composer.
 */
export function KaydChatPanel({
  briefing,
  composerId,
  onBriefingComplete,
  showBriefing = true,
}: KaydChatPanelProps) {
  const { turns, busy, ready, hasConversation, submitQuestion } = useVigsyConversation();
  const [input, setInput] = useState('');

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

  return (
    <section className="kayd-chat">
      <div className="kayd-chat__header">
        <div className="kayd-chat__presence" aria-hidden>
          ✦
        </div>
        <span className="kayd-chat__label">KayD</span>
      </div>

      <div className="kayd-chat__messages">
        {hasConversation ? (
          <VigsyConversationThread turns={turns} onFollowUp={handleFollowUp} />
        ) : showBriefing ? (
          <KaydProgressiveBriefing messages={briefing} onComplete={onBriefingComplete} />
        ) : null}
      </div>

      <form
        className="kayd-chat__composer"
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
          className="kayd-chat__input"
          rows={2}
          placeholder={
            ready
              ? hasConversation
                ? 'Ask a follow-up…'
                : 'What would you like to work on today?'
              : 'Loading conversation…'
          }
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
