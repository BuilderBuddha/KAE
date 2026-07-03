import { KaydChatPanel } from './KaydChatPanel';

interface KaydConversationLeadProps {
  briefing: string[];
  composerId: string;
}

/** Conversation-first lead for workspace tabs — chatbot panel only. */
export function KaydConversationLead({ briefing, composerId }: KaydConversationLeadProps) {
  return (
    <div className="kayd-lead">
      <KaydChatPanel briefing={briefing} composerId={composerId} />
    </div>
  );
}
