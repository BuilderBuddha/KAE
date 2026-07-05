import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { FollowUpAction } from './VigsyFollowUpChips';
import { KaydProgressiveBriefing } from './KaydProgressiveBriefing';
import { KaydInvestigationRail } from './KaydInvestigationRail';
import { KaydConversationFlow } from './KaydConversationFlow';
import { VigsyFollowUpChips } from './VigsyFollowUpChips';
import { useNavigation } from '../../context/NavigationContext';
import { useVigsyConversation } from '../../context/VigsyConversationContext';
import type { ScreenId } from '../../types/navigation';
import { resetWorkspaceScroll } from '../../utils/workspace-scroll';
import { investigationViewFromQuestion } from '../../utils/investigation-workflow';
import { investigationScreenForView } from '../../utils/investigation-capability';

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
  onBriefingComplete?: () => void;
  children?: ReactNode;
}

/**
 * KayD home — executive conversation flow.
 * Workspace — composer + spine only during investigation (capability body lives below).
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
  const {
    turns,
    busy,
    ready,
    hasConversation,
    investigationActive,
    activeInvestigation,
    submitQuestion,
  } = useVigsyConversation();

  const isKaydHome = !workspaceScreen || workspaceScreen === 'vigsy';
  const workspaceSync = investigationActive && !isKaydHome;

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
    if (!investigationActive || !activeInvestigation?.searchQuery) return;
    setInput(activeInvestigation.searchQuery);
  }, [investigationActive, activeInvestigation?.searchQuery]);

  useEffect(() => {
    if (!hasConversation || workspaceSync) {
      prevTurnCountRef.current = turns.length;
      return;
    }
    if (turns.length > prevTurnCountRef.current) {
      const thread = displayRef.current?.querySelector('.kayd-conversation-flow');
      thread?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
    prevTurnCountRef.current = turns.length;
  }, [hasConversation, turns.length, workspaceSync]);

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
    const view = investigationViewFromQuestion(action.question);
    if (view) {
      const screen = investigationScreenForView(view);
      const here = workspaceScreen ?? 'vigsy';
      if (screen && screen !== here) navigate(screen);
    }
    void handleSubmit(action.question);
  };

  const handleBriefingComplete = () => {
    setBriefingDone(true);
    onBriefingComplete?.();
  };

  const placeholder = busy
    ? 'KayD is thinking…'
    : hasConversation
      ? 'Continue the investigation…'
      : briefingDone
        ? 'What would you like to work on today?'
        : 'Listening…';

  const composer = (
    <form
      className={`kayd-chat-panel__composer${workspaceSync ? ' kayd-chat-panel__composer--top' : ''}`}
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
        rows={workspaceSync ? 1 : 2}
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
  );

  return (
    <section
      ref={panelRef}
      className={`kayd-chat-panel kayd-conversation-shell${briefingDone ? ' kayd-chat-panel--ready' : ' kayd-chat-panel--opener'}${workspaceSync ? ' kayd-chat-panel--workspace-sync' : ''}`}
    >
      {briefingDone && workspaceSync ? (
        <>
          <KaydInvestigationRail workspaceScreen={workspaceScreen} />
          {composer}
        </>
      ) : null}

      {!workspaceSync ? (
        <div className="kayd-chat-panel__display" ref={displayRef}>
          {!briefingDone && briefing.length > 0 ? (
            <KaydProgressiveBriefing
              messages={briefing}
              statusLabel={briefingStatus}
              showPresenceName={!hidePresenceName}
              onComplete={handleBriefingComplete}
            />
          ) : null}
          {briefingDone && investigationActive && !hasConversation ? (
            <KaydInvestigationRail workspaceScreen={workspaceScreen} />
          ) : null}
          {briefingDone && hasConversation && isKaydHome ? (
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
      ) : null}

      {briefingDone && isKaydHome ? (
        <div className="kayd-chat-panel__below">
          {hasConversation && latestAnswer ? (
            <>
              {children}
              <VigsyFollowUpChips answer={latestAnswer} onAction={handleFollowUp} busy={busy} />
            </>
          ) : (
            children
          )}
        </div>
      ) : null}

      {briefingDone && !workspaceSync ? composer : null}
    </section>
  );
}
