import { ExecutiveBriefingPanel } from './ExecutiveBriefingPanel';
import { useCallback, useEffect, useState } from 'react';
import type { ExecutiveBriefing, ExecutiveContinuity } from '@scooper/core';

interface VigsyEmptyStateProps {
  chips: string[];
  busy: boolean;
  continuity?: ExecutiveContinuity | null;
  onAsk: (question: string) => void;
}

export function VigsyEmptyState({ chips, busy, continuity, onAsk }: VigsyEmptyStateProps) {
  const [briefing, setBriefing] = useState<ExecutiveBriefing | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(true);
  const [backgroundRefreshing, setBackgroundRefreshing] = useState(false);

  const loadBriefing = useCallback(async () => {
    setBriefingLoading(true);
    try {
      const result = await window.kae.getExecutiveBriefing();
      setBriefing(result.briefing);
      if (result.stale) {
        setBackgroundRefreshing(true);
        const fresh = await window.kae.refreshExecutiveBriefing();
        setBriefing(fresh);
      }
    } finally {
      setBriefingLoading(false);
      setBackgroundRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadBriefing();
  }, [loadBriefing]);

  useEffect(() => {
    const offBriefing = window.kae.onExecutiveBriefingUpdated(() => {
      void loadBriefing();
    });
    const offMemory = window.kae.onExecutiveMemoryUpdated(() => {
      void loadBriefing();
    });
    return () => {
      offBriefing();
      offMemory();
    };
  }, [loadBriefing]);

  const recommendedChip =
    continuity?.recommendedNextAction &&
    !chips.some((chip) => chip.toLowerCase().includes(continuity.recommendedNextAction!.slice(0, 24).toLowerCase()))
      ? continuity.recommendedNextAction
      : null;

  return (
    <div className="vigsy-empty">
      {!continuity?.welcomeMessage ? (
        <p className="vigsy-empty__lead muted">
          Continue where you left off, or ask anything about your knowledge.
        </p>
      ) : null}
      <div className="vigsy-chips vigsy-empty__chips">
        {recommendedChip ? (
          <button
            type="button"
            className="vigsy-chip vigsy-chip--recommended"
            disabled={busy}
            onClick={() => onAsk(continuity?.session?.currentObjective ?? recommendedChip)}
          >
            Continue
          </button>
        ) : null}
        {chips.map((q) => (
          <button
            key={q}
            type="button"
            className="vigsy-chip"
            disabled={busy}
            onClick={() => onAsk(q)}
          >
            {q}
          </button>
        ))}
      </div>
      <details className="vigsy-home__drawer">
        <summary className="vigsy-home__drawer-summary">Executive Briefing</summary>
        <ExecutiveBriefingPanel
          briefing={briefing}
          loading={briefingLoading}
          backgroundRefreshing={backgroundRefreshing}
          onRefresh={() => void loadBriefing()}
        />
      </details>
    </div>
  );
}
