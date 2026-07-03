import fs from 'node:fs/promises';
import path from 'node:path';
import type { RepositoryFileEntry, RepositorySearchResult } from '@scooper/core';

function categorizeRelativePath(relativePath: string): RepositoryFileEntry['category'] {
  const normalized = relativePath.replace(/\\/g, '/');
  if (normalized.startsWith('Sources/')) return 'sources';
  if (normalized.startsWith('ExecutiveSessions/')) return 'sessions';
  if (normalized.startsWith('Registries/')) return 'registries';
  if (normalized.startsWith('ImportReports/')) return 'reports';
  if (normalized.startsWith('Uploads/')) return 'uploads';
  return 'other';
}

async function walkRepository(
  root: string,
  current: string,
  entries: RepositoryFileEntry[],
): Promise<void> {
  const dirEntries = await fs.readdir(current, { withFileTypes: true });
  for (const entry of dirEntries) {
    if (entry.name.startsWith('.kae-')) continue;
    const full = path.join(current, entry.name);
    const relative = path.relative(root, full).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      await walkRepository(root, full, entries);
    } else if (entry.name.endsWith('.md') || entry.name.endsWith('.json')) {
      let sizeBytes: number | undefined;
      let modifiedAt: string | undefined;
      try {
        const stat = await fs.stat(full);
        sizeBytes = stat.size;
        modifiedAt = stat.mtime.toISOString();
      } catch {
        // ignore
      }
      entries.push({
        name: entry.name,
        relativePath: relative,
        category: categorizeRelativePath(relative),
        sizeBytes,
        modifiedAt,
      });
    }
  }
}

/** Lists browsable repository files. */
export async function browseRepository(repositoryPath: string): Promise<RepositoryFileEntry[]> {
  const entries: RepositoryFileEntry[] = [];
  try {
    await fs.access(repositoryPath);
    await walkRepository(repositoryPath, repositoryPath, entries);
  } catch {
    return [];
  }
  return entries.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

/** Reads a repository file for preview. */
export async function readRepositoryFile(
  repositoryPath: string,
  relativePath: string,
): Promise<string> {
  const full = path.join(repositoryPath, relativePath);
  const normalizedRoot = path.resolve(repositoryPath);
  const normalizedFull = path.resolve(full);
  if (!normalizedFull.startsWith(normalizedRoot)) {
    throw new Error('Invalid file path.');
  }
  return fs.readFile(full, 'utf8');
}

function snippetAroundMatch(content: string, index: number, radius = 80): string {
  const start = Math.max(0, index - radius);
  const end = Math.min(content.length, index + radius);
  return content.slice(start, end).replace(/\s+/g, ' ').trim();
}

/** Searches markdown knowledge across the repository. */
export async function searchRepository(
  repositoryPath: string,
  query: string,
  limit = 50,
): Promise<RepositorySearchResult[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const files = await browseRepository(repositoryPath);
  const results: RepositorySearchResult[] = [];

  for (const file of files) {
    if (!file.relativePath.endsWith('.md')) continue;
    let content: string;
    try {
      content = await readRepositoryFile(repositoryPath, file.relativePath);
    } catch {
      continue;
    }

    const lower = content.toLowerCase();
    const titleMatch = file.name.replace(/\.md$/i, '');
    let score = 0;
    if (titleMatch.toLowerCase().includes(q)) score += 10;
    const occurrences = lower.split(q).length - 1;
    if (occurrences === 0) continue;
    score += occurrences;

    const index = lower.indexOf(q);
    results.push({
      path: file.relativePath,
      title: titleMatch,
      snippet: snippetAroundMatch(content, index),
      category:
        file.category === 'sessions'
          ? 'session'
          : file.category === 'registries'
            ? 'registry'
            : file.category === 'reports'
              ? 'report'
              : 'source',
      score,
    });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}
