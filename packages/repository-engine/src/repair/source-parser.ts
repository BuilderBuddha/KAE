export interface ParsedSourceMetadata {
  krcId: string;
  title: string;
  primaryProduct: string;
  topic: string;
  status: string;
  conversationId?: string;
  createTime?: string;
  updateTime?: string;
  categoryFolder: string;
  transcriptReference?: string;
}

function sectionValue(content: string, heading: string): string | undefined {
  const regex = new RegExp(`## ${heading}\\s*\\n([^#\\n][^\\n]*)`, 'i');
  return content.match(regex)?.[1]?.trim();
}

/** Parses metadata from an existing KRC source markdown file. */
export function parseSourceMarkdown(
  content: string,
  relativePath: string,
): ParsedSourceMetadata {
  const fileName = relativePath.split('/').pop() ?? relativePath;
  const krcFromName = fileName.match(/KRC-\d{4}/i)?.[0]?.toUpperCase() ?? 'KRC-0000';
  const titleMatch = content.match(/^#\s*(KRC-\d{4})\s*[—–-]\s*(.+)$/m);
  const title = titleMatch?.[2]?.trim() ?? sectionValue(content, 'Description') ?? 'Untitled';
  const parts = relativePath.replace(/\\/g, '/').split('/');
  const categoryFolder = parts[0] === 'Sources' && parts.length >= 2 ? parts[1]! : 'Other_Review_Needed';

  return {
    krcId: krcFromName,
    title,
    primaryProduct: sectionValue(content, 'Primary Product') ?? 'Review Needed',
    topic: sectionValue(content, 'Topic') ?? 'ChatGPT conversation',
    status: sectionValue(content, 'Status') ?? 'Inventoried',
    conversationId: sectionValue(content, 'ChatGPT Conversation ID'),
    createTime: sectionValue(content, 'Create Time'),
    updateTime: sectionValue(content, 'Update Time'),
    categoryFolder,
  };
}

/** Updates KRC ID references inside source markdown content. */
export function patchSourceKrcId(
  content: string,
  oldKrcId: string,
  newKrcId: string,
  repairNote: string,
): string {
  let updated = content;
  const escapedOld = oldKrcId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const titleMatch = content.match(new RegExp(`^#\\s*${escapedOld}\\s*[—–-]\\s*(.+)$`, 'm'));
  if (titleMatch) {
    updated = updated.replace(
      new RegExp(`^#\\s*${escapedOld}\\s*[—–-]\\s*.+$`, 'm'),
      `# ${newKrcId} — ${titleMatch[1].trim()}`,
    );
  }

  if (updated.includes('## Source ID')) {
    updated = updated.replace(
      new RegExp(`(## Source ID\\s*\\n)${escapedOld}`, 'i'),
      `$1${newKrcId}`,
    );
  }

  if (!updated.includes('## KAE Repair Provenance')) {
    updated = `${updated.trimEnd()}\n\n## KAE Repair Provenance\n${repairNote}\n`;
  }

  return updated;
}
