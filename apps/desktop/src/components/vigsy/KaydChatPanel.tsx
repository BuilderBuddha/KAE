import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { FollowUpAction } from './VigsyFollowUpChips';
import { KaydProgressiveBriefing } from './KaydProgressiveBriefing';
import { KaydInvestigationRail } from './KaydInvestigationRail';
import { KaydInvestigationComposer } from './KaydInvestigationComposer';
import { KaydConversationFlow } from './KaydConversationFlow';
import { VigsyFollowUpChips } from './VigsyFollowUpChips';
import { KaydExecutiveBriefPreview } from './KaydExecutiveBriefPreview';
import { useNavigation } from '../../context/NavigationContext';
import { useVigsyConversation } from '../../context/VigsyConversationContext';
import type { ScreenId } from '../../types/navigation';
import { resetWorkspaceScroll } from '../../utils/workspace-scroll';
import { investigationViewFromQuestion } from '../../utils/investigation-workflow';
import { investigationScreenForView } from '../../utils/investigation-capability';
import { shouldRenderInlineComposer } from '../../utils/kayd-persistent-composer';
import { KAYD_INVESTIGATION_DOCK_SCREENS } from '../../utils/kayd-workspace';
import {
  EXECUTIVE_BRIEF_SUGGESTED_ACTION_LABEL,
  EXECUTIVE_BRIEF_SUGGESTED_ACTION_QUESTION,
  isActiveExecutiveBriefTask,
  shouldShowPrepareExecutiveBriefAction,
} from '../../utils/kayd-executive-brief-presentation';
import { hasGovernedInvestigationEvidence } from '../../utils/kayd-executive-brief-evidence';

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
  /** Cold-start suggestions — rendered after the composer, before Supporting context. */
  primaryActions?: ReactNode;
  /** Supporting context only (collapsed). Must not include the composer or primary prompts. */
  children?: ReactNode;
}

