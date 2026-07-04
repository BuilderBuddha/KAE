import { useState, type ReactNode } from 'react';
import { KaydConversationLead } from './KaydConversationLead';
import type { ScreenId } from '../../types/navigation';

interface KaydWorkspaceLayoutProps {
  workspaceScreen: ScreenId;
  workspaceClassName?: string;
  briefing: string[];
  composerId: string;
  briefingStatus?: string;
  children: ReactNode;
}

/**
 * Conversation-first workspace shell:
 * KayD opener → follow-up composer → supporting workspace content.
 */
export function KaydWorkspaceLayout({
  workspaceScreen,
  workspaceClassName = '',
  briefing,
  composerId,
  briefingStatus,
  children,
}: KaydWorkspaceLayoutProps) {
  const [frozenBriefing] = useState(() => briefing);
  const [briefingComplete, setBriefingComplete] = useState(false);

  return (
    <div className={`screen screen--conversation-first workspace ${workspaceClassName}`.trim()}>
      <KaydConversationLead
        briefing={frozenBriefing}
        composerId={composerId}
        workspaceScreen={workspaceScreen}
        briefingStatus={briefingStatus}
        onBriefingComplete={() => setBriefingComplete(true)}
      />
      {briefingComplete ? <div className="workspace__body">{children}</div> : null}
    </div>
  );
}
