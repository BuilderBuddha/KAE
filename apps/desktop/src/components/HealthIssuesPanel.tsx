import { useState } from 'react';
import type { RepositoryHealthIssue } from '@scooper/core';
import { useNavigation } from '../context/NavigationContext';

interface HealthIssuesPanelProps {
  title: string;
  issues: RepositoryHealthIssue[];
  emptyMessage?: string;
  defaultExpanded?: boolean;
}

function IssueList({ title, issues, emptyMessage, defaultExpanded = false }: HealthIssuesPanelProps) {
  const { openInExplorer } = useNavigation();
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (issues.length === 0) {
    return emptyMessage ? <p className="muted">{emptyMessage}</p> : null;
  }

  return (
    <section className={`health-panel health-panel--collapsible${expanded ? ' health-panel--open' : ''}`}>
      <button
        type="button"
        className="health-panel__toggle"
        aria-expanded={expanded}
        onClick={() => setExpanded((open) => !open)}
      >
        <span>
          {title} ({issues.length})
        </span>
        <span aria-hidden>{expanded ? '−' : '+'}</span>
      </button>
      {expanded ? (
        <ul className="health-issues">
          {issues.map((issue, i) => (
            <li key={`${issue.code}-${i}`} className={`health-issue health-issue--${issue.severity}`}>
              <div className="health-issue__header">
                <strong>{issue.code}</strong>
                <span>{issue.message}</span>
              </div>
              {issue.recovery && <p className="health-issue__recovery">{issue.recovery}</p>}
              {issue.relativePath && (
                <button
                  type="button"
                  className="btn btn--link health-issue__link"
                  onClick={() => openInExplorer(issue.relativePath!)}
                >
                  View file →
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

interface CategorizedHealthPanelProps {
  categorized: {
    errors: RepositoryHealthIssue[];
    warnings: RepositoryHealthIssue[];
    information: RepositoryHealthIssue[];
    recommendations: RepositoryHealthIssue[];
  };
}

export function CategorizedHealthPanel({ categorized }: CategorizedHealthPanelProps) {
  const total =
    categorized.errors.length +
    categorized.warnings.length +
    categorized.information.length +
    categorized.recommendations.length;

  if (total === 0) {
    return <p className="muted">No diagnostic findings.</p>;
  }

  return (
    <div className="health-categorized">
      <IssueList title="Errors" issues={categorized.errors} defaultExpanded={categorized.errors.length > 0} />
      <IssueList title="Warnings" issues={categorized.warnings} defaultExpanded={categorized.warnings.length > 0} />
      <IssueList title="Information" issues={categorized.information} defaultExpanded={false} />
      <IssueList title="Recommendations" issues={categorized.recommendations} defaultExpanded={false} />
    </div>
  );
}
