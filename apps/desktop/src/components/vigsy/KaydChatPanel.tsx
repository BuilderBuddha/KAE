import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { FollowUpAction } from './VigsyFollowUpChips';
import { KaydProgressiveBriefing } from './KaydProgressiveBriefing';
import { KaydInvestigationSpine } from './KaydInvestigationSpine';
import { KaydConversationFlow } from './KaydConversationFlow';
import { VigsyFollowUpChips } from './VigsyFollowUpChips';
import { useNavigation } from '../../context/NavigationContext';
import { useVigsyConversation } from '../../context/VigsyConversationContext';
import type { ScreenId } from '../../types/navigation';
import { resetWorkspaceScroll } from '../../utils/workspace-scroll';

interface KaydChatPanelProps {
  briefing: string[];
  composerId: string;
  briefingStatus?: string;
  workspaceScreen?: ScreenId;
  /** Bumps when the opener should replay (KayD home only). */
  openerKey?: string | number;
  /** Hide duplicate KayD label when the page header already shows it. */
  hidePresenceName?: boolean;
  contextWalkthrough?: string[];
  contextWalkthroughKey?: string;
  contextWalkthroughTitle?: string;
  onBriefingComplete?: () => void;
  children?: ReactNode;
}

/**
 * Unified chatbot shell — guided opener on workspace entry, then follow-up thread.
 * Home layout: display → below (awareness, chips) → composer.
 */
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
  onBriefingComplete,
  children,
}: KaydChatPanelProps) {
  const { navigate } = useNavigation();
  const { turns, busy, ready, hasConversation, investigationActive, submitQuestion } =
    useVigsyConversation();

  const [input, setInput] = useState('');
  const [briefingDone, setBriefingDone] = useState(() => briefing.length === 0);
  const displayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const prevTurnCountRef = useRef(turns.length);

  useEffect(() => {
    if (investigationActive) {
      setBriefingDone(true);
      return;
    }
    setBriefingDone(briefing.length === 0);
    resetWorkspaceScroll();
    displayRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }, [workspaceScreen, openerKey, briefing.length, investigationActive]);

  useEffect(() => {
    if (!hasConversation) {
      prevTurnCountRef.current = turns.length;
      return;
    }
    if (turns.length > prevTurnCountRef.current) {
      const thread = displayRef.current?.querySelector('.vigsy-thread');
      thread?.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    } else if (!investigationActive) {
      displayRef.current?.scrollTo({ top: 0, behavior: 'auto' });
      panelRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
    prevTurnCountRef.current = turns.length;
  }, [hasConversation, turns.length, investigationActive]);

  const latestAnswer = useMemo(() => {
    for (let index = turns.length - 1; index >= 0; index -= 1) {
      const turn = turns[index];
      if (turn.role === 'assistant' && !turn.thinking && turn.answer) return turn.answer;
    }
    return null;
  }, [turns]);

  const handleSubmit = async (text?: string) => {
    const question = (text ?? input).trim();
    if (!question) return;
    setInput('');
    if (workspaceScreen && workspaceScreen !== 'vigsy' && !investigationActive) {
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

  return (
    <section
      ref={panelRef}
      className={`kayd-chat-panel kayd-conversation-shell${briefingDone ? ' kayd-chat-panel--ready' : ' kayd-chat-panel--opener'}`}
    >
      <div className="kayd-chat-panel__display" ref={displayRef}>
        {!briefingDone && briefing.length > 0 ? (
          <KaydProgressiveBriefing
            messages={briefing}
            statusLabel={briefingStatus}
            showPresenceName={!hidePresenceName}
            onComplete={handleBriefingComplete}
          />
        ) : null}
        {briefingDone && investigationActive && !hasConversation ? <KaydInvestigationSpine /> : null}
        {briefingDone && hasConversation ? (
          <KaydConversationFlow turns={turns} statusLabel="With you on this" />
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
        <div className="kayd-chat-panel__below">
          {hasConversation && latestAnswer ? (
            <VigsyFollowUpChips answer={latestAnswer} onAction={handleFollowUp} busy={busy} />
          ) : (
            children
          )}
        </div>
      ) : null}

      {briefingDone ? (
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
      ) : null}
    </section>
  );
}
