import { useEffect, useMemo, useState } from 'react';
import type {
  ConnectorStatus,
  GitReadinessReport,
  ImportSummary,
  RepairPlan,
  RepairResult,
  RepositoryHealthReport,
  RepositoryStats,
} from '@scooper/core';
import { KaydWorkspaceLayout } from '../components/vigsy/KaydWorkspaceLayout';
import { CategorizedHealthPanel } from '../components/HealthIssuesPanel';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { RepositoryRepairPanel } from '../components/RepositoryRepairPanel';
import { buildKaydDashboardBriefing, KAYD_BRIEFING_STATUS } from '../utils/kayd-briefings';
import { KAYD_WORKSPACE_COMPOSER_ID } from '../utils/kayd-workspace';

function statusClass(level?: RepositoryHealthReport['statusLevel']): string {
  switch (level) {
    case 'healthy':
      return 'dashboard-status--ready';
    case 'attention':
      return 'dashboard-status--attention';
    case 'critical':
      return 'dashboard-status--issues';
    default:
      return '';
  }
}

export function DashboardScreen() {
  const [stats, setStats] = useState<RepositoryStats | null>(null);
  const [health, setHealth] = useState<RepositoryHealthReport | null>(null);
  const [gitReadiness, setGitReadiness] = useState<GitReadinessReport | null>(null);
  const [connectors, setConnectors] = useState<ConnectorStatus[]>([]);
  const [lastImport, setLastImport] = useState<ImportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [repairPlan, setRepairPlan] = useState<RepairPlan | null>(null);
  const [repairResult, setRepairResult] = useState<RepairResult | null>(null);
  const [repairAnalyzing, setRepairAnalyzing] = useState(false);
  const [repairRunning, setRepairRunning] = useState(false);
  const [repairError, setRepairError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const [s, h, li, git, connectorStatuses] = await Promise.all([
        window.kae.getRepositoryStats(),
        window.kae.getRepositoryHealth(),
        window.kae.getLastImportSummary(),
        window.kae.getGitReadiness(),
        window.kae.getConnectorStatuses(),
      ]);
      setStats(s);
      setHealth(h);
      setLastImport(li);
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
    >
      <section className="screen-evidence" aria-label="Supporting evidence">
        <header className="screen-evidence__header">
          <h3 className="screen-evidence__title">Supporting evidence</h3>
          <p className="screen-evidence__lead muted">
            Repository details KayD used for this briefing.
          </p>
        </header>

        <div className="dashboard-grid">
          <div className="card dashboard-card dashboard-card--evidence">
            <h3>Repository Status</h3>
            <p className={`dashboard-status ${statusClass(health?.statusLevel)}`}>
              {health?.statusHeadline ?? 'Status Unknown'}
            </p>
            <p className="muted">{health?.statusSubline ?? 'Unable to assess repository health.'}</p>
          </div>
          <div className="card dashboard-card dashboard-card--evidence">
            <h3>Knowledge Counts</h3>
            <dl className="import-summary__stats">
              <div>
                <dt>Sources</dt>
                <dd>{stats?.sourceCount ?? 0}</dd>
              </div>
              <div>
                <dt>Executive Sessions</dt>
                <dd>{stats?.sessionCount ?? 0}</dd>
              </div>
              <div>
                <dt>Registries</dt>
                <dd>{stats?.registryCount ?? 0}</dd>
              </div>
            </dl>
          </div>
          <div className="card dashboard-card dashboard-card--evidence">
            <h3>Git Readiness</h3>
            <p
              className={`dashboard-status ${
                gitReadiness?.ready ? 'dashboard-status--ready' : 'dashboard-status--attention'
              }`}
            >
              {gitReadiness?.status ?? 'NOT READY'}
            </p>
            {health?.gitBranch && <p className="muted">Branch: {health.gitBranch}</p>}
            {health?.gitDirty != null && (
              <p className="muted">{health.gitDirty ? 'Working tree dirty' : 'Working tree clean'}</p>
            )}
          </div>
        </div>

        {gitReadiness && (
          <section className="card dashboard-card--evidence">
            <h3 className="screen__section-title">Ready to Commit</h3>
            <ul className="git-checks">
              {gitReadiness.checks.map((check) => (
                <li
                  key={check.id}
                  className={`git-check git-check--${check.passed ? 'pass' : 'fail'}`}
                >
                  <span>{check.passed ? '✓' : '✗'}</span>
                  <span>
                    <strong>{check.label}</strong> — {check.message}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="card dashboard-card--evidence">
          <h3 className="screen__section-title">Last Import</h3>
          {lastImport ? (
            <>
              <dl className="import-summary__stats">
                <div>
                  <dt>Sources created</dt>
                  <dd>{lastImport.sourcesCreated}</dd>
                </div>
                <div>
                  <dt>Sessions</dt>
                  <dd>{lastImport.sessionsCreated ?? '—'}</dd>
                </div>
                <div>
                  <dt>Skipped duplicates</dt>
                  <dd>{lastImport.skippedDuplicates}</dd>
                </div>
                <div>
                  <dt>Duration</dt>
                  <dd>
                    {lastImport.durationMs != null
                      ? `${(lastImport.durationMs / 1000).toFixed(1)}s`
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt>Errors</dt>
                  <dd>{lastImport.errors.length}</dd>
                </div>
              </dl>
              {lastImport.importReportPath && (
                <p className="import-summary__folder">
                  Import report: <code>{lastImport.importReportPath}</code>
                </p>
              )}
            </>
          ) : (
            <p className="muted">No imports in this session yet.</p>
          )}
        </section>

        <section className="card dashboard-card--evidence">
          <h3 className="screen__section-title">Repository Path</h3>
          <p>
            <code>{stats?.repositoryPath}</code>
          </p>
          {stats?.lastSnapshotPath && (
            <p className="muted">
              Last snapshot: <code>{stats.lastSnapshotPath}</code>
            </p>
          )}
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

        {health && (
          <section className="card dashboard-card--evidence">
            <h3 className="screen__section-title">
              {health.categorizedIssues.errors.length > 0 ? 'Issues Detected' : 'Health Diagnostics'}
            </h3>
            <CategorizedHealthPanel categorized={health.categorizedIssues} />
          </section>
        )}

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
      </section>
    </KaydWorkspaceLayout>
  );
}
