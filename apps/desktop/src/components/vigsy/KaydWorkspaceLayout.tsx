import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { KaydConversationLead } from './KaydConversationLead';
import { useVigsyConversation } from '../../context/VigsyConversationContext';
import {
  buildInvestigationSectionLines,
  investigationWorkspaceHandoff,
} from '../../utils/investigation-workflow';

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
  const { investigationActive, activeInvestigation } = useVigsyConversation();
  const [frozenBriefing] = useState(() => briefing);
  const [briefingComplete, setBriefingComplete] = useState(() => briefing.length === 0);
  const [sectionKey, setSectionKey] = useState(0);

  const effectiveBriefing = useMemo(() => {
    if (investigationActive && activeInvestigation) {
      return [
        ...investigationWorkspaceHandoff(workspaceScreen, activeInvestigation),
        ...buildInvestigationSectionLines(workspaceScreen, activeInvestigation),
      ];
    }
    return frozenBriefing;
  }, [investigationActive, activeInvestigation, workspaceScreen, frozenBriefing]);

  useEffect(() => {
    setBriefingComplete(effectiveBriefing.length === 0);
    setSectionKey((key) => key + 1);
  }, [workspaceScreen, effectiveBriefing.length, investigationActive]);

  const walkthrough =
    investigationActive || !contextWalkthrough?.length ? undefined : contextWalkthrough;

  return (
    <div className={`screen screen--conversation-first workspace ${workspaceClassName}`.trim()}>
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
      {briefingComplete ? <div className="workspace__body">{children}</div> : null}
    </div>
  );
}
