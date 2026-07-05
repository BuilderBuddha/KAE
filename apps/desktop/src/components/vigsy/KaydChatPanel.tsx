import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { FollowUpAction } from './VigsyFollowUpChips';
import { KaydProgressiveBriefing } from './KaydProgressiveBriefing';
import { VigsyConversationThread } from './VigsyConversationThread';
import { useNavigation } from '../../context/NavigationContext';
import { useVigsyConversation } from '../../context/VigsyConversationContext';
import type { ScreenId } from '../../types/navigation';
import { resetWorkspaceScroll } from '../../utils/workspace-scroll';

interface KaydChatPanelProps {
  briefing: string[];
  composerId: string;
  briefingStatus?: string;
  workspaceScreen?: ScreenId;
  openerKey?: string | number;
  hidePresenceName?: boolean;
  contextWalkthrough?: string[];
  contextWalkthroughKey?: string;
  contextWalkthroughTitle?: string;
  actionSlot?: ReactNode;
  awarenessSlot?: ReactNode;
  onBriefingComplete?: () => void;
}

/** Unified chatbot shell — briefing, thread, suggested steps, awareness, composer. */
export function KaydChatPanel({
  briefing,
  composerId,
  briefingStatus,
  workspaceScreen,
  openerKey,
  hidePresenceName = false,
  contextWalkthrough,
  contextWalkthroughKey,
  contextWalkthroughTitle,
  actionSlot,
  awarenessSlot,
  onBriefingComplete,
}: KaydChatPanelProps) {
  const { navigate } = useNavigation();
  const { turns, busy, ready, hasConversation, submitQuestion } = useVigsyConversation();

  const [input, setInput] = useState('');
  const [briefingDone, setBriefingDone] = useState(() => briefing.length === 0);
  const displayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setBriefingDone(briefing.length === 0);
    resetWorkspaceScroll();
    displayRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }, [workspaceScreen, openerKey, briefing.length]);

  useEffect(() => {
    if (!hasConversation) return;
    displayRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    panelRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' });
  }, [hasConversation, turns.length]);

  const handleSubmit = async (text?: string) => {
    const question = (text ?? input).trim();
    if (!question) return;
    setInput('');
    if (workspaceScreen && workspaceScreen !== 'vigsy') {
      navigate('vigsy');
    }
    await submitQuestion(question);
  };

  const handleFollowUp = (action: FollowUpAction) => {
    void handleSubmit(action.question);
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

  const showOpener = !briefingDone && briefing.length > 0;
  const showAwareness = briefingDone && !hasConversation && awarenessSlot;

  return (
    <section
      ref={panelRef}
      className={`kayd-chat-panel kayd-conversation-shell${briefingDone ? ' kayd-chat-panel--ready' : ' kayd-chat-panel--opener'}${hasConversation ? ' kayd-chat-panel--active-thread' : ''}`}
    >
      <div className="kayd-chat-panel__display" ref={displayRef}>
        {showOpener ? (
          <KaydProgressiveBriefing
            messages={briefing}
            statusLabel={briefingStatus}
            showPresenceName={!hidePresenceName}
            onComplete={handleBriefingComplete}
          />
        ) : null}
        {briefingDone && hasConversation ? (
          <VigsyConversationThread turns={turns} busy={busy} onFollowUp={handleFollowUp} />
        ) : null}
        {briefingDone && !hasConversation && contextWalkthrough && contextWalkthrough.length > 0 ? (
          <KaydProgressiveBriefing
            key={contextWalkthroughKey}
            messages={contextWalkthrough}
            statusLabel={contextWalkthroughTitle ?? 'Walkthrough'}
            showPresenceName={false}
          />
        ) : null}
      </div>

      {briefingDone ? (
        <div className="kayd-chat-panel__action-zone">
          {actionSlot}
          {showAwareness ? <div className="kayd-chat-panel__awareness">{awarenessSlot}</div> : null}
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
        </div>
      ) : null}
    </section>
  );
}
