import { useCallback, useEffect, useState } from 'react';
import type { ExecutiveBriefing } from '@scooper/core';
import { ExecutiveBriefingPanel } from './ExecutiveBriefingPanel';

/** Executive briefing woven into the page — open by default, not boxed. */
export function KaydExecutiveBriefingInline() {
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
    <div className="kayd-briefing-inline kayd-briefing-inline--continued">
      <ExecutiveBriefingPanel
        variant="inline"
        briefing={briefing}
        loading={loading}
        backgroundRefreshing={backgroundRefreshing}
        onRefresh={() => void loadBriefing()}
      />
    </div>
  );
}
