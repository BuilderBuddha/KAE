import { useCallback, useEffect, useState } from 'react';
import type { ExecutiveBriefing } from '@scooper/core';
import { ExecutiveBriefingPanel } from './ExecutiveBriefingPanel';

/** Compact executive briefing — conversational drawer, not a dominant panel. */
export function KaydExecutiveBriefingDrawer() {
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

  return (
    <details className="kayd-briefing-drawer">
      <summary className="kayd-briefing-drawer__summary">Executive briefing</summary>
      <ExecutiveBriefingPanel
        briefing={briefing}
        loading={loading}
        backgroundRefreshing={backgroundRefreshing}
        onRefresh={() => void loadBriefing()}
      />
    </details>
  );
}
