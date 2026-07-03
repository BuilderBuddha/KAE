import type { ImportTimelineStep } from '@scooper/core';

interface ImportTimelineProps {
  steps: ImportTimelineStep[];
}

function stepIcon(status: ImportTimelineStep['status']): string {
  switch (status) {
    case 'complete':
      return '✓';
    case 'running':
      return '◌';
    case 'failed':
      return '✗';
    case 'skipped':
      return '—';
    default:
      return '○';
  }
}

export function ImportTimeline({ steps }: ImportTimelineProps) {
  if (steps.length === 0) return null;

  return (
    <ol className="import-timeline">
      {steps.map((step) => (
        <li
          key={step.id}
          className={`import-timeline__step import-timeline__step--${step.status}`}
        >
          <span className="import-timeline__icon">{stepIcon(step.status)}</span>
          <span className="import-timeline__label">{step.label}</span>
          {step.detail && <span className="import-timeline__detail">{step.detail}</span>}
        </li>
      ))}
    </ol>
  );
}
