import { useMemo, useRef, useState } from 'react';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { KaydChatPanel } from '../components/vigsy/KaydChatPanel';
import { KaydExecutiveBriefingInline } from '../components/vigsy/KaydExecutiveBriefingInline';
import { KaydGuidedChips } from '../components/vigsy/KaydGuidedChips';
import { useExecutiveContinuity } from '../hooks/useExecutiveContinuity';
import { useKaydHomeBriefingData } from '../hooks/useKaydHomeBriefingData';
import { useVigsyConversation } from '../context/VigsyConversationContext';
import { KAYD_HOME_COMPOSER_ID } from '../utils/kayd-workspace';
import { selectStarterPrompts } from '../utils/kayd-prompt-suggestions';
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
    submitQuestion,
    sealHomeOpener,
    startNewConversation,
    clearConversation,
    continuity: sessionContinuity,
  } = useVigsyConversation();
  const [confirmClear, setConfirmClear] = useState(false);
  // Returning from Explorer/Search remounts this screen — keep briefing sealed when conversation exists.
  const [briefingComplete, setBriefingComplete] = useState(hasConversation);
  const [openerKey, setOpenerKey] = useState(0);

  const briefing = useMemo(
    () => buildKaydHomeBriefing(continuity, health, stats, gitReadiness, connectors, executiveBriefing),
    [continuity, health, stats, gitReadiness, connectors, executiveBriefing],
  );

  const frozenBriefingRef = useRef<{ key: number; lines: string[] } | null>(null);
  if (frozenBriefingRef.current === null || frozenBriefingRef.current.key !== openerKey) {
    frozenBriefingRef.current = { key: openerKey, lines: briefing };
  }
  const openerBriefing = frozenBriefingRef.current.lines;

  const starterPrompts = useMemo(() => selectStarterPrompts(STARTER_CHIPS, 3), []);

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
          briefing={openerBriefing}
          composerId={KAYD_HOME_COMPOSER_ID}
          openerKey={openerKey}
          briefingStatus={KAYD_BRIEFING_STATUS.home}
          hidePresenceName
          onBriefingComplete={() => {
            setBriefingComplete(true);
            sealHomeOpener(
              openerBriefing.filter((line) => !/^what would you like/i.test(line.trim())),
            );
          }}
          primaryActions={
            briefingComplete && !hasConversation ? (
              <KaydGuidedChips
                chips={starterPrompts}
                busy={busy}
                continuity={sessionContinuity ?? continuity}
                onAsk={(q) => void handleAsk(q)}
                maxVisible={3}
              />
            ) : null
          }
        >
          {briefingComplete ? <KaydExecutiveBriefingInline demoted /> : null}
        </KaydChatPanel>
      </div>
    </div>
  );
}
