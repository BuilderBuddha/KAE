/** Repository health issue severity. */
export type HealthIssueSeverity = 'error' | 'warning' | 'info';

/** Issue category for grouped diagnostics. */
export type HealthIssueCategory = 'error' | 'warning' | 'info' | 'recommendation';

/** A single repository health finding. */
export interface RepositoryHealthIssue {
  severity: HealthIssueSeverity;
  category?: HealthIssueCategory;
  code: string;
  message: string;
  path?: string;
  relativePath?: string;
  recovery?: string;
}

/** Repository health check result. */
export interface RepositoryHealthReport {
  ready: boolean;
  statusLevel: import('./import-rc.js').RepositoryStatusLevel;
  statusHeadline: string;
  statusSubline: string;
  repositoryPath: string;
  checkedAt: string;
  sourceCount: number;
  sessionCount: number;
  duplicateIds: string[];
  issues: RepositoryHealthIssue[];
  categorizedIssues: import('./import-rc.js').CategorizedHealthIssues;
  gitReady: boolean;
  gitBranch?: string;
  gitDirty?: boolean;
  gitReadiness: import('./import-rc.js').GitReadinessReport;
}

/** Import session manifest written before repository mutation. */
export interface ImportSessionManifest {
  sessionId: string;
  connectorId: string;
  sourceFile: string;
  startedAt: string;
  repositoryPath: string;
  snapshotPath?: string;
  validationPassed: boolean;
  plannedCreates: number;
  plannedUpdates: number;
  rollbackInfo: {
    snapshotDirectory: string;
    manifestPath: string;
  };
}

/** Repository statistics for dashboard. */
export interface RepositoryStats {
  repositoryPath: string;
  sourceCount: number;
  sessionCount: number;
  registryCount: number;
  lastImportDate?: string;
  lastSnapshotPath?: string;
  healthReady: boolean;
  issueCount: number;
}

/** Search result entry. */
export interface RepositorySearchResult {
  path: string;
  title: string;
  snippet: string;
  category: 'source' | 'session' | 'registry' | 'report' | 'attachment';
  score: number;
  evidenceKind?: import('./evidence-index.js').EvidenceRecordKind;
  recordId?: string;
  matchFields?: import('./evidence-index.js').EvidenceSearchMatchField[];
  krcId?: string;
  conversationTitle?: string;
  messageRole?: string;
  attachmentFilename?: string;
}

/** Browsable repository file entry. */
export interface RepositoryFileEntry {
  name: string;
  relativePath: string;
  category: 'sources' | 'sessions' | 'registries' | 'reports' | 'uploads' | 'other';
  sizeBytes?: number;
  modifiedAt?: string;
}
