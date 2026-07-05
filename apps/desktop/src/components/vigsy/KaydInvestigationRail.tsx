import { investigationCapabilityLead } from '../../utils/investigation-capability';
import { useVigsyConversation } from '../../context/VigsyConversationContext';
import type { ScreenId } from '../../types/navigation';

/** KayD-led investigation rail — one line, thinking pulse when active. */
export function KaydInvestigationRail({ workspaceScreen }: { workspaceScreen?: ScreenId }) {
  const { investigationActive, activeInvestigation, investigationLens, busy } = useVigsyConversation();

  if (!investigationActive || !activeInvestigation) return null;

  const lead = investigationCapabilityLead(
    workspaceScreen ?? 'vigsy',
    activeInvestigation.searchQuery,
    investigationLens,
    busy,
  );

  return (
    <div
      className={`kayd-investigation-rail${busy ? ' kayd-investigation-rail--thinking' : ''}`}
      aria-live="polite"
    >
      <span className="kayd-investigation-rail__presence" aria-hidden>
        ✦
      </span>
      <p className="kayd-investigation-rail__lead">{lead}</p>
    </div>
  );
}
