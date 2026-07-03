import { randomUUID } from 'node:crypto';
import type { RepairPlan } from '@scooper/core';
import { analyzeRepositoryRepair } from './analyze.js';

/** Generates a repair plan with proposed actions for each detected issue. */
export async function generateRepairPlan(repositoryPath: string): Promise<RepairPlan> {
  const issues = await analyzeRepositoryRepair(repositoryPath);
  const actions: RepairPlan['actions'] = [];

  for (const repairIssue of issues) {
    switch (repairIssue.type) {
      case 'duplicate-krc-id': {
        const paths = repairIssue.affectedFiles;
        const mtimes = (repairIssue.details?.mtimes as number[] | undefined) ?? [];
        const sorted = [...paths].sort((a, b) => {
          const aIdx = paths.indexOf(a);
          const bIdx = paths.indexOf(b);
          return (mtimes[aIdx] ?? 0) - (mtimes[bIdx] ?? 0);
        });
        const canonical = sorted[0]!;
        for (const duplicatePath of sorted.slice(1)) {
          actions.push({
            id: randomUUID(),
            issueId: repairIssue.id,
            type: 'reassign-krc-id',
            description: `Reassign duplicate ${repairIssue.krcId} in ${duplicatePath}`,
            proposedFix: `Assign next available KRC ID, rename file, update metadata, generate session, add registry entry. Canonical: ${canonical}`,
            riskLevel: 'medium',
            autoRepairSafe: true,
            manualReviewRequired: false,
            affectedFiles: [duplicatePath],
            metadata: {
              oldKrcId: repairIssue.krcId,
              canonicalPath: canonical,
            },
          });
        }
        break;
      }

      case 'missing-executive-session':
        actions.push({
          id: randomUUID(),
          issueId: repairIssue.id,
          type: 'generate-executive-session',
          description: `Generate executive session for ${repairIssue.krcId}`,
          proposedFix:
            'Create placeholder executive session from source metadata with repair provenance note',
          riskLevel: 'low',
          autoRepairSafe: true,
          manualReviewRequired: false,
          affectedFiles: repairIssue.affectedFiles,
          metadata: { krcId: repairIssue.krcId },
        });
        break;

      case 'missing-registry-entry':
        actions.push({
          id: randomUUID(),
          issueId: repairIssue.id,
          type: 'add-registry-entry',
          description: `Add registry entry for ${repairIssue.krcId}`,
          proposedFix: 'Append row to SOURCE_REGISTRY.md from source file metadata',
          riskLevel: 'low',
          autoRepairSafe: true,
          manualReviewRequired: false,
          affectedFiles: repairIssue.affectedFiles,
          metadata: { krcId: repairIssue.krcId },
        });
        break;

      case 'source-session-mismatch':
        actions.push({
          id: randomUUID(),
          issueId: repairIssue.id,
          type: 'generate-executive-session',
          description: `Regenerate session in matching category for ${repairIssue.krcId}`,
          proposedFix:
            'Generate new executive session in source category folder; preserve existing session for manual review',
          riskLevel: 'medium',
          autoRepairSafe: false,
          manualReviewRequired: true,
          affectedFiles: repairIssue.affectedFiles,
          metadata: { krcId: repairIssue.krcId },
        });
        break;

      case 'orphan-executive-session':
        actions.push({
          id: randomUUID(),
          issueId: repairIssue.id,
          type: 'flag-manual-review',
          description: `Review orphan session for ${repairIssue.krcId}`,
          proposedFix: 'Manual review required — do not delete without confirmation',
          riskLevel: 'high',
          autoRepairSafe: false,
          manualReviewRequired: true,
          affectedFiles: repairIssue.affectedFiles,
        });
        break;

      case 'broken-registry-reference':
        actions.push({
          id: randomUUID(),
          issueId: repairIssue.id,
          type: 'flag-manual-review',
          description: `Review broken registry reference for ${repairIssue.krcId}`,
          proposedFix: 'Manual review required — registry row references missing source',
          riskLevel: 'medium',
          autoRepairSafe: false,
          manualReviewRequired: true,
          affectedFiles: repairIssue.affectedFiles,
          metadata: { krcId: repairIssue.krcId },
        });
        break;

      case 'invalid-krc-filename':
        actions.push({
          id: randomUUID(),
          issueId: repairIssue.id,
          type: 'move-to-review',
          description: `Review source with invalid KRC filename: ${repairIssue.affectedFiles[0]}`,
          proposedFix:
            'Move to Other_Review_Needed and assign new KRC ID — requires manual confirmation',
          riskLevel: 'high',
          autoRepairSafe: false,
          manualReviewRequired: true,
          affectedFiles: repairIssue.affectedFiles,
        });
        break;

      case 'upload-folder-mismatch':
        actions.push({
          id: randomUUID(),
          issueId: repairIssue.id,
          type: 'flag-manual-review',
          description: 'Review missing upload folders',
          proposedFix: 'Informational — re-import or verify asset uploads manually',
          riskLevel: 'low',
          autoRepairSafe: false,
          manualReviewRequired: true,
          affectedFiles: repairIssue.affectedFiles,
        });
        break;

      default:
        break;
    }
  }

  const autoRepairCount = actions.filter((a) => a.autoRepairSafe && !a.manualReviewRequired).length;
  const manualReviewCount = actions.filter((a) => a.manualReviewRequired).length;

  return {
    analyzedAt: new Date().toISOString(),
    repositoryPath,
    issues,
    actions,
    autoRepairCount,
    manualReviewCount,
  };
}
