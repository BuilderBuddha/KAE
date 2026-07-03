import type { RepositoryHealthReport } from './repository.js';

/** Repository integrity issue types detected during repair analysis. */
export type RepairIssueType =
  | 'duplicate-krc-id'
  | 'missing-executive-session'
  | 'orphan-executive-session'
  | 'orphan-source-file'
  | 'broken-registry-reference'
  | 'missing-registry-entry'
  | 'invalid-krc-filename'
  | 'source-session-mismatch'
  | 'upload-folder-mismatch';

export type RepairRiskLevel = 'low' | 'medium' | 'high';

export type RepairActionType =
  | 'reassign-krc-id'
  | 'generate-executive-session'
  | 'add-registry-entry'
  | 'update-registry-reference'
  | 'move-to-review'
  | 'flag-manual-review';

/** A detected repository integrity issue. */
export interface RepairIssue {
  id: string;
  type: RepairIssueType;
  message: string;
  affectedFiles: string[];
  krcId?: string;
  details?: Record<string, unknown>;
}

/** A proposed repair action for one or more issues. */
export interface RepairAction {
  id: string;
  issueId: string;
  type: RepairActionType;
  description: string;
  proposedFix: string;
  riskLevel: RepairRiskLevel;
  autoRepairSafe: boolean;
  manualReviewRequired: boolean;
  affectedFiles: string[];
  targetFiles?: string[];
  metadata?: Record<string, unknown>;
}

/** Read-only repair plan generated before any mutations. */
export interface RepairPlan {
  analyzedAt: string;
  repositoryPath: string;
  issues: RepairIssue[];
  actions: RepairAction[];
  autoRepairCount: number;
  manualReviewCount: number;
}

/** Result of a single executed repair action. */
export interface RepairActionResult {
  actionId: string;
  type: RepairActionType;
  success: boolean;
  message: string;
  filesChanged: string[];
}

/** Summary returned after repair execution. */
export interface RepairResult {
  completedAt: string;
  snapshotPath: string;
  actionsExecuted: RepairActionResult[];
  actionsSkipped: number;
  filesChanged: string[];
  healthBefore: RepositoryHealthReport;
  healthAfter: RepositoryHealthReport;
}
