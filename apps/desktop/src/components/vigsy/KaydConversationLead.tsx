import { KaydChatPanel } from './KaydChatPanel';

interface KaydConversationLeadProps {
  briefing: string[];
  composerId: string;
  briefingStatus?: string;
  onBriefingComplete?: () => void;
}

/** Conversation-first lead for workspace tabs — chatbot panel only. */
export function KaydConversationLead({
  briefing,
  composerId,
  briefingStatus,
  onBriefingComplete,
}: KaydConversationLeadProps) {
  return (
    <div className="kayd-lead">
      <KaydChatPanel
        briefing={briefing}
        composerId={composerId}
        briefingStatus={briefingStatus}
        onBriefingComplete={onBriefingComplete}
      />
    </div>
  );
}
