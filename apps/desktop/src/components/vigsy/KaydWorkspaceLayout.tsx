import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { KaydConversationLead } from './KaydConversationLead';
import { KaydInvestigationCapabilityFocus } from './KaydInvestigationCapabilityFocus';
import { useVigsyConversation } from '../../context/VigsyConversationContext';

import type { ScreenId } from '../../types/navigation';

interface KaydWorkspaceLayoutProps {
  workspaceScreen: ScreenId;
  workspaceClassName?: string;
  briefing: string[];
  composerId: string;
  briefingStatus?: string;
  contextWalkthrough?: string[];
  contextWalkthroughKey?: string;
  contextWalkthroughTitle?: string;
  children: ReactNode;
}

/** Workspace shell — KayD rail + composer; capability body is unique per section. */
export function KaydWorkspaceLayout({
  workspaceScreen,
  workspaceClassName = '',
  briefing,
  composerId,
  briefingStatus,
  contextWalkthrough,
  contextWalkthroughKey,
  contextWalkthroughTitle,
  children,
}: KaydWorkspaceLayoutProps) {
  const { investigationActive, investigationEpoch, hasConversation } = useVigsyConversation();
  const [frozenBriefing] = useState(() => briefing);
  const [briefingComplete, setBriefingComplete] = useState(() => briefing.length === 0);
  const [sectionKey, setSectionKey] = useState(0);

  // Once a real exchange exists, never play cold workspace openers (e.g. health-desk).
  const effectiveBriefing = useMemo(() => {
    if (hasConversation) return [];
    return frozenBriefing;
  }, [hasConversation, frozenBriefing]);

  useEffect(() => {
    if (hasConversation) {
      setBriefingComplete(true);
      return;
    }
    setBriefingComplete(effectiveBriefing.length === 0);
    setSectionKey((key) => key + 1);
  }, [workspaceScreen, effectiveBriefing.length, hasConversation]);

  const walkthrough =
    hasConversation || investigationActive || !contextWalkthrough?.length
      ? undefined
      : contextWalkthrough;

  const investigationMode = hasConversation || investigationActive;

  return (
    <div
      className={`screen screen--conversation-first workspace${investigationMode ? ' workspace--investigation' : ''} ${workspaceClassName}`.trim()}
    >
      <KaydConversationLead
        briefing={effectiveBriefing}
        composerId={composerId}
        workspaceScreen={workspaceScreen}
        briefingStatus={briefingStatus}
        openerKey={sectionKey}
        contextWalkthrough={walkthrough}
        contextWalkthroughKey={contextWalkthroughKey}
        contextWalkthroughTitle={contextWalkthroughTitle}
        onBriefingComplete={() => setBriefingComplete(true)}
      />
      {briefingComplete ? (
        <div className="workspace__body" key={investigationMode ? investigationEpoch : 'idle'}>
          <KaydInvestigationCapabilityFocus workspaceScreen={workspaceScreen} />
          {children}
        </div>
      ) : null}
    </div>
  );
}
