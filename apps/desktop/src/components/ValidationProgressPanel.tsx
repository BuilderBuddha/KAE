import type { ValidationProgress } from '@scooper/core';

interface ValidationProgressPanelProps {
  progress: ValidationProgress;
  onCancel?: () => void;
  cancelling?: boolean;
}

function formatElapsed(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rem = seconds % 60;
  return `${minutes}m ${rem}s`;
}

function statusIcon(status: ValidationProgress['status']): string {
  switch (status) {
    case 'complete':
      return '✓';
    case 'failed':
      return '✗';
    case 'cancelled':
      return '⊘';
    default:
      return '…';
  }
}

export function ValidationProgressPanel({
  progress,
  onCancel,
  cancelling,
}: ValidationProgressPanelProps) {
  const isRunning = progress.status === 'running';
  const percent =
    progress.conversationsTotal > 0
      ? Math.min(
          100,
          Math.round((progress.conversationsProcessed / progress.conversationsTotal) * 100),
        )
      : undefined;

  return (
    <section className="card validation-progress" aria-live="polite" aria-busy={isRunning}>
      <div className="validation-progress__header">
        <h3 className="import-summary__title">Validation Progress</h3>
        <span className={`validation-progress__status validation-progress__status--${progress.status}`}>
          {statusIcon(progress.status)}{' '}
          {progress.status === 'running'
            ? 'Running'
            : progress.status === 'complete'
              ? 'Complete'
              : progress.status === 'cancelled'
                ? 'Cancelled'
                : 'Failed'}
        </span>
      </div>

      <p className="validation-progress__stage">{progress.stageLabel}</p>
      {progress.detail && <p className="validation-progress__detail">{progress.detail}</p>}

      {percent != null && isRunning && (
        <div className="validation-progress__bar" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
          <div className="validation-progress__bar-fill" style={{ width: `${percent}%` }} />
        </div>
      )}

      <dl className="validation-progress__stats">
        <div>
          <dt>Conversations</dt>
          <dd>
            {progress.conversationsTotal > 0
              ? `${progress.conversationsProcessed} / ${progress.conversationsTotal}`
              : '—'}
          </dd>
        </div>
        <div>
          <dt>Messages</dt>
          <dd>{progress.messagesProcessed > 0 ? progress.messagesProcessed : '—'}</dd>
        </div>
        <div>
          <dt>Warnings</dt>
          <dd>{progress.warningsGenerated}</dd>
        </div>
        <div>
          <dt>Elapsed</dt>
          <dd>{formatElapsed(progress.elapsedMs)}</dd>
        </div>
      </dl>

      {progress.error && (
        <p className="validation-progress__error" role="alert">
          {progress.error}
        </p>
      )}

      {isRunning && onCancel && (
        <div className="form__actions">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={onCancel}
            disabled={cancelling}
          >
            {cancelling ? 'Cancelling…' : 'Cancel Validation'}
          </button>
        </div>
      )}

      {!isRunning && (progress.status === 'failed' || progress.status === 'cancelled') && onCancel && (
        <div className="form__actions">
          <button type="button" className="btn btn--secondary" onClick={onCancel}>
            Reset
          </button>
        </div>
      )}
    </section>
  );
}
