import { KaydChatPanel } from './KaydChatPanel';
import type { ScreenId } from '../../types/navigation';

interface KaydConversationLeadProps {
  briefing: string[];
  composerId: string;
  workspaceScreen?: ScreenId;
  briefingStatus?: string;
  onBriefingComplete?: () => void;
}

/** Conversation-first lead for workspace tabs — chatbot panel only. */
export function KaydConversationLead({
  briefing,
  composerId,
  workspaceScreen,
  briefingStatus,
  onBriefingComplete,
}: KaydConversationLeadProps) {
  return (
    <div className="kayd-lead">
      <KaydChatPanel
        briefing={briefing}
        composerId={composerId}
        workspaceScreen={workspaceScreen}
        briefingStatus={briefingStatus}
        onBriefingComplete={onBriefingComplete}
      />
    </div>
  );
}
