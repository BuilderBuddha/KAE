import type { ConnectorStatus } from '@scooper/core';

export interface ImportSourceDisplay {
  id: string;
  label: string;
  description: string;
  /** UI-only source with no backend connector yet */
  uiOnly?: boolean;
}

/** Primary knowledge sources — conversation-first import experience. */
export const PRIMARY_KNOWLEDGE_SOURCES: ImportSourceDisplay[] = [
  {
    id: 'chatgpt-export-zip',
    label: 'ChatGPT',
    description: 'Connect conversation exports from ChatGPT.',
  },
  {
    id: 'cursor',
    label: 'Cursor',
    description: 'Connect workspace sessions from Cursor.',
  },
  {
    id: 'claude',
    label: 'Claude',
    description: 'Connect conversation exports from Claude.',
  },
  {
    id: 'github',
    label: 'GitHub',
    description: 'Connect repositories and markdown from GitHub.',
  },
  {
    id: 'youtube',
    label: 'YouTube',
    description: 'Connect videos and transcripts from YouTube.',
  },
  {
    id: 'steam',
    label: 'Steam',
    description: 'Connect game library and session notes from Steam.',
    uiOnly: true,
  },
  {
    id: 'local-folder',
    label: 'Local Folder',
    description: 'Connect files from a folder on this machine.',
  },
];

export const ADVANCED_IMPORTER_IDS = new Set([
  'pdf',
  'markdown',
  'html',
  'docx',
  'txt',
]);

export function sourceBadge(
  source: ImportSourceDisplay,
  connector?: ConnectorStatus,
): 'ready' | 'connected' | 'stub' {
  if (source.uiOnly) return 'stub';
  if (!connector) return 'stub';
  if (connector.implementationStatus === 'full') {
    return connector.config.connected ? 'connected' : 'ready';
  }
  return 'stub';
}

export function badgeLabel(kind: ReturnType<typeof sourceBadge>): string {
  switch (kind) {
    case 'connected':
      return 'Connected';
    case 'ready':
      return 'Ready';
    default:
      return 'Coming soon';
  }
}
