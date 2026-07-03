import type { RepairAction, RepairPlan, RepairResult } from '@scooper/core';

interface RepositoryRepairPanelProps {
  plan: RepairPlan | null;
  result: RepairResult | null;
  analyzing: boolean;
  repairing: boolean;
  error: string | null;
  onAnalyze: () => void;
  onConfirmRepair: () => void;
  onReset: () => void;
}

function riskClass(level: RepairAction['riskLevel']): string {
  return `repair-risk repair-risk--${level}`;
}

export function RepositoryRepairPanel({
  plan,
  result,
  analyzing,
  repairing,
  error,
  onAnalyze,
  onConfirmRepair,
  onReset,
}: RepositoryRepairPanelProps) {
  const busy = analyzing || repairing;
  const hasAutoRepair = (plan?.autoRepairCount ?? 0) > 0;

  return (
    <section className="card repository-repair">
      <div className="repository-repair__header">
        <h3 className="screen__section-title">Repository Repair</h3>
        <p className="muted">
          Diagnose and safely repair integrity issues — duplicates, missing sessions, registry gaps.
        </p>
      </div>

      <div className="form__actions">
        <button type="button" className="btn btn--primary" onClick={onAnalyze} disabled={busy}>
          {analyzing ? 'Analyzing…' : 'Analyze Repository'}
        </button>
        {plan && hasAutoRepair && !result && (
          <button type="button" className="btn btn--secondary" onClick={onConfirmRepair} disabled={busy}>
            {repairing ? 'Repairing…' : `Confirm Repair (${plan.autoRepairCount} safe actions)`}
          </button>
        )}
        {(plan || result) && (
          <button type="button" className="btn btn--secondary" onClick={onReset} disabled={busy}>
            Reset
          </button>
        )}
      </div>

      {error && (
        <p className="repository-repair__error" role="alert">
          {error}
        </p>
      )}

      {plan && !result && (
        <>
          <dl className="repair-summary__stats">
            <div>
              <dt>Issues found</dt>
              <dd>{plan.issues.length}</dd>
            </div>
            <div>
              <dt>Auto-repair safe</dt>
              <dd>{plan.autoRepairCount}</dd>
            </div>
            <div>
              <dt>Manual review</dt>
              <dd>{plan.manualReviewCount}</dd>
            </div>
          </dl>

          {plan.issues.length > 0 && (
            <div className="repair-section">
              <h4>Detected Issues</h4>
              <ul className="repair-list">
                {plan.issues.map((item) => (
                  <li key={item.id} className="repair-list__item">
                    <strong>{item.type.replace(/-/g, ' ')}</strong>
                    {item.krcId && <span className="repair-list__krc"> — {item.krcId}</span>}
                    <p className="repair-list__message">{item.message}</p>
                    {item.affectedFiles.length > 0 && (
                      <ul className="repair-list__files">
                        {item.affectedFiles.map((f) => (
                          <li key={f}>
                            <code>{f}</code>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {plan.actions.length > 0 && (
            <div className="repair-section">
              <h4>Repair Plan</h4>
              <p className="muted">
                A pre-repair snapshot will be created in <code>.kae-snapshots</code> before any
                changes. No files are deleted automatically.
              </p>
              <ul className="repair-list">
                {plan.actions.map((action) => (
                  <li key={action.id} className="repair-list__item">
                    <div className="repair-list__action-header">
                      <strong>{action.description}</strong>
                      <span className={riskClass(action.riskLevel)}>{action.riskLevel} risk</span>
                      {action.autoRepairSafe && !action.manualReviewRequired ? (
                        <span className="repair-badge repair-badge--auto">Auto-repair</span>
                      ) : (
                        <span className="repair-badge repair-badge--manual">Manual review</span>
                      )}
                    </div>
                    <p className="repair-list__message">{action.proposedFix}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {plan.issues.length === 0 && (
            <p className="muted">No repairable issues detected. Repository structure looks healthy.</p>
          )}
        </>
      )}

      {result && (
        <div className="repair-section">
          <h4>Repair Complete</h4>
          <dl className="repair-summary__stats">
            <div>
              <dt>Actions executed</dt>
              <dd>{result.actionsExecuted.filter((a) => a.success).length}</dd>
            </div>
            <div>
              <dt>Actions skipped</dt>
              <dd>{result.actionsSkipped}</dd>
            </div>
            <div>
              <dt>Files changed</dt>
              <dd>{result.filesChanged.length}</dd>
            </div>
            <div>
              <dt>Duplicates before → after</dt>
              <dd>
                {result.healthBefore.duplicateIds.length} → {result.healthAfter.duplicateIds.length}
              </dd>
            </div>
          </dl>
          <p className="muted">
            Snapshot: <code>{result.snapshotPath}</code>
          </p>
          <p
            className={`dashboard-status ${
              result.healthAfter.ready ? 'dashboard-status--ready' : 'dashboard-status--attention'
            }`}
          >
            Post-repair status: {result.healthAfter.statusHeadline}
          </p>
          <ul className="repair-list">
            {result.actionsExecuted.map((action) => (
              <li key={action.actionId} className="repair-list__item">
                <span>{action.success ? '✓' : '✗'}</span> {action.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
