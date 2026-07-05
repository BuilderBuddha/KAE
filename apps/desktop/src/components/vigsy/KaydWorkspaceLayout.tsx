import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { KaydConversationLead } from './KaydConversationLead';
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

/**
 * Conversation-first workspace shell — alive section briefing tied to investigation.
 */
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
  const { investigationActive } = useVigsyConversation();
  const [frozenBriefing] = useState(() => briefing);
  const [briefingComplete, setBriefingComplete] = useState(() => briefing.length === 0);
  const [sectionKey, setSectionKey] = useState(0);

  const effectiveBriefing = useMemo(() => {
    // Phase 2: during an active investigation, do not replay workspace briefings.
    if (investigationActive) return [];
    return frozenBriefing;
  }, [investigationActive, frozenBriefing]);

  useEffect(() => {
    if (investigationActive) {
      setBriefingComplete(true);
      return;
    }
    setBriefingComplete(effectiveBriefing.length === 0);
    setSectionKey((key) => key + 1);
  }, [workspaceScreen, effectiveBriefing.length, investigationActive]);

  const walkthrough =
    investigationActive || !contextWalkthrough?.length ? undefined : contextWalkthrough;

  return (
    <div
      className={`screen screen--conversation-first workspace${investigationActive ? ' workspace--investigation' : ''} ${workspaceClassName}`.trim()}
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
      {briefingComplete && !investigationActive ? (
        <div className="workspace__body">{children}</div>
      ) : null}
    </div>
  );
}
