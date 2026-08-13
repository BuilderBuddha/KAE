import fs from 'node:fs/promises';
import path from 'node:path';

const KRC_ID_PATTERN = /KRC-(\d{4})/gi;
/** ChatGPT Import identity heading (preserved). */
const CONVERSATION_ID_PATTERN = /## ChatGPT Conversation ID\s*\n([^\n]+)/;
/** YouTube / connector internal identity (Checkpoint B). */
const SOURCE_KEY_PATTERN = /## Source Key\s*\n([^\n]+)/;

const CATEGORY_SUBDIRS = [
  'VIGS',
  'Founder_OS',
  'Axiom',
  'Book',
  'Knowledge_Recovery',
  'Source_Material',
  'Technical_Build',
  'Other_Review_Needed',
];

/** Recursively lists all .md files under a directory. */
async function listMarkdownFilesRecursive(dir: string): Promise<string[]> {
  const results: string[] = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await listMarkdownFilesRecursive(fullPath)));
    } else if (entry.name.endsWith('.md')) {
      results.push(fullPath);
    }
  }
  return results;
}

/** Finds the highest existing KRC numeric ID in the repository. */
export async function findHighestKrcNumber(repositoryPath: string): Promise<number> {
  let highest = 0;
  const sourcesDir = path.join(repositoryPath, 'Sources');

  const files = await listMarkdownFilesRecursive(sourcesDir);
  for (const filePath of files) {
    const base = path.basename(filePath);
    const match = base.match(/KRC-(\d{4})/i);
    if (match) highest = Math.max(highest, parseInt(match[1], 10));
  }

  const registryPath = path.join(repositoryPath, 'Registries', 'SOURCE_REGISTRY.md');
  try {
    const registry = await fs.readFile(registryPath, 'utf8');
    for (const match of registry.matchAll(KRC_ID_PATTERN)) {
      highest = Math.max(highest, parseInt(match[1], 10));
    }
  } catch {
    // Registry may not exist yet
  }

  return highest;
}

/** Formats a KRC source ID string. */
export function formatKrcId(num: number): string {
  return `KRC-${String(num).padStart(4, '0')}`;
}

/** Builds a safe filename slug from a title. */
export function slugifyTitle(title: string): string {
  return title
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 80) || 'Untitled';
}

/** Maps conversation IDs to existing KRC source IDs in the repository. */
export async function loadExistingConversationMap(
  repositoryPath: string,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const sourcesDir = path.join(repositoryPath, 'Sources');
  const files = await listMarkdownFilesRecursive(sourcesDir);

  for (const filePath of files) {
    const base = path.basename(filePath);
    const krcMatch = base.match(/^(KRC-\d{4})/i);
    if (!krcMatch) continue;

    const content = await fs.readFile(filePath, 'utf8');
    const sourceKeyMatch = content.match(SOURCE_KEY_PATTERN);
    const convMatch = content.match(CONVERSATION_ID_PATTERN);
    const identity = (sourceKeyMatch?.[1] ?? convMatch?.[1])?.trim();
    if (identity) {
      map.set(identity, krcMatch[1].toUpperCase());
    }
  }

  return map;
}

/** Ensures required repository directories exist. */
export async function ensureRepositoryDirs(repositoryPath: string): Promise<void> {
  await fs.mkdir(path.join(repositoryPath, 'Sources'), { recursive: true });
  await fs.mkdir(path.join(repositoryPath, 'Uploads'), { recursive: true });
  await fs.mkdir(path.join(repositoryPath, 'Registries'), { recursive: true });
  await fs.mkdir(path.join(repositoryPath, 'ExecutiveSessions'), { recursive: true });

  for (const sub of CATEGORY_SUBDIRS) {
    await fs.mkdir(path.join(repositoryPath, 'Sources', sub), { recursive: true });
    await fs.mkdir(path.join(repositoryPath, 'ExecutiveSessions', sub), { recursive: true });
  }
}

/** Safely writes a file only if it does not exist, unless overwrite is allowed. */
export async function safeWriteFile(
  filePath: string,
  content: string,
  overwrite: boolean,
): Promise<'created' | 'skipped' | 'updated'> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  try {
    await fs.access(filePath);
    if (!overwrite) return 'skipped';
    await fs.writeFile(filePath, content, 'utf8');
    return 'updated';
  } catch {
    await fs.writeFile(filePath, content, 'utf8');
    return 'created';
  }
}

/** Safely writes a binary file. */
export async function safeWriteBinaryFile(
  filePath: string,
  data: Buffer,
  overwrite: boolean,
): Promise<'created' | 'skipped' | 'updated'> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  try {
    await fs.access(filePath);
    if (!overwrite) return 'skipped';
    await fs.writeFile(filePath, data);
    return 'updated';
  } catch {
    await fs.writeFile(filePath, data);
    return 'created';
  }
}
