import { useEffect, useRef } from 'react';
import { useVigsyConversation } from '../context/VigsyConversationContext';

export interface InvestigationSyncContext {
  searchQuery: string;
  topic: string;
  epoch: number;
  lens: string | null;
}

/**
 * Runs when the active investigation changes — capabilities refresh from one source of truth.
 */
export function useInvestigationSync(
  onSync: (ctx: InvestigationSyncContext) => void | Promise<void>,
  enabled = true,
): void {
  const { investigationActive, activeInvestigation, investigationEpoch, investigationLens, latestInvestigationAnswer } =
    useVigsyConversation();
  const onSyncRef = useRef(onSync);
  onSyncRef.current = onSync;

  useEffect(() => {
    if (!enabled || !investigationActive || !activeInvestigation) return;
    void onSyncRef.current({
      searchQuery: activeInvestigation.searchQuery,
      topic: activeInvestigation.topic,
      epoch: investigationEpoch,
      lens: investigationLens,
    });
  }, [
    enabled,
    investigationActive,
    activeInvestigation?.searchQuery,
    activeInvestigation?.topic,
    investigationEpoch,
    investigationLens,
    latestInvestigationAnswer?.question,
  ]);
}
