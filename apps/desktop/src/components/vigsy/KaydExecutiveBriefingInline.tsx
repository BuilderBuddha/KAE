import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ExecutiveBriefing } from '@scooper/core';
import { KaydProgressiveBriefing } from './KaydProgressiveBriefing';
import { useVigsyConversation } from '../../context/VigsyConversationContext';
import { buildSectionAwarenessBriefing } from '../../utils/investigation-workflow';

/** Investigation-aware awareness — spoken lines, not static placecards. */
export function KaydExecutiveBriefingInline() {
  const { investigationActive, activeInvestigation } = useVigsyConversation();
  const [briefing, setBriefing] = useState<ExecutiveBriefing | null>(null);

  const loadBriefing = useCallback(async () => {
    const result = await window.kae.getExecutiveBriefing();
    setBriefing(result.briefing);
    if (result.stale) {
      const fresh = await window.kae.refreshExecutiveBriefing();
      setBriefing(fresh);
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

  const lines = useMemo(
    () => buildSectionAwarenessBriefing(briefing, activeInvestigation),
    [briefing, activeInvestigation],
  );

  if (!investigationActive || lines.length === 0) return null;

  return (
    <div className="kayd-briefing-inline kayd-briefing-inline--continued">
      <KaydProgressiveBriefing
        messages={lines}
        statusLabel="Connecting awareness to your investigation"
        showPresenceName={false}
      />
    </div>
  );
}
