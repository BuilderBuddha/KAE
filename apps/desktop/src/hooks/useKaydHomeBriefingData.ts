import { useCallback, useEffect, useState } from 'react';
import type {
  ConnectorStatus,
  ExecutiveBriefing,
  GitReadinessReport,
  RepositoryHealthReport,
  RepositoryStats,
} from '@scooper/core';

export function useKaydHomeBriefingData() {
  const [stats, setStats] = useState<RepositoryStats | null>(null);
  const [health, setHealth] = useState<RepositoryHealthReport | null>(null);
  const [gitReadiness, setGitReadiness] = useState<GitReadinessReport | null>(null);
  const [connectors, setConnectors] = useState<ConnectorStatus[]>([]);
  const [executiveBriefing, setExecutiveBriefing] = useState<ExecutiveBriefing | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [s, h, git, connectorStatuses, briefingResult] = await Promise.all([
        window.kae.getRepositoryStats(),
        window.kae.getRepositoryHealth(),
        window.kae.getGitReadiness(),
        window.kae.getConnectorStatuses(),
        window.kae.getExecutiveBriefing(),
      ]);
      setStats(s);
      setHealth(h);
      setGitReadiness(git);
      setConnectors(connectorStatuses);
      setExecutiveBriefing(briefingResult.briefing);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const unsub = window.kae.onImportComplete(() => void refresh());
    return unsub;
  }, [refresh]);

  return { stats, health, gitReadiness, connectors, executiveBriefing, loading, refresh };
}
