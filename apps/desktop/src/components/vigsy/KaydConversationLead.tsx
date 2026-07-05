import { KaydChatPanel } from './KaydChatPanel';
import type { ScreenId } from '../../types/navigation';

interface KaydConversationLeadProps {
  briefing: string[];
  composerId: string;
  workspaceScreen?: ScreenId;
  briefingStatus?: string;
  hidePresenceName?: boolean;
  openerKey?: string | number;
  contextWalkthrough?: string[];
  contextWalkthroughKey?: string;
  contextWalkthroughTitle?: string;
  onBriefingComplete?: () => void;
}

/** Conversation-first lead for workspace tabs — chatbot panel only. */
export function KaydConversationLead({
  briefing,
  composerId,
  workspaceScreen,
  briefingStatus,
  hidePresenceName,
  openerKey,
  contextWalkthrough,
  contextWalkthroughKey,
  contextWalkthroughTitle,
  onBriefingComplete,
}: KaydConversationLeadProps) {
  return (
    <div className="kayd-lead">
      <KaydChatPanel
        briefing={briefing}
        composerId={composerId}
        workspaceScreen={workspaceScreen}
        openerKey={openerKey}
        briefingStatus={briefingStatus}
        hidePresenceName={hidePresenceName}
        contextWalkthrough={contextWalkthrough}
        contextWalkthroughKey={contextWalkthroughKey}
        contextWalkthroughTitle={contextWalkthroughTitle}
        onBriefingComplete={onBriefingComplete}
      />
    </div>
  );
}
