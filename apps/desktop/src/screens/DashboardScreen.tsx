import { useEffect, useMemo, useState } from 'react';
import type {
  ConnectorStatus,
  GitReadinessReport,
  RepairPlan,
  RepairResult,
  RepositoryHealthReport,
  RepositoryStats,
} from '@scooper/core';
import { KaydWorkspaceLayout } from '../components/vigsy/KaydWorkspaceLayout';
import { CategorizedHealthPanel } from '../components/HealthIssuesPanel';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { RepositoryRepairPanel } from '../components/RepositoryRepairPanel';
import { useInvestigationSync } from '../hooks/useInvestigationSync';
import { buildKaydDashboardBriefing, buildKaydDashboardWalkthrough, KAYD_BRIEFING_STATUS } from '../utils/kayd-briefings';
import { KAYD_WORKSPACE_COMPOSER_ID } from '../utils/kayd-workspace';

export function DashboardScreen() {  const [stats, setStats] = useState<RepositoryStats | null>(null);
  const [health, setHealth] = useState<RepositoryHealthReport | null>(null);
  const [gitReadiness, setGitReadiness] = useState<GitReadinessReport | null>(null);
  const [connectors, setConnectors] = useState<ConnectorStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [repairPlan, setRepairPlan] = useState<RepairPlan | null>(null);
  const [repairResult, setRepairResult] = useState<RepairResult | null>(null);
  const [repairAnalyzing, setRepairAnalyzing] = useState(false);
  const [repairRunning, setRepairRunning] = useState(false);
  const [repairError, setRepairError] = useState<string | null>(null);
  const [healthDiagnosticsOpen, setHealthDiagnosticsOpen] = useState(false);

  const healthIssueCount = useMemo(() => {
    if (!health) return 0;
    const c = health.categorizedIssues;
    return c.errors.length + c.warnings.length + c.information.length + c.recommendations.length;
  }, [health]);

  useEffect(() => {
    if (!health) return;
    const hasUrgent =
      health.categorizedIssues.errors.length > 0 || health.categorizedIssues.warnings.length > 0;
    setHealthDiagnosticsOpen(hasUrgent);
  }, [health]);
  const refresh = async () => {
    setLoading(true);
    try {
      const [s, h, git, connectorStatuses] = await Promise.all([
        window.kae.getRepositoryStats(),
        window.kae.getRepositoryHealth(),
        window.kae.getGitReadiness(),
        window.kae.getConnectorStatuses(),
      ]);
      setStats(s);
      setHealth(h);
      setGitReadiness(git);
      setConnectors(connectorStatuses);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const unsub = window.kae.onImportComplete(() => refresh());
    return unsub;
  }, []);

  useInvestigationSync(() => {
    void refresh();
  });

  const handleAnalyzeRepair = async () => {
    setRepairError(null);
    setRepairResult(null);
    setRepairAnalyzing(true);
    try {
      const plan = await window.kae.analyzeRepositoryRepair();
      setRepairPlan(plan);
    } catch (err) {
      setRepairError(err instanceof Error ? err.message : String(err));
    } finally {
      setRepairAnalyzing(false);
    }
  };

  const handleConfirmRepair = async () => {
    if (!repairPlan) return;
    setRepairError(null);
    setRepairRunning(true);
    try {
      const result = await window.kae.executeRepositoryRepair(repairPlan);
      setRepairResult(result);
      await refresh();
    } catch (err) {
      setRepairError(err instanceof Error ? err.message : String(err));
    } finally {
      setRepairRunning(false);
    }
  };

  const handleResetRepair = () => {
    setRepairPlan(null);
    setRepairResult(null);
    setRepairError(null);
  };

  const briefing = useMemo(
    () => buildKaydDashboardBriefing(health, stats, gitReadiness, connectors),
    [health, stats, gitReadiness, connectors],
  );

  const dashboardWalkthrough = useMemo(
    () => buildKaydDashboardWalkthrough(health, stats, gitReadiness, connectors, briefing),
    [health, stats, gitReadiness, connectors, briefing],
  );

  if (loading) {
    return (
      <div className="screen screen--dashboard screen--conversation-first">
        <LoadingIndicator label="Loading dashboard…" />
      </div>
    );
  }

  return (
    <KaydWorkspaceLayout
      workspaceScreen="dashboard"
      workspaceClassName="screen--dashboard"
      briefing={briefing}
      composerId={KAYD_WORKSPACE_COMPOSER_ID}
      briefingStatus={KAYD_BRIEFING_STATUS.dashboard}
      contextWalkthrough={dashboardWalkthrough}
      contextWalkthroughKey="dashboard-walkthrough"
      contextWalkthroughTitle="Dashboard walkthrough"
    >
      <section className="screen-evidence" aria-label="Repository tools">
        {health && healthIssueCount > 0 ? (
          <section className={`card dashboard-card--evidence health-diagnostics${healthDiagnosticsOpen ? ' health-diagnostics--open' : ''}`}>
            <button
              type="button"
              className="health-diagnostics__toggle"
              aria-expanded={healthDiagnosticsOpen}
              onClick={() => setHealthDiagnosticsOpen((open) => !open)}
            >
              <span className="screen__section-title">
                {health.categorizedIssues.errors.length > 0 ? 'Issues Detected' : 'Health Diagnostics'}
                <span className="health-diagnostics__count muted"> ({healthIssueCount})</span>
              </span>
              <span aria-hidden>{healthDiagnosticsOpen ? '−' : '+'}</span>
            </button>
            {healthDiagnosticsOpen ? <CategorizedHealthPanel categorized={health.categorizedIssues} /> : null}
          </section>
        ) : null}
        <RepositoryRepairPanel
          plan={repairPlan}
          result={repairResult}
          analyzing={repairAnalyzing}
          repairing={repairRunning}
          error={repairError}
          onAnalyze={handleAnalyzeRepair}
          onConfirmRepair={handleConfirmRepair}
          onReset={handleResetRepair}
        />
        <section className="card dashboard-card--evidence">
          <div className="form__actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => window.kae.openRepositoryPath()}
            >
              Open Folder
            </button>
            <button type="button" className="btn btn--secondary" onClick={refresh}>
              Refresh
            </button>
          </div>
        </section>
      </section>
    </KaydWorkspaceLayout>
  );
}
