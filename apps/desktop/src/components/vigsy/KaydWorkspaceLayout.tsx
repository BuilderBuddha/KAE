import { useEffect, useState, type ReactNode } from 'react';
import { KaydConversationLead } from './KaydConversationLead';
import { resetWorkspaceScroll } from '../../utils/workspace-scroll';

interface KaydWorkspaceLayoutProps {
  workspaceClassName?: string;
  briefing: string[];
  composerId: string;
  briefingStatus?: string;
  children: ReactNode;
}

/**
 * Conversation-first workspace shell:
 * KayD chat panel → supporting evidence / interactive content.
 */
export function KaydWorkspaceLayout({
  workspaceClassName = '',
  briefing,
  composerId,
  briefingStatus,
  children,
}: KaydWorkspaceLayoutProps) {
  const [briefingComplete, setBriefingComplete] = useState(false);

  useEffect(() => {
    setBriefingComplete(false);
    resetWorkspaceScroll();
  }, [briefing]);

  return (
    <div className={`screen screen--conversation-first workspace ${workspaceClassName}`.trim()}>
      <KaydConversationLead
        briefing={briefing}
        composerId={composerId}
        briefingStatus={briefingStatus}
        onBriefingComplete={() => setBriefingComplete(true)}
      />
      {briefingComplete ? <div className="workspace__body">{children}</div> : null}
    </div>
  );
}
