import type { RepositoryFileEntry } from '@scooper/core';
import { pathBreadcrumbs } from './repository-path';

export interface RepositoryTreeNode {
  id: string;
  label: string;
  path: string;
  kind: 'category' | 'folder';
  category?: RepositoryFileEntry['category'];
  children: RepositoryTreeNode[];
  fileCount: number;
}

export const CATEGORY_ROOTS: Record<RepositoryFileEntry['category'], string> = {
  sources: 'Sources',
  sessions: 'ExecutiveSessions',
  registries: 'Registries',
  reports: 'ImportReports',
  uploads: 'Uploads',
  other: '',
};

export const CATEGORY_LABELS: Record<RepositoryFileEntry['category'], string> = {
  sources: 'Knowledge / Sources',
  sessions: 'Executive Sessions',
  registries: 'Registries',
  reports: 'Import Reports',
  uploads: 'Uploads',
  other: 'Other',
};

const ROOT_BY_FOLDER = new Map(
  Object.entries(CATEGORY_ROOTS)
    .filter(([, folder]) => folder)
    .map(([category, folder]) => [folder, category as RepositoryFileEntry['category']]),
);

function insertFolder(parent: RepositoryTreeNode, segments: string[]): void {
  if (segments.length === 0) {
    parent.fileCount += 1;
    return;
  }
  const [head, ...rest] = segments;
  const childPath = `${parent.path}/${head}`;
  let child = parent.children.find((node) => node.label === head);
  if (!child) {
    child = {
      id: childPath,
      label: head,
      path: childPath,
      kind: 'folder',
      category: parent.category,
      children: [],
      fileCount: 0,
    };
    parent.children.push(child);
  }
  insertFolder(child, rest);
}

/** Build a GitHub-style folder tree from repository paths. */
export function buildRepositoryTree(files: RepositoryFileEntry[]): RepositoryTreeNode[] {
  const roots = new Map<string, RepositoryTreeNode>();

  for (const [category, folder] of Object.entries(CATEGORY_ROOTS)) {
    if (!folder) continue;
    roots.set(folder, {
      id: folder,
      label: CATEGORY_LABELS[category as RepositoryFileEntry['category']],
      path: folder,
      kind: 'category',
      category: category as RepositoryFileEntry['category'],
      children: [],
      fileCount: 0,
    });
  }

  for (const file of files) {
    const parts = pathBreadcrumbs(file.relativePath);
    const rootFolder = parts[0];
    const root = roots.get(rootFolder);
    if (!root) continue;
    root.fileCount += 1;
    const folderSegments = parts.slice(1, -1);
    if (folderSegments.length > 0) {
      insertFolder(root, folderSegments);
    }
  }

  const sortNodes = (nodes: RepositoryTreeNode[]): RepositoryTreeNode[] =>
    nodes
      .map((node) => ({ ...node, children: sortNodes(node.children) }))
      .filter((node) => node.fileCount > 0)
      .sort((a, b) => a.label.localeCompare(b.label));

  return sortNodes([...roots.values()]);
}

export function defaultTreePath(tree: RepositoryTreeNode[]): string {
  return tree[0]?.path ?? 'Sources';
}

export function labelForTreePath(path: string): string {
  const root = path.split('/')[0];
  const category = ROOT_BY_FOLDER.get(root);
  if (category && path === root) return CATEGORY_LABELS[category];
  return path.split('/').pop() ?? path;
}

export interface ExplorerFolderEntry {
  path: string;
  label: string;
  count: number;
}

/** Folders and files visible in the main pane for a tree selection. */
export function explorerContents(
  files: RepositoryFileEntry[],
  scopePath: string,
): { folders: ExplorerFolderEntry[]; files: RepositoryFileEntry[] } {
  const folderCounts = new Map<string, number>();
  const directFiles: RepositoryFileEntry[] = [];
  const prefix = `${scopePath}/`;

  for (const file of files) {
    if (file.relativePath === scopePath) {
      directFiles.push(file);
      continue;
    }
    if (!file.relativePath.startsWith(prefix)) continue;

    const remainder = file.relativePath.slice(prefix.length);
    const segments = remainder.split('/');
    if (segments.length === 1) {
      directFiles.push(file);
    } else {
      const childPath = `${scopePath}/${segments[0]}`;
      folderCounts.set(childPath, (folderCounts.get(childPath) ?? 0) + 1);
    }
  }

  return {
    folders: [...folderCounts.entries()]
      .map(([path, count]) => ({ path, label: path.split('/').pop() ?? path, count }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    files: directFiles.sort((a, b) => a.name.localeCompare(b.name)),
  };
}
