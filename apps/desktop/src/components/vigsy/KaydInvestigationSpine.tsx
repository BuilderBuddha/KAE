import { useVigsyConversation } from '../../context/VigsyConversationContext';

/** Persistent investigation context — visible across workspaces during an active thread. */
export function KaydInvestigationSpine() {
  const { investigationActive, activeInvestigation, investigationLens } = useVigsyConversation();

  if (!investigationActive || !activeInvestigation) return null;

  return (
    <div className="kayd-investigation-spine" aria-live="polite">
      <span className="kayd-investigation-spine__label">Active investigation</span>
      <span className="kayd-investigation-spine__topic">{activeInvestigation.searchQuery}</span>
      {investigationLens ? (
        <span className="kayd-investigation-spine__lens muted">· {investigationLens}</span>
      ) : null}
    </div>
  );
}
