import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { KaydConversationLead } from './KaydConversationLead';
import { KaydInvestigationLensPanel } from './KaydInvestigationLensPanel';
import { KaydInvestigationSectionHeader } from './KaydInvestigationSectionHeader';
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
 * Workspace shell — KayD composer during investigation; each capability body syncs below.
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
  const { investigationActive, activeInvestigation, investigationEpoch, investigationLens } =
    useVigsyConversation();
  const [frozenBriefing] = useState(() => briefing);
  const [briefingComplete, setBriefingComplete] = useState(() => briefing.length === 0);
  const [sectionKey, setSectionKey] = useState(0);

  const effectiveBriefing = useMemo(() => {
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
      {briefingComplete ? (
        <div className="workspace__body" key={investigationActive ? investigationEpoch : 'idle'}>
          {investigationActive && activeInvestigation ? (
            <>
              <KaydInvestigationSectionHeader
                workspaceScreen={workspaceScreen}
                investigation={activeInvestigation}
                lens={investigationLens}
              />
              <KaydInvestigationLensPanel />
            </>
          ) : null}
          {children}
        </div>
      ) : null}
    </div>
  );
}
