import type { ReactNode } from 'react';
import { KaydConversationLead } from './KaydConversationLead';

interface KaydWorkspaceLayoutProps {
  workspaceClassName?: string;
  briefing: string[];
  composerId: string;
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
  children,
}: KaydWorkspaceLayoutProps) {
  return (
    <div className={`screen screen--conversation-first workspace ${workspaceClassName}`.trim()}>
      <KaydConversationLead briefing={briefing} composerId={composerId} />
      <div className="workspace__body">{children}</div>
    </div>
  );
}
