import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { GitReadinessReport, RepositoryHealthReport } from '@scooper/core';

const execFileAsync = promisify(execFile);

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function findLatestSnapshot(repositoryPath: string): Promise<string | undefined> {
  const snapshotsDir = path.join(repositoryPath, '.kae-snapshots');
  try {
    const entries = await fs.readdir(snapshotsDir);
    const sorted = entries.sort().reverse();
    return sorted[0] ? path.join(snapshotsDir, sorted[0]) : undefined;
  } catch {
    return undefined;
  }
}

/** Verifies Git and repository readiness for commit. */
export async function checkGitReadiness(
  repositoryPath: string,
  health?: RepositoryHealthReport,
): Promise<GitReadinessReport> {
  const checks: GitReadinessReport['checks'] = [];
  let gitReady = false;
  let gitBranch: string | undefined;
  let gitDirty = false;

  try {
    const { stdout: branchOut } = await execFileAsync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      cwd: repositoryPath,
    });
    gitBranch = branchOut.trim();
    gitReady = true;
    checks.push({
      id: 'git-repo',
      label: 'Git repository',
      passed: true,
      message: `Repository is under Git control (branch: ${gitBranch}).`,
      severity: 'info',
    });
  } catch {
    checks.push({
      id: 'git-repo',
      label: 'Git repository',
      passed: false,
      message: 'Repository path is not a Git repository.',
      severity: 'warning',
    });
  }

  if (gitReady) {
    try {
      const { stdout: statusOut } = await execFileAsync('git', ['status', '--porcelain'], {
        cwd: repositoryPath,
      });
      gitDirty = statusOut.trim().length > 0;
      checks.push({
        id: 'git-clean',
        label: 'Working tree clean',
        passed: !gitDirty,
        message: gitDirty
          ? 'Working tree has uncommitted changes.'
          : 'Working tree is clean.',
        severity: gitDirty ? 'warning' : 'info',
      });
    } catch {
      checks.push({
        id: 'git-clean',
        label: 'Working tree clean',
        passed: false,
        message: 'Unable to read Git status.',
        severity: 'warning',
      });
    }
  }

  const duplicateIds = health?.duplicateIds ?? [];
  checks.push({
    id: 'duplicate-ids',
    label: 'No duplicate KRC IDs',
    passed: duplicateIds.length === 0,
    message:
      duplicateIds.length === 0
        ? 'No duplicate source IDs detected.'
        : `${duplicateIds.length} duplicate ID(s): ${duplicateIds.slice(0, 5).join(', ')}${duplicateIds.length > 5 ? '…' : ''}`,
    severity: duplicateIds.length > 0 ? 'error' : 'info',
  });

  const missingRegistries =
    health?.categorizedIssues.warnings.filter((i) => i.code === 'MISSING_REGISTRY') ?? [];
  checks.push({
    id: 'registries',
    label: 'Required registries present',
    passed: missingRegistries.length === 0,
    message:
      missingRegistries.length === 0
        ? 'All required registries are present.'
        : `${missingRegistries.length} registry file(s) missing.`,
    severity: missingRegistries.length > 0 ? 'warning' : 'info',
  });

  const errors = health?.categorizedIssues.errors ?? [];
  checks.push({
    id: 'integrity',
    label: 'No integrity errors',
    passed: errors.length === 0,
    message:
      errors.length === 0
        ? 'No broken references or integrity errors detected.'
        : `${errors.length} integrity error(s) require attention.`,
    severity: errors.length > 0 ? 'error' : 'info',
  });

  const snapshotPath = await findLatestSnapshot(repositoryPath);
  checks.push({
    id: 'snapshot',
    label: 'Import snapshot available',
    passed: Boolean(snapshotPath),
    message: snapshotPath
      ? `Latest snapshot: ${path.basename(snapshotPath)}`
      : 'No import snapshot found (created automatically before imports).',
    severity: snapshotPath ? 'info' : 'info',
  });

  if (!(await pathExists(repositoryPath))) {
    checks.push({
      id: 'repo-exists',
      label: 'Repository path exists',
      passed: false,
      message: 'Repository path does not exist yet.',
      severity: 'warning',
    });
  }

  const blocking = checks.some((c) => !c.passed && c.severity === 'error');
  const ready = !blocking && duplicateIds.length === 0;

  return {
    ready,
    status: ready ? 'READY' : 'NOT READY',
    checks,
  };
}
