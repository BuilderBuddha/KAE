import { randomUUID } from 'node:crypto';
import type { RepairIssue } from '@scooper/core';
import {
  listUploadFolders,
  parseSourceRegistry,
  scanSessions,
  scanSources,
} from './scan.js';

function issue(
  type: RepairIssue['type'],
  message: string,
  affectedFiles: string[],
  extra?: Partial<RepairIssue>,
): RepairIssue {
  return {
    id: randomUUID(),
    type,
    message,
    affectedFiles,
    ...extra,
  };
}

/** Analyzes repository integrity and returns detected issues (read-only). */
export async function analyzeRepositoryRepair(repositoryPath: string): Promise<RepairIssue[]> {
  const issues: RepairIssue[] = [];
  const sources = await scanSources(repositoryPath);
  const sessions = await scanSessions(repositoryPath);
  const registryRows = await parseSourceRegistry(repositoryPath);
  const uploadFolders = await listUploadFolders(repositoryPath);

  const sourcesByKrc = new Map<string, typeof sources>();
  const sessionsByKrc = new Map<string, typeof sessions>();
  const registryByKrc = new Map(registryRows.map((r) => [r.krcId, r]));

  for (const source of sources) {
    if (!source.krcId) {
      issues.push(
        issue(
          'invalid-krc-filename',
          `Source file has no valid KRC ID pattern: ${source.fileName}`,
          [source.relativePath],
        ),
      );
      continue;
    }
    const list = sourcesByKrc.get(source.krcId) ?? [];
    list.push(source);
    sourcesByKrc.set(source.krcId, list);
  }

  for (const session of sessions) {
    if (!session.krcId) continue;
    const list = sessionsByKrc.get(session.krcId) ?? [];
    list.push(session);
    sessionsByKrc.set(session.krcId, list);
  }

  for (const [krcId, locations] of sourcesByKrc) {
    if (locations.length > 1) {
      const paths = locations.map((s) => s.relativePath);
      issues.push(
        issue(
          'duplicate-krc-id',
          `Duplicate KRC ID ${krcId} found in ${locations.length} source files`,
          paths,
          {
            krcId,
            details: {
              canonical: paths[0],
              duplicates: paths.slice(1),
              mtimes: locations.map((s) => s.mtimeMs),
            },
          },
        ),
      );
    }
  }

  for (const source of sources) {
    if (!source.krcId) continue;

    const sessionList = sessionsByKrc.get(source.krcId) ?? [];
    if (sessionList.length === 0) {
      issues.push(
        issue(
          'missing-executive-session',
          `No executive session found for ${source.krcId}`,
          [source.relativePath],
          { krcId: source.krcId },
        ),
      );
    } else {
      const session = sessionList[0]!;
      if (session.categoryFolder !== source.categoryFolder) {
        issues.push(
          issue(
            'source-session-mismatch',
            `Category mismatch for ${source.krcId}: source in ${source.categoryFolder}, session in ${session.categoryFolder}`,
            [source.relativePath, session.relativePath],
            { krcId: source.krcId },
          ),
        );
      }
    }

    if (!registryByKrc.has(source.krcId)) {
      issues.push(
        issue(
          'missing-registry-entry',
          `Source ${source.krcId} is missing from SOURCE_REGISTRY.md`,
          [source.relativePath, 'Registries/SOURCE_REGISTRY.md'],
          { krcId: source.krcId },
        ),
      );
    }
  }

  const sourceKrcIds = new Set(sources.map((s) => s.krcId).filter(Boolean) as string[]);

  for (const session of sessions) {
    if (!session.krcId) continue;
    if (!sourceKrcIds.has(session.krcId)) {
      issues.push(
        issue(
          'orphan-executive-session',
          `Executive session exists without matching source for ${session.krcId}`,
          [session.relativePath],
          { krcId: session.krcId },
        ),
      );
    }
  }

  for (const row of registryRows) {
    if (!sourceKrcIds.has(row.krcId)) {
      issues.push(
        issue(
          'broken-registry-reference',
          `Registry references ${row.krcId} but no matching source file exists`,
          ['Registries/SOURCE_REGISTRY.md'],
          { krcId: row.krcId, details: { registryTitle: row.title } },
        ),
      );
    }
  }

  if (uploadFolders.length === 0 && sources.length > 0) {
    issues.push(
      issue(
        'upload-folder-mismatch',
        'No upload folders found under Uploads/ — imported assets may be missing',
        ['Uploads/'],
      ),
    );
  }

  return issues;
}
