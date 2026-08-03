import { isChatGptImportSourceFileName } from './chatgpt-import';

/** Normalize repository-relative paths for equality checks. */
export function normalizeRepoRelativePath(relativePath: string): string {
  return relativePath.replace(/\\/g, '/').replace(/^\/+/, '').trim();
}

export function repoPathsEqual(a: string, b: string): boolean {
  return normalizeRepoRelativePath(a).toLowerCase() === normalizeRepoRelativePath(b).toLowerCase();
}

/** Investigation topic suggests the ChatGPT Import category (not a filename query). */
export function investigationSuggestsChatGptImport(topicOrQuery: string): boolean {
  const q = topicOrQuery.trim().toLowerCase();
  if (!q) return false;
  return /chatgpt/.test(q);
}

/**
 * Inherited investigation phrases must not become filename substring filters.
 * Only explicit user-typed search applies to names/paths/titles.
 */
export function resolveExplorerFilenameSearch(input: {
  userEnteredSearch: string;
  investigationSearchQuery?: string | null;
}): string {
  return input.userEnteredSearch.trim();
}

export interface ChatGptBrowseEntry {
  relativePath: string;
  name: string;
  title: string;
  krcId: string;
}

export interface RepositoryBrowseEntry {
  relativePath: string;
  name: string;
  category: string;
}

/**
 * Filter ChatGPT Import entries: category list + optional user filename search.
 * Count for the tab should use the unfiltered import list length (caller).
 */
export function filterChatGptImportEntries<T extends ChatGptBrowseEntry>(
  entries: T[],
  userFilenameSearch: string,
): T[] {
  const q = userFilenameSearch.trim().toLowerCase();
  if (!q) return entries;
  return entries.filter(
    (entry) =>
      entry.relativePath.toLowerCase().includes(q) ||
      entry.name.toLowerCase().includes(q) ||
      entry.title.toLowerCase().includes(q) ||
      entry.krcId.toLowerCase().includes(q),
  );
}

export function filterRepositoryEntries<T extends RepositoryBrowseEntry>(
  entries: T[],
  categoryFilter: string,
  userFilenameSearch: string,
): T[] {
  const q = userFilenameSearch.trim().toLowerCase();
  return entries.filter((f) => {
    if (categoryFilter !== 'all' && categoryFilter !== 'chatgpt-import' && f.category !== categoryFilter) {
      return false;
    }
    if (!q) return true;
    return f.relativePath.toLowerCase().includes(q) || f.name.toLowerCase().includes(q);
  });
}

/**
 * Ensure an open-in-Explorer target remains visible even when user filters would hide it.
 * Returns the display list and whether the target was force-included.
 */
export function ensurePinnedEntryVisible<T extends { relativePath: string }>(
  filtered: T[],
  allCandidates: T[],
  pinnedRelativePath: string | null,
): { list: T[]; pinnedIncluded: boolean; pinnedFound: boolean } {
  if (!pinnedRelativePath) {
    return { list: filtered, pinnedIncluded: false, pinnedFound: false };
  }
  const already = filtered.some((entry) => repoPathsEqual(entry.relativePath, pinnedRelativePath));
  if (already) {
    return { list: filtered, pinnedIncluded: false, pinnedFound: true };
  }
  const pinned = allCandidates.find((entry) => repoPathsEqual(entry.relativePath, pinnedRelativePath));
  if (!pinned) {
    return { list: filtered, pinnedIncluded: false, pinnedFound: false };
  }
  return { list: [pinned, ...filtered], pinnedIncluded: true, pinnedFound: true };
}

/** Pick Explorer category when opening a concrete path. */
export function filterForOpenedPath(relativePath: string): 'chatgpt-import' | 'all' {
  const fileName = relativePath.split(/[/\\]/).pop() ?? '';
  return isChatGptImportSourceFileName(fileName) ? 'chatgpt-import' : 'all';
}
