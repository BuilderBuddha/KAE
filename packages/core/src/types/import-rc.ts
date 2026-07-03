/** Preview of repository changes before import (read-only). */
export interface ImportDiffPreview {
  sourcesAdded: string[];
  sourcesUpdated: string[];
  sessionsAdded: string[];
  sessionsUpdated: string[];
  registriesUpdated: string[];
  uploadsAdded: string[];
  duplicatesSkipped: string[];
  modifiedFiles: string[];
  deletedFiles: string[];
  estimatedTotalChanges: number;
}

/** Import pipeline timeline step. */
export type ImportTimelineStepId =
  | 'validate-zip'
  | 'analyze-export'
  | 'generate-sources'
  | 'create-snapshot'
  | 'update-repository'
  | 'update-registries'
  | 'health-check'
  | 'git-readiness'
  | 'complete';

export type ImportTimelineStepStatus = 'pending' | 'running' | 'complete' | 'failed' | 'skipped';

export interface ImportTimelineStep {
  id: ImportTimelineStepId;
  label: string;
  status: ImportTimelineStepStatus;
  detail?: string;
}

/** Validation pipeline stage identifiers. */
export type ValidationStageId =
  | 'zip-selected'
  | 'zip-opening'
  | 'zip-opened'
  | 'entries-discovered'
  | 'conversations-json-located'
  | 'parsing-started'
  | 'parsing-conversations'
  | 'planning-import'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type ValidationProgressStatus = 'running' | 'complete' | 'failed' | 'cancelled';

/** Live validation progress emitted during read-only ZIP analysis. */
export interface ValidationProgress {
  status: ValidationProgressStatus;
  stage: ValidationStageId;
  stageLabel: string;
  detail?: string;
  fileName?: string;
  archiveEntryCount?: number;
  conversationsJsonPath?: string;
  conversationsJsonSizeBytes?: number;
  conversationsTotal: number;
  conversationsProcessed: number;
  messagesProcessed: number;
  warningsGenerated: number;
  startedAt: string;
  elapsedMs: number;
  error?: string;
}

/** Git readiness verification result. */
export interface GitReadinessCheck {
  id: string;
  label: string;
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface GitReadinessReport {
  ready: boolean;
  status: 'READY' | 'NOT READY';
  checks: GitReadinessCheck[];
}

/** Professional import report saved to repository. */
export interface ImportReport {
  reportId: string;
  generatedAt: string;
  durationMs: number;
  connectorId: string;
  connectorName: string;
  sourceFile: string;
  repositoryPath: string;
  imported: number;
  updated: number;
  skipped: number;
  warnings: string[];
  errors: string[];
  sourcesCreated: string[];
  sessionsCreated: number;
  registriesUpdated: string[];
  snapshotPath?: string;
  manifestPath?: string;
  gitReadiness: GitReadinessReport;
  reportFilePath: string;
}

/** Repository health status for dashboard display. */
export type RepositoryStatusLevel = 'healthy' | 'attention' | 'critical';

export interface CategorizedHealthIssues {
  errors: import('./repository.js').RepositoryHealthIssue[];
  warnings: import('./repository.js').RepositoryHealthIssue[];
  information: import('./repository.js').RepositoryHealthIssue[];
  recommendations: import('./repository.js').RepositoryHealthIssue[];
}
