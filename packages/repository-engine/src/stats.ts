import fs from 'node:fs/promises';
import path from 'node:path';
import type { RepositoryStats } from '@scooper/core';
import { checkRepositoryHealth } from './health-check.js';

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

async function readLastImportDate(repositoryPath: string): Promise<string | undefined> {
  const reviewPath = path.join(repositoryPath, 'Registries', 'IMPORT_REVIEW.md');
  try {
    const content = await fs.readFile(reviewPath, 'utf8');
    const match = content.match(/Import Date:\s*([^\n]+)/i);
    return match?.[1]?.trim();
  } catch {
    return undefined;
  }
}

/** Collects repository statistics for the dashboard. */
export async function getRepositoryStats(repositoryPath: string): Promise<RepositoryStats> {
  const health = await checkRepositoryHealth(repositoryPath);
  let registryCount = 0;
  try {
    const regDir = path.join(repositoryPath, 'Registries');
    const files = await fs.readdir(regDir);
    registryCount = files.filter((f) => f.endsWith('.md')).length;
  } catch {
    registryCount = 0;
  }

  return {
    repositoryPath,
    sourceCount: health.sourceCount,
    sessionCount: health.sessionCount,
    registryCount,
    lastImportDate: await readLastImportDate(repositoryPath),
    lastSnapshotPath: await findLatestSnapshot(repositoryPath),
    healthReady: health.ready,
    issueCount: health.issues.length,
  };
}
