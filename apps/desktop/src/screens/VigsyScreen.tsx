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
    <div className={`vigsy-experience${hasConversation ? ' vigsy-experience--conversation' : ''}`}>
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
          <div className="vigsy-conversation__toolbar">
            <button type="button" className="vigsy-link-btn" onClick={clearConversation}>
              ← New conversation
            </button>
          </div>

          <VigsyConversationThread turns={turns} onFollowUp={handleFollowUp} />

          <form
            className="vigsy-conversation__composer"
            onSubmit={(e) => {
              e.preventDefault();
              void handleSubmit();
            }}
          >
            <textarea
              className="vigsy-home__input vigsy-home__input--followup"
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
