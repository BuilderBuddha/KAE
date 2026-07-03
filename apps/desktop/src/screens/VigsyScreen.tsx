import { useState } from 'react';
import type { FollowUpAction } from '../components/vigsy/VigsyFollowUpChips';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { VigsyConversationThread } from '../components/vigsy/VigsyConversationThread';
import { VigsyEmptyState } from '../components/vigsy/VigsyEmptyState';
import { useVigsyConversation } from '../hooks/useVigsyConversation';

const STARTER_CHIPS = [
  'What happened with ChatGPT Import?',
  'What did we decide about Repository Repair?',
  'What happened with ChatGPT import media?',
  'Summarize POSCA UX.',
];

export function VigsyScreen() {
  const {
    turns,
    busy,
    ready,
    hasConversation,
    submitQuestion,
    startNewConversation,
    clearConversation,
    continuity,
  } = useVigsyConversation();
  const [input, setInput] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  const handleSubmit = async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q) return;
    setInput('');
    await submitQuestion(q);
  };

  const handleFollowUp = (action: FollowUpAction) => {
    if (action.type === 'ask') {
      void handleSubmit(action.question);
    }
  };

  const handleClear = async () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    setConfirmClear(false);
    await clearConversation();
  };

  if (!ready) {
    return <LoadingIndicator label="Loading KayD…" />;
  }

  return (
    <div className={`vigsy-unified${hasConversation ? ' vigsy-unified--active' : ''}`}>
      <header className="vigsy-unified__header">
        <div className="vigsy-unified__brand-block">
          <h1 className="vigsy-unified__brand">KayD</h1>
          <div className="vigsy-home__luminous-line" aria-hidden="true" />
        </div>
        <div className="vigsy-unified__actions">
          <button type="button" className="vigsy-link-btn" onClick={() => void startNewConversation()}>
            New Conversation
          </button>
          <button
            type="button"
            className={`vigsy-link-btn${confirmClear ? ' vigsy-link-btn--danger' : ''}`}
            onClick={() => void handleClear()}
          >
            {confirmClear ? 'Confirm clear?' : 'Clear Conversation'}
          </button>
        </div>
      </header>

      <div className="vigsy-unified__body">
        {continuity?.welcomeMessage ? (
          <p className="vigsy-continuity" role="status">
            {continuity.welcomeMessage}
          </p>
        ) : null}
        {!hasConversation ? (
          <VigsyEmptyState
            chips={STARTER_CHIPS}
            busy={busy}
            continuity={continuity}
            onAsk={(q) => void handleSubmit(q)}
          />
        ) : (
          <VigsyConversationThread turns={turns} onFollowUp={handleFollowUp} />
        )}
      </div>

      <form
        className="vigsy-unified__composer"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit();
        }}
      >
        <label className="sr-only" htmlFor="vigsy-unified-composer">
          Ask KayD
        </label>
        <textarea
          id="vigsy-unified-composer"
          className="vigsy-home__input vigsy-home__input--hero"
          rows={hasConversation ? 2 : 3}
          placeholder={hasConversation ? 'Ask a follow-up…' : 'What would you like to work on today?'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void handleSubmit();
            }
          }}
          disabled={busy}
        />
        <div className="vigsy-home__composer-actions vigsy-home__composer-actions--center">
          <button type="submit" className="btn btn--primary btn--large" disabled={busy || !input.trim()}>
            {busy ? 'Thinking…' : hasConversation ? 'Send' : 'Ask KayD'}
          </button>
        </div>
      </form>
    </div>
  );
}
