import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ExecutiveBriefing } from '@scooper/core';
import { ExecutiveBriefingPanel } from './ExecutiveBriefingPanel';
import { useVigsyConversation } from '../../context/VigsyConversationContext';
import { filterExecutiveBriefingForInvestigation } from '../../utils/investigation-workflow';

/** Full supporting awareness panel — cards, evidence links, refresh. */
export function KaydExecutiveBriefingInline() {
  const { investigationActive, activeInvestigation } = useVigsyConversation();
  const [briefing, setBriefing] = useState<ExecutiveBriefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [backgroundRefreshing, setBackgroundRefreshing] = useState(false);

  const loadBriefing = useCallback(async () => {
    setLoading(true);
    try {
      const result = await window.kae.getExecutiveBriefing();
      setBriefing(result.briefing);
      if (result.stale) {
        setBackgroundRefreshing(true);
        const fresh = await window.kae.refreshExecutiveBriefing();
        setBriefing(fresh);
      }
    } finally {
      setLoading(false);
      setBackgroundRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadBriefing();
  }, [loadBriefing]);

  useEffect(() => {
    const offBriefing = window.kae.onExecutiveBriefingUpdated(() => void loadBriefing());
    const offMemory = window.kae.onExecutiveMemoryUpdated(() => void loadBriefing());
    return () => {
      offBriefing();
      offMemory();
    };
  }, [loadBriefing]);

  const displayBriefing = useMemo(() => {
    if (!investigationActive) return briefing;
    return filterExecutiveBriefingForInvestigation(briefing, activeInvestigation?.searchQuery);
  }, [activeInvestigation?.searchQuery, briefing, investigationActive]);

  return (
    <div className="kayd-briefing-inline kayd-briefing-inline--continued">
      <ExecutiveBriefingPanel
        variant="inline"
        briefing={displayBriefing}
        loading={loading}
        backgroundRefreshing={backgroundRefreshing}
        onRefresh={() => void loadBriefing()}
      />
    </div>
  );
}
