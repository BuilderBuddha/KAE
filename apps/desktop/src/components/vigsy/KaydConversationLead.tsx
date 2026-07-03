import { useState } from 'react';
import type { FollowUpAction } from './VigsyFollowUpChips';
import { KaydProgressiveBriefing } from './KaydProgressiveBriefing';
import { VigsyConversationThread } from './VigsyConversationThread';
import { useVigsyConversation } from '../../hooks/useVigsyConversation';

interface KaydConversationLeadProps {
  briefing: string[];
  composerId: string;
}

/**
 * Shared conversation-first lead for every KayD workspace.
 * Reuses Founder Beta thread, composer, progressive briefing, and message rendering.
 */
export function KaydConversationLead({ briefing, composerId }: KaydConversationLeadProps) {
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
    <section className="kayd-lead">
      <div className="kayd-lead__thread vigsy-thread">
        <KaydProgressiveBriefing messages={briefing} />
        {hasConversation ? (
          <VigsyConversationThread turns={turns} onFollowUp={handleFollowUp} />
        ) : null}
      </div>

      <form
        className="kayd-lead__composer"
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
          className="vigsy-home__input vigsy-home__input--hero kayd-lead__input"
          rows={hasConversation ? 2 : 3}
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
        <div className="vigsy-home__composer-actions vigsy-home__composer-actions--center">
          <button
            type="submit"
            className="btn btn--primary btn--large kayd-lead__submit"
            disabled={busy || !ready || !input.trim()}
          >
            {busy ? 'Thinking…' : hasConversation ? 'Send' : 'Ask KayD'}
          </button>
        </div>
      </form>
    </section>
  );
}
