import { KaydChatPanel } from './KaydChatPanel';
import type { ScreenId } from '../../types/navigation';
import type { ReactNode } from 'react';

interface KaydConversationLeadProps {
  briefing: string[];
  composerId: string;
  workspaceScreen?: ScreenId;
  briefingStatus?: string;
  hidePresenceName?: boolean;
  contextWalkthrough?: string[];
  contextWalkthroughKey?: string;
  contextWalkthroughTitle?: string;
  actionSlot?: ReactNode;
  onBriefingComplete?: () => void;
}

/** Conversation-first lead for workspace tabs — chatbot panel only. */
export function KaydConversationLead({
  briefing,
  composerId,
  workspaceScreen,
  briefingStatus,
  hidePresenceName,
  contextWalkthrough,
  contextWalkthroughKey,
  contextWalkthroughTitle,
  actionSlot,
  onBriefingComplete,
}: KaydConversationLeadProps) {
  return (
    <div className="kayd-lead">
      <KaydChatPanel
        briefing={briefing}
        composerId={composerId}
        workspaceScreen={workspaceScreen}
        briefingStatus={briefingStatus}
        hidePresenceName={hidePresenceName}
        contextWalkthrough={contextWalkthrough}
        contextWalkthroughKey={contextWalkthroughKey}
        contextWalkthroughTitle={contextWalkthroughTitle}
        actionSlot={actionSlot}
        onBriefingComplete={onBriefingComplete}
      />
    </div>
  );
}
