import { useEffect, useMemo, useRef, useState } from 'react';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { KaydChatPanel } from '../components/vigsy/KaydChatPanel';
import { KaydExecutiveBriefingInline } from '../components/vigsy/KaydExecutiveBriefingInline';
import { KaydGuidedChips } from '../components/vigsy/KaydGuidedChips';
import { useExecutiveContinuity } from '../hooks/useExecutiveContinuity';
import { useKaydHomeBriefingData } from '../hooks/useKaydHomeBriefingData';
import { useVigsyConversation } from '../context/VigsyConversationContext';
import { buildKaydHomeBriefing, KAYD_BRIEFING_STATUS } from '../utils/kayd-briefings';

const STARTER_CHIPS = [
  'What happened with ChatGPT Import?',
  'What did we decide about Repository Repair?',
  'What happened with ChatGPT import media?',
  'Summarize POSCA UX.',
];

export function VigsyScreen() {
  const continuity = useExecutiveContinuity();
  const { stats, health, gitReadiness, connectors, executiveBriefing, loading: briefingLoading } =
    useKaydHomeBriefingData();
  const {
    busy,
    ready,
    hasConversation,
    investigationActive,
    investigationEpoch,
    activeInvestigation,
    submitQuestion,
    startNewConversation,
    clearConversation,
    continuity: sessionContinuity,
  } = useVigsyConversation();
  const [confirmClear, setConfirmClear] = useState(false);
  const [briefingComplete, setBriefingComplete] = useState(false);
  const [openerKey, setOpenerKey] = useState(0);

  useEffect(() => {
    if (investigationActive) setBriefingComplete(true);
  }, [investigationActive]);

  const briefing = useMemo(
    () => buildKaydHomeBriefing(continuity, health, stats, gitReadiness, connectors, executiveBriefing),
    [continuity, health, stats, gitReadiness, connectors, executiveBriefing],
  );

  const frozenBriefingRef = useRef<{ key: number; lines: string[] } | null>(null);
  if (frozenBriefingRef.current === null || frozenBriefingRef.current.key !== openerKey) {
    frozenBriefingRef.current = { key: openerKey, lines: briefing };
  }
  const openerBriefing = frozenBriefingRef.current.lines;

  const handleAsk = async (text: string) => {
    await submitQuestion(text);
  };

  const handleClear = async () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    setConfirmClear(false);
    setBriefingComplete(false);
    setOpenerKey((key) => key + 1);
    await clearConversation();
  };

  const handleNewConversation = async () => {
    setBriefingComplete(false);
    setOpenerKey((key) => key + 1);
    await startNewConversation();
  };

  if (!ready || briefingLoading) {
    return <LoadingIndicator label="Loading KayD…" />;
  }

  return (
    <div className={`vigsy-unified vigsy-unified--home kayd-conversation-shell screen--conversation-first${hasConversation ? ' vigsy-unified--active' : ''}`}>
      <header className="vigsy-unified__header">
        <div className="vigsy-unified__brand-block">
          <h1 className="vigsy-unified__brand">KayD</h1>
          {activeInvestigation ? (
            <p className="vigsy-unified__investigation muted">
              Active investigation — {activeInvestigation.searchQuery}
            </p>
          ) : null}
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

      <div className="vigsy-unified__body vigsy-unified__body--chat">
        <KaydChatPanel
          briefing={investigationActive ? [] : openerBriefing}
          composerId="vigsy-unified-composer"
          openerKey={openerKey}
          briefingStatus={KAYD_BRIEFING_STATUS.home}
          hidePresenceName
          onBriefingComplete={() => setBriefingComplete(true)}
          actionSlot={
            briefingComplete ? (
              <KaydGuidedChips
                chips={STARTER_CHIPS}
                busy={busy}
                continuity={sessionContinuity ?? continuity}
                onAsk={(q) => void handleAsk(q)}
              />
            ) : null
          }
        >
          {briefingComplete ? <KaydExecutiveBriefingInline key={`awareness-${investigationEpoch}`} /> : null}
        </KaydChatPanel>
      </div>
    </div>
  );
}
