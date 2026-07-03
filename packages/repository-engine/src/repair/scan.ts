import fs from 'node:fs/promises';
import path from 'node:path';

const KRC_PATTERN = /KRC-(\d{4})/i;

export interface ScannedSourceFile {
  absolutePath: string;
  relativePath: string;
  fileName: string;
  krcId: string | null;
  categoryFolder: string;
  mtimeMs: number;
}

export interface ScannedSessionFile {
  absolutePath: string;
  relativePath: string;
  fileName: string;
  krcId: string | null;
  categoryFolder: string;
}

export interface RegistryRow {
  krcId: string;
  title: string;
  line: string;
}

export async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function collectMarkdownFiles(dir: string): Promise<string[]> {
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

export function toRelative(repositoryPath: string, absolutePath: string): string {
  return path.relative(repositoryPath, absolutePath).replace(/\\/g, '/');
}

export function extractKrcId(fileName: string): string | null {
  const match = fileName.match(KRC_PATTERN);
  return match ? match[0].toUpperCase() : null;
}

export function categoryFromRelative(relativePath: string, root: 'Sources' | 'ExecutiveSessions'): string {
  const parts = relativePath.replace(/\\/g, '/').split('/');
  if (parts[0] === root && parts.length >= 2) return parts[1] ?? '';
  return '';
}

export async function scanSources(repositoryPath: string): Promise<ScannedSourceFile[]> {
  const sourcesDir = path.join(repositoryPath, 'Sources');
  const files = await collectMarkdownFiles(sourcesDir);
  const results: ScannedSourceFile[] = [];

  for (const absolutePath of files) {
    const relativePath = toRelative(repositoryPath, absolutePath);
    const fileName = path.basename(absolutePath);
    const stat = await fs.stat(absolutePath);
    results.push({
      absolutePath,
      relativePath,
      fileName,
      krcId: extractKrcId(fileName),
      categoryFolder: categoryFromRelative(relativePath, 'Sources'),
      mtimeMs: stat.mtimeMs,
    });
  }

  return results;
}

export async function scanSessions(repositoryPath: string): Promise<ScannedSessionFile[]> {
  const sessionsDir = path.join(repositoryPath, 'ExecutiveSessions');
  const files = await collectMarkdownFiles(sessionsDir);
  const results: ScannedSessionFile[] = [];

  for (const absolutePath of files) {
    const relativePath = toRelative(repositoryPath, absolutePath);
    const fileName = path.basename(absolutePath);
    results.push({
      absolutePath,
      relativePath,
      fileName,
      krcId: extractKrcId(fileName),
      categoryFolder: categoryFromRelative(relativePath, 'ExecutiveSessions'),
    });
  }

  return results;
}

export async function parseSourceRegistry(repositoryPath: string): Promise<RegistryRow[]> {
  const registryPath = path.join(repositoryPath, 'Registries', 'SOURCE_REGISTRY.md');
  const rows: RegistryRow[] = [];

  try {
    const content = await fs.readFile(registryPath, 'utf8');
    for (const line of content.split('\n')) {
      const match = line.match(/^\|\s*(KRC-\d{4})\s*\|\s*([^|]+)\s*\|/);
      if (match) {
        rows.push({
          krcId: match[1].toUpperCase(),
          title: match[2].trim(),
          line,
        });
      }
    }
  } catch {
    // Registry may not exist
  }

  return rows;
}

export async function listUploadFolders(repositoryPath: string): Promise<string[]> {
  const uploadsDir = path.join(repositoryPath, 'Uploads');
  if (!(await pathExists(uploadsDir))) return [];

  const entries = await fs.readdir(uploadsDir, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => `Uploads/${e.name}`);
}
