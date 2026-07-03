import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  categorizeHealthIssues,
  getRepositoryStatusDisplay,
  type RepositoryHealthIssue,
  type RepositoryHealthReport,
} from '@scooper/core';
import { checkGitReadiness } from './git-readiness.js';

const execFileAsync = promisify(execFile);
const KRC_PATTERN = /KRC-\d{4}/g;

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function collectMarkdownFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  if (!(await pathExists(dir))) return results;

  async function walk(current: string): Promise<void> {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.name.endsWith('.md')) results.push(full);
    }
  }

  await walk(dir);
  return results;
}

function toRelative(repositoryPath: string, absolutePath: string): string {
  return path.relative(repositoryPath, absolutePath).replace(/\\/g, '/');
}

function pushIssue(issues: RepositoryHealthIssue[], issue: RepositoryHealthIssue): void {
  issues.push(issue);
}

/** Runs repository integrity checks without modifying files. */
export async function checkRepositoryHealth(
  repositoryPath: string,
): Promise<RepositoryHealthReport> {
  const issues: RepositoryHealthIssue[] = [];
  const duplicateIds: string[] = [];
  const idLocations = new Map<string, string[]>();

  if (!(await pathExists(repositoryPath))) {
    pushIssue(issues, {
      severity: 'warning',
      category: 'warning',
      code: 'REPO_MISSING',
      message: 'Repository path does not exist.',
      path: repositoryPath,
      recovery: 'Configure the repository path in Settings or import to create it.',
    });
  }

  const requiredDirs = ['Sources', 'ExecutiveSessions', 'Registries', 'Uploads'];
  for (const dir of requiredDirs) {
    const full = path.join(repositoryPath, dir);
    if (!(await pathExists(full))) {
      pushIssue(issues, {
        severity: 'warning',
        category: 'warning',
        code: 'MISSING_DIR',
        message: `Missing directory: ${dir}`,
        path: full,
        relativePath: dir,
        recovery: `Directory will be created automatically on first import.`,
      });
    }
  }

  const registries = ['SOURCE_REGISTRY.md', 'KRC_STATUS.md', 'IMPORT_REVIEW.md'];
  for (const file of registries) {
    const full = path.join(repositoryPath, 'Registries', file);
    if (!(await pathExists(full))) {
      pushIssue(issues, {
        severity: 'warning',
        category: 'warning',
        code: 'MISSING_REGISTRY',
        message: `Missing registry: ${file}`,
        path: full,
        relativePath: `Registries/${file}`,
        recovery: 'Registry files are created during the first successful import.',
      });
    }
  }

  const sourceFiles = await collectMarkdownFiles(path.join(repositoryPath, 'Sources'));
  const sessionFiles = await collectMarkdownFiles(path.join(repositoryPath, 'ExecutiveSessions'));
  const sessionByKrc = new Map<string, string>();

  for (const filePath of sessionFiles) {
    const name = path.basename(filePath);
    const match = name.match(KRC_PATTERN);
    if (match?.[0]) sessionByKrc.set(match[0], filePath);
  }

  for (const filePath of sourceFiles) {
    const name = path.basename(filePath);
    const relativePath = toRelative(repositoryPath, filePath);
    const matches = name.match(KRC_PATTERN);

    if (!matches) {
      pushIssue(issues, {
        severity: 'info',
        category: 'info',
        code: 'NO_KRC_ID',
        message: `Source file has no KRC ID in filename: ${name}`,
        path: filePath,
        relativePath,
      });
      continue;
    }

    for (const id of matches) {
      const list = idLocations.get(id) ?? [];
      list.push(filePath);
      idLocations.set(id, list);
    }

    if (/[<>:"|?*]/.test(name)) {
      pushIssue(issues, {
        severity: 'error',
        category: 'error',
        code: 'INVALID_FILENAME',
        message: `Invalid characters in filename: ${name}`,
        path: filePath,
        relativePath,
        recovery: 'Rename the file to remove invalid characters.',
      });
    }

    const krcId = matches[0];
    if (!sessionByKrc.has(krcId)) {
      pushIssue(issues, {
        severity: 'warning',
        category: 'warning',
        code: 'MISSING_SESSION',
        message: `No executive session found for ${krcId}`,
        path: filePath,
        relativePath,
        recovery: 'Re-import or manually create the executive session record.',
      });
    }

    try {
      const content = await fs.readFile(filePath, 'utf8');
      if (!content.includes('## Metadata') && !content.includes('Acquired by KAE')) {
        pushIssue(issues, {
          severity: 'info',
          category: 'info',
          code: 'MISSING_METADATA',
          message: `Source ${krcId} may be missing standard metadata block`,
          path: filePath,
          relativePath,
        });
      }
    } catch {
      pushIssue(issues, {
        severity: 'error',
        category: 'error',
        code: 'UNREADABLE_FILE',
        message: `Unable to read source file: ${name}`,
        path: filePath,
        relativePath,
        recovery: 'Verify file permissions and encoding.',
      });
    }
  }

  for (const [id, locations] of idLocations) {
    if (locations.length > 1) {
      duplicateIds.push(id);
      pushIssue(issues, {
        severity: 'error',
        category: 'error',
        code: 'DUPLICATE_ID',
        message: `Duplicate KRC ID ${id} found in ${locations.length} files`,
        path: locations[0],
        relativePath: toRelative(repositoryPath, locations[0]!),
        recovery: 'Remove or merge duplicate source files before committing.',
      });
    }
  }

  if (sourceFiles.length === 0 && (await pathExists(repositoryPath))) {
    pushIssue(issues, {
      severity: 'info',
      category: 'recommendation',
      code: 'EMPTY_SOURCES',
      message: 'No source files found in the repository.',
      recovery: 'Import a ChatGPT export to populate the knowledge repository.',
    });
  }

  if (!(await pathExists(path.join(repositoryPath, '.kae-snapshots')))) {
    pushIssue(issues, {
      severity: 'info',
      category: 'recommendation',
      code: 'NO_SNAPSHOTS',
      message: 'No import snapshots yet.',
      recovery: 'Snapshots are created automatically before each import.',
    });
  }

  let gitReady = false;
  let gitBranch: string | undefined;
  let gitDirty: boolean | undefined;

  try {
    const { stdout: branchOut } = await execFileAsync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      cwd: repositoryPath,
    });
    const { stdout: statusOut } = await execFileAsync('git', ['status', '--porcelain'], {
      cwd: repositoryPath,
    });
    gitReady = true;
    gitBranch = branchOut.trim();
    gitDirty = statusOut.trim().length > 0;

    if (gitDirty) {
      pushIssue(issues, {
        severity: 'info',
        category: 'recommendation',
        code: 'GIT_DIRTY',
        message: 'Git working tree has uncommitted changes.',
        recovery: 'Review changes and commit when ready.',
      });
    }
  } catch {
    pushIssue(issues, {
      severity: 'info',
      category: 'recommendation',
      code: 'NOT_GIT',
      message: 'Repository is not initialized as a Git repository.',
      recovery: 'Run git init in the repository folder for version control.',
    });
  }

  const categorizedIssues = categorizeHealthIssues(issues);
  const hasErrors = categorizedIssues.errors.length > 0;
  const partial: RepositoryHealthReport = {
    ready: !hasErrors && (await pathExists(repositoryPath)),
    statusLevel: 'healthy',
    statusHeadline: '',
    statusSubline: '',
    repositoryPath,
    checkedAt: new Date().toISOString(),
    sourceCount: sourceFiles.length,
    sessionCount: sessionFiles.length,
    duplicateIds,
    issues,
    categorizedIssues,
    gitReady,
    gitBranch,
    gitDirty,
    gitReadiness: { ready: false, status: 'NOT READY', checks: [] },
  };

  const status = getRepositoryStatusDisplay(partial);
  partial.statusLevel = status.level;
  partial.statusHeadline = status.headline;
  partial.statusSubline = status.subline;
  partial.gitReadiness = await checkGitReadiness(repositoryPath, partial);

  return partial;
}
