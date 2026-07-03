import fs from 'node:fs/promises';
import path from 'node:path';

interface RegistryEntry {
  krcId: string;
  title: string;
  topic: string;
  primaryProduct: string;
  status: string;
}

function deriveTopicFromContent(content: string): string {
  const match = content.match(/## Topic\s*\n([^\n#]+)/);
  return match?.[1]?.trim() ?? 'ChatGPT conversation import';
}

/** Appends new entries to SOURCE_REGISTRY.md without removing existing rows. */
export async function appendSourceRegistry(
  repositoryPath: string,
  entries: RegistryEntry[],
): Promise<void> {
  if (entries.length === 0) return;

  const registryPath = path.join(repositoryPath, 'Registries', 'SOURCE_REGISTRY.md');
  let content: string;

  try {
    content = await fs.readFile(registryPath, 'utf8');
  } catch {
    content = [
      '# Axiom Source Registry',
      '',
      'Campaign: Knowledge Recovery Campaign',
      'Repository Version: v0.3',
      'Sources Inventoried: 0',
      '',
      '| Source ID | Title | Topic | Primary Product | Status |',
      '|---|---|---|---|---|',
    ].join('\n');
  }

  const newRows = entries
    .map(
      (e) =>
        `| ${e.krcId} | ${e.title.replace(/\|/g, '\\|')} | ${e.topic.replace(/\|/g, '\\|')} | ${e.primaryProduct} | ${e.status} |`,
    )
    .join('\n');

  content = content.trimEnd() + '\n' + newRows + '\n';

  const totalMatch = content.match(/Sources Inventoried:\s*(\d+)/);
  const existingCount = totalMatch ? parseInt(totalMatch[1], 10) : 0;
  const newCount = existingCount + entries.length;
  content = content.replace(
    /Sources Inventoried:\s*\d+/,
    `Sources Inventoried: ${newCount}`,
  );

  await fs.writeFile(registryPath, content, 'utf8');
}

/** Updates KRC_STATUS.md with new source count and import note. */
export async function updateKrcStatus(
  repositoryPath: string,
  sourcesAdded: number,
  batchLabel: string,
): Promise<void> {
  if (sourcesAdded === 0) return;

  const statusPath = path.join(repositoryPath, 'Registries', 'KRC_STATUS.md');
  let content: string;

  try {
    content = await fs.readFile(statusPath, 'utf8');
  } catch {
    content = [
      '# Knowledge Recovery Campaign',
      '',
      'Repository Version: v0.5',
      '',
      'Approximate Sources Inventoried: 0',
    ].join('\n');
  }

  const approxMatch = content.match(/Approximate Sources Inventoried:\s*(\d+)/);
  const currentApprox = approxMatch ? parseInt(approxMatch[1], 10) : 0;
  content = content.replace(
    /Approximate Sources Inventoried:\s*\d+/,
    `Approximate Sources Inventoried: ${currentApprox + sourcesAdded}`,
  );

  const importNote = `\n${batchLabel}\n- KAE import: ${sourcesAdded} new source(s) on ${new Date().toISOString().slice(0, 10)}`;
  if (!content.includes(batchLabel)) {
    content = content.trimEnd() + importNote + '\n';
  }

  await fs.writeFile(statusPath, content, 'utf8');
}

/** Builds registry entry from written source content. */
export function buildRegistryEntry(
  krcId: string,
  title: string,
  markdownContent: string,
  primaryProduct?: string,
): RegistryEntry {
  return {
    krcId,
    title,
    topic: deriveTopicFromContent(markdownContent),
    primaryProduct: primaryProduct ?? 'TBD',
    status: markdownContent.includes('Review Needed') ? 'Review Needed' : 'Inventoried',
  };
}
