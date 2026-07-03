import { useEffect, useMemo, useState } from 'react';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { KaydChatPanel } from '../components/vigsy/KaydChatPanel';
import { KaydExecutiveBriefingInline } from '../components/vigsy/KaydExecutiveBriefingInline';
import { KaydGuidedChips } from '../components/vigsy/KaydGuidedChips';
import { useExecutiveContinuity } from '../hooks/useExecutiveContinuity';
import { useKaydHomeBriefingData } from '../hooks/useKaydHomeBriefingData';
import { useVigsyConversation } from '../hooks/useVigsyConversation';
import { buildKaydHomeBriefing } from '../utils/kayd-briefings';

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
    busy,
    ready,
    hasConversation,
    submitQuestion,
    startNewConversation,
    clearConversation,
    continuity: sessionContinuity,
  } = useVigsyConversation();
  const [confirmClear, setConfirmClear] = useState(false);
  const [briefingComplete, setBriefingComplete] = useState(false);

  const briefing = useMemo(
    () => buildKaydHomeBriefing(continuity, health, stats, gitReadiness, connectors),
    [continuity, health, stats, gitReadiness, connectors],
  );

  useEffect(() => {
    if (!hasConversation) {
      setBriefingComplete(false);
    }
  }, [briefing, hasConversation]);

  const handleAsk = async (question: string) => {
    const q = question.trim();
    if (!q) return;
    await submitQuestion(q);
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
        <KaydChatPanel
          briefing={briefing}
          composerId="vigsy-unified-composer"
          onBriefingComplete={() => setBriefingComplete(true)}
          showBriefing={!hasConversation}
        />
        {!hasConversation && briefingComplete ? <KaydExecutiveBriefingInline /> : null}
        {!hasConversation ? (
          <KaydGuidedChips
            chips={STARTER_CHIPS}
            busy={busy}
            continuity={sessionContinuity ?? continuity}
            onAsk={(q) => void handleAsk(q)}
          />
        ) : null}
      </div>
    </div>
  );
}
