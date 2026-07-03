import type { ReactNode } from 'react';
import { KaydConversationLead } from './KaydConversationLead';
import { KaydExecutiveBriefingDrawer } from './KaydExecutiveBriefingDrawer';

interface KaydWorkspaceLayoutProps {
  workspaceClassName?: string;
  briefing: string[];
  composerId: string;
  showExecutiveBriefing?: boolean;
  children: ReactNode;
}

/**
 * Conversation-first workspace shell:
 * KayD → Executive Briefing → Supporting evidence / interactive content.
 */
export function KaydWorkspaceLayout({
  workspaceClassName = '',
  briefing,
  composerId,
  showExecutiveBriefing = true,
  children,
}: KaydWorkspaceLayoutProps) {
  return (
    <div className={`screen screen--conversation-first workspace ${workspaceClassName}`.trim()}>
      <KaydConversationLead briefing={briefing} composerId={composerId} />
      {showExecutiveBriefing ? <KaydExecutiveBriefingDrawer /> : null}
      <div className="workspace__body">{children}</div>
    </div>
  );
}
