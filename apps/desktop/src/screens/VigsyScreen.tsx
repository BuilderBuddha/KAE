import { useEffect, useMemo, useState } from 'react';
import type { FollowUpAction } from '../components/vigsy/VigsyFollowUpChips';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { KaydExecutiveBriefingInline } from '../components/vigsy/KaydExecutiveBriefingInline';
import { KaydGuidedChips } from '../components/vigsy/KaydGuidedChips';
import { KaydProgressiveBriefing } from '../components/vigsy/KaydProgressiveBriefing';
import { VigsyConversationThread } from '../components/vigsy/VigsyConversationThread';
import { useExecutiveContinuity } from '../hooks/useExecutiveContinuity';
import { useKaydHomeBriefingData } from '../hooks/useKaydHomeBriefingData';
import { useVigsyConversation } from '../hooks/useVigsyConversation';
import { buildKaydDashboardBriefing } from '../utils/kayd-briefings';

const STARTER_CHIPS = [
  'What happened with ChatGPT Import?',
  'What did we decide about Repository Repair?',
  'What happened with ChatGPT import media?',
  'Summarize POSCA UX.',
];

export function VigsyScreen() {
  const continuity = useExecutiveContinuity();
  const { stats, health, gitReadiness, connectors, loading: briefingLoading } = useKaydHomeBriefingData();
  const {
    turns,
    busy,
    ready,
    hasConversation,
    submitQuestion,
    startNewConversation,
    clearConversation,
    continuity: sessionContinuity,
  } = useVigsyConversation();
  const [input, setInput] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const [briefingComplete, setBriefingComplete] = useState(false);

  const briefing = useMemo(
    () => buildKaydDashboardBriefing(continuity, health, stats, gitReadiness, connectors),
    [continuity, health, stats, gitReadiness, connectors],
  );

  useEffect(() => {
    if (!hasConversation) {
      setBriefingComplete(false);
    }
  }, [briefing, hasConversation]);

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
    setBriefingComplete(false);
    await clearConversation();
  };

  const handleNewConversation = async () => {
    setBriefingComplete(false);
    await startNewConversation();
  };

  if (!ready || briefingLoading) {
    return <LoadingIndicator label="Loading KayD…" />;
  }

  return (
    <div className={`vigsy-unified vigsy-unified--home screen--conversation-first${hasConversation ? ' vigsy-unified--active' : ''}`}>
      <header className="vigsy-unified__header">
        <div className="vigsy-unified__brand-block">
          <h1 className="vigsy-unified__brand">KayD</h1>
          <div className="vigsy-home__luminous-line" aria-hidden="true" />
        </div>
        <div className="vigsy-unified__actions">
          <button type="button" className="vigsy-link-btn" onClick={() => void handleNewConversation()}>
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
        <div className="kayd-lead__thread vigsy-thread vigsy-unified__thread">
          {!hasConversation ? (
            <>
              <KaydProgressiveBriefing
                messages={briefing}
                onComplete={() => setBriefingComplete(true)}
              />
              {briefingComplete ? <KaydExecutiveBriefingInline /> : null}
              <KaydGuidedChips
                chips={STARTER_CHIPS}
                busy={busy}
                continuity={sessionContinuity ?? continuity}
                onAsk={(q) => void handleSubmit(q)}
              />
            </>
          ) : (
            <VigsyConversationThread turns={turns} onFollowUp={handleFollowUp} />
          )}
        </div>
      </div>

      <form
        className="vigsy-unified__composer kayd-lead__composer kayd-lead__composer--solo"
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
          className="vigsy-home__input vigsy-home__input--hero kayd-lead__input"
          rows={hasConversation ? 2 : 3}
          placeholder={
            busy
              ? 'KayD is thinking…'
              : hasConversation
                ? 'Ask a follow-up…'
                : 'What would you like to work on today?'
          }
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
      </form>
    </div>
  );
}
