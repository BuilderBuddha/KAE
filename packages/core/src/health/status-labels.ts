import type { RepositoryHealthReport } from '../types/repository.js';
import type { CategorizedHealthIssues, RepositoryStatusLevel } from '../types/import-rc.js';

export interface RepositoryStatusDisplay {
  level: RepositoryStatusLevel;
  headline: string;
  subline: string;
}

/** Derives dashboard status wording from a health report. */
export function getRepositoryStatusDisplay(
  health: RepositoryHealthReport | null,
): RepositoryStatusDisplay {
  if (!health) {
    return {
      level: 'attention',
      headline: 'Status Unknown',
      subline: 'Unable to load repository health.',
    };
  }

  const errorCount = health.categorizedIssues?.errors.length ?? health.issues.filter((i) => i.severity === 'error').length;
  const warningCount = health.categorizedIssues?.warnings.length ?? health.issues.filter((i) => i.severity === 'warning').length;

  if (errorCount > 0) {
    return {
      level: 'critical',
      headline: 'Repository Requires Attention',
      subline: `${errorCount} error(s) and ${warningCount} warning(s) detected.`,
    };
  }

  if (warningCount > 0) {
    return {
      level: 'attention',
      headline: 'Repository Requires Attention',
      subline: `No errors. ${warningCount} warning(s) detected.`,
    };
  }

  return {
    level: 'healthy',
    headline: 'Repository Healthy',
    subline: 'No Issues Found',
  };
}

/** Groups health issues by category for display. */
export function categorizeHealthIssues(
  issues: RepositoryHealthReport['issues'],
): CategorizedHealthIssues {
  const result: CategorizedHealthIssues = {
    errors: [],
    warnings: [],
    information: [],
    recommendations: [],
  };

  for (const issue of issues) {
    const cat = issue.category ?? issue.severity;
    if (cat === 'error') result.errors.push(issue);
    else if (cat === 'warning') result.warnings.push(issue);
    else if (cat === 'recommendation') result.recommendations.push(issue);
    else result.information.push(issue);
  }

  return result;
}
