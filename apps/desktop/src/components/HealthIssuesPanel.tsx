import type { RepositoryHealthIssue } from '@scooper/core';
import { useNavigation } from '../context/NavigationContext';

interface HealthIssuesPanelProps {
  title: string;
  issues: RepositoryHealthIssue[];
  emptyMessage?: string;
}

function IssueList({ title, issues, emptyMessage }: HealthIssuesPanelProps) {
  const { openInExplorer } = useNavigation();

  if (issues.length === 0) {
    return emptyMessage ? <p className="muted">{emptyMessage}</p> : null;
  }

  return (
    <section className="health-panel">
      <h4 className="health-panel__title">{title}</h4>
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
      <IssueList title="Errors" issues={categorized.errors} />
      <IssueList title="Warnings" issues={categorized.warnings} />
      <IssueList title="Information" issues={categorized.information} />
      <IssueList title="Recommendations" issues={categorized.recommendations} />
    </div>
  );
}
