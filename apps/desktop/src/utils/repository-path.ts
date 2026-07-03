/** Breadcrumb segments from a repository-relative path. */
export function pathBreadcrumbs(relativePath: string): string[] {
  return relativePath.split(/[/\\]/).filter(Boolean);
}

/** Parent folder label for grouping repository entries. */
export function parentFolder(relativePath: string): string {
  const parts = pathBreadcrumbs(relativePath);
  if (parts.length <= 1) return '/';
  return parts.slice(0, -1).join('/');
}