/**
 * KayD home — conversation-first: opener/answer → choices → composer → collapsed supporting.
 * Workspace dock screens — rail only; persistent dock owns the composer.
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
  primaryActions,
  children,
}: KaydChatPanelProps) {
  const { navigate } = useNavigation();
  const {
    turns,
    busy,
    hasConversation,
    investigationActive,
    submitQuestion,
    executiveBriefTask,
    approveExecutiveBrief,
    cancelExecutiveBrief,
    requestExecutiveBriefRevision,
  } = useVigsyConversation();

  const isKaydHome = !workspaceScreen || workspaceScreen === 'vigsy';
  const onDockScreen =
    Boolean(workspaceScreen) &&
    (KAYD_INVESTIGATION_DOCK_SCREENS as readonly string[]).includes(workspaceScreen as string);
  const workspaceSync = Boolean(hasConversation && onDockScreen && !isKaydHome);
  const showInlineComposer = shouldRenderInlineComposer({
    hasConversation,
    isKaydHome,
    workspaceScreen,
    dockScreens: KAYD_INVESTIGATION_DOCK_SCREENS,
  });

  const [briefingDone, setBriefingDone] = useState(() => briefing.length === 0);
  const displayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);
  const prevTurnCountRef = useRef(turns.length);

  useEffect(() => {
    if (investigationActive || hasConversation) {
      setBriefingDone(true);
      return;
    }
    setBriefingDone(briefing.length === 0);
    resetWorkspaceScroll();
    displayRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }, [workspaceScreen, openerKey, briefing.length, investigationActive, hasConversation]);

  useEffect(() => {
    if (!hasConversation || workspaceSync || !isKaydHome) {
      prevTurnCountRef.current = turns.length;
      return;
    }
    if (turns.length > prevTurnCountRef.current) {
      // Keep the answer in view without scrolling past the composer.
      answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    prevTurnCountRef.current = turns.length;
  }, [hasConversation, turns.length, workspaceSync, isKaydHome]);

  const latestAnswer = useMemo(() => {
    for (let index = turns.length - 1; index >= 0; index -= 1) {
      const turn = turns[index];
      if (turn.role === 'assistant' && !turn.thinking && turn.answer) return turn.answer;
    }
    return null;
  }, [turns]);

  const showPrepareExecutiveBrief = shouldShowPrepareExecutiveBriefAction({
    hasInvestigationEvidence: hasGovernedInvestigationEvidence(latestAnswer),
    previewActive: isActiveExecutiveBriefTask(executiveBriefTask?.state),
  });

  const handleFollowUp = (action: FollowUpAction) => {
    const capabilityOrigin = action.origin === 'capability';
    if (capabilityOrigin) {
      const view = investigationViewFromQuestion(action.question);
      if (view) {
        const screen = investigationScreenForView(view);
        const here = workspaceScreen ?? 'vigsy';
        if (screen && screen !== here) navigate(screen);
      }
    }
    void submitQuestion(action.question, { capabilityOrigin });
  };

  const handlePrepareExecutiveBrief = () => {
    void submitQuestion(EXECUTIVE_BRIEF_SUGGESTED_ACTION_QUESTION);
  };

  const handleBriefingComplete = () => {
    setBriefingDone(true);
    onBriefingComplete?.();
  };

  const composerClass = [
    'kayd-chat-panel__composer',
    workspaceSync ? 'kayd-chat-panel__composer--top' : '',
    isKaydHome ? 'kayd-chat-panel__composer--adjacent kayd-chat-panel__composer--sticky' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const composer =
    showInlineComposer && briefingDone ? (
      <div className={composerClass}>
        <KaydInvestigationComposer
          composerId={composerId}
          rows={workspaceSync ? 1 : 2}
          workspaceScreen={workspaceScreen}
        />
      </div>
    ) : null;

  const composerBeforeSupporting = Boolean(isKaydHome && briefingDone);

  return (
    <section
      ref={panelRef}
      className={`kayd-chat-panel kayd-conversation-shell${isKaydHome ? ' kayd-chat-panel--home' : ''}${briefingDone ? ' kayd-chat-panel--ready' : ' kayd-chat-panel--opener'}${hasConversation && isKaydHome ? ' kayd-chat-panel--in-conversation' : ''}${workspaceSync ? ' kayd-chat-panel--workspace-sync' : ''}`}
      data-composer-before-supporting={composerBeforeSupporting ? 'true' : 'false'}
      data-inline-composer={showInlineComposer ? 'true' : 'false'}
    >
      {briefingDone && workspaceSync ? (
        <>
          <KaydInvestigationRail workspaceScreen={workspaceScreen} />
          {showInlineComposer ? composer : null}
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

          {/* Active conversation: answer → ≤3 choices → composer */}
          {briefingDone && hasConversation && isKaydHome ? (
            <div className="kayd-chat-panel__conversation-unit" data-hierarchy="active">
              <div ref={answerRef} className="kayd-chat-panel__answer">
                <KaydConversationFlow turns={turns} statusLabel="With you on this" />
              </div>
              {(latestAnswer && !busy) || showPrepareExecutiveBrief ? (
                <div className="kayd-chat-panel__action-row">
                  {showPrepareExecutiveBrief && !busy ? (
                    <button
                      type="button"
                      className="vigsy-chip vigsy-chip--executive-brief"
                      disabled={busy}
                      data-action="prepare-executive-brief"
                      onClick={handlePrepareExecutiveBrief}
                    >
                      {EXECUTIVE_BRIEF_SUGGESTED_ACTION_LABEL}
                    </button>
                  ) : null}
                  {latestAnswer && !busy ? (
                    <VigsyFollowUpChips
                      answer={latestAnswer}
                      onAction={handleFollowUp}
                      busy={busy}
                      maxVisible={showPrepareExecutiveBrief ? 2 : 3}
                    />
                  ) : null}
                </div>
              ) : null}
              {composer}
              {executiveBriefTask && executiveBriefTask.state !== 'cancelled' ? (
                <KaydExecutiveBriefPreview
                  task={executiveBriefTask}
                  busy={busy}
                  onApprove={() => void approveExecutiveBrief()}
                  onRequestRevision={() => void requestExecutiveBriefRevision()}
                  onCancel={() => void cancelExecutiveBrief()}
                />
              ) : null}
            </div>
          ) : null}

          {/* Cold opener complete: composer immediately, then ≤3 starters */}
          {briefingDone && !hasConversation && isKaydHome ? (
            <div className="kayd-chat-panel__conversation-unit kayd-chat-panel__conversation-unit--cold" data-hierarchy="cold">
              {composer}
              {primaryActions ? (
                <div className="kayd-chat-panel__primary-actions">{primaryActions}</div>
              ) : null}
            </div>
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

      {/* Supporting context only — always after composer on KayD */}
      {briefingDone && isKaydHome ? (
        <div
          className={`kayd-chat-panel__below kayd-chat-panel__below--supporting`}
          data-region="supporting-context"
        >
          {children}
        </div>
      ) : null}

      {/* Non-home idle workspace: composer after lead content */}
      {briefingDone && !workspaceSync && !isKaydHome ? composer : null}
    </section>
  );
}
