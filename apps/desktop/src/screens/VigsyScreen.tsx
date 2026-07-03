import { useState } from 'react';
import type { FollowUpAction } from '../components/vigsy/VigsyFollowUpChips';
import { VigsyConversationThread } from '../components/vigsy/VigsyConversationThread';
import { VigsyHomePanel } from '../components/vigsy/VigsyHomePanel';
import { useVigsyConversation } from '../hooks/useVigsyConversation';

export function VigsyScreen() {
  const { turns, busy, hasConversation, submitQuestion, clearConversation } = useVigsyConversation();
  const [input, setInput] = useState('');

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

  return (
    <div className="screen vigsy-experience">
      {!hasConversation ? (
        <VigsyHomePanel
          busy={busy}
          inputValue={input}
          onInputChange={setInput}
          onSubmit={() => void handleSubmit()}
          onAsk={(q) => void handleSubmit(q)}
        />
      ) : (
        <div className="vigsy-conversation">
          <header className="vigsy-conversation__header">
            <div>
              <h2 className="screen__title">Vigsy</h2>
              <p className="screen__description muted">Evidence-grounded executive intelligence</p>
            </div>
            <button type="button" className="btn btn--secondary btn--small" onClick={clearConversation}>
              New conversation
            </button>
          </header>

          <VigsyConversationThread turns={turns} onFollowUp={handleFollowUp} />

          <form
            className="vigsy-conversation__composer card"
            onSubmit={(e) => {
              e.preventDefault();
              void handleSubmit();
            }}
          >
            <textarea
              className="form__input vigsy-home__input"
              rows={2}
              placeholder="Ask a follow-up…"
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
            <button type="submit" className="btn btn--primary" disabled={busy || !input.trim()}>
              {busy ? 'Thinking…' : 'Send'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
