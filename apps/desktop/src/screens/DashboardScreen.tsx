import { useEffect, useState } from 'react';
import type {
  GitReadinessReport,
  ImportSummary,
  RepairPlan,
  RepairResult,
  RepositoryHealthReport,
  RepositoryStats,
} from '@scooper/core';
import { CategorizedHealthPanel } from '../components/HealthIssuesPanel';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { RepositoryRepairPanel } from '../components/RepositoryRepairPanel';

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
      const [s, h, li, git] = await Promise.all([
        window.kae.getRepositoryStats(),
        window.kae.getRepositoryHealth(),
        window.kae.getLastImportSummary(),
        window.kae.getGitReadiness(),
      ]);
      setStats(s);
      setHealth(h);
      setLastImport(li);
      setGitReadiness(git);
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

  return (
    <div className="screen">
      <header className="screen__header">
        <h2 className="screen__title">Import Dashboard</h2>
        <p className="screen__description">
          Repository status, import history, and Git readiness at a glance.
        </p>
      </header>

      {loading ? (
        <LoadingIndicator label="Loading dashboard…" />
      ) : (
        <>
          <section className="dashboard-grid">
            <div className="card dashboard-card">
              <h3>Repository Status</h3>
              <p className={`dashboard-status ${statusClass(health?.statusLevel)}`}>
                {health?.statusHeadline ?? 'Status Unknown'}
              </p>
              <p className="muted">{health?.statusSubline ?? 'Unable to assess repository health.'}</p>
            </div>
            <div className="card dashboard-card">
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
            <div className="card dashboard-card">
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
          </section>

          {gitReadiness && (
            <section className="card">
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

          <section className="card">
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

          <section className="card">
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
              <button type="button" className="btn btn--secondary" onClick={() => window.kae.openRepositoryPath()}>
                Open Folder
              </button>
              <button type="button" className="btn btn--secondary" onClick={refresh}>
                Refresh
              </button>
            </div>
          </section>

          {health && (
            <section className="card">
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
        </>
      )}
    </div>
  );
}
