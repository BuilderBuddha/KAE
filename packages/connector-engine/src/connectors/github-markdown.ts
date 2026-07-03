import type { ParsedDocument } from '@scooper/core';
import type { GitHubItemPayload } from './github-fetch.js';

export function buildGitHubDocument(
  repository: string,
  item: GitHubItemPayload,
): ParsedDocument {
  const sourceKey = `github:${item.id}`;
  const lines = [
    `# ${item.title}`,
    '',
    '## Source',
    'GitHub',
    '',
    '## Repository',
    repository,
    '',
    '## Item Type',
    item.kind,
    '',
    '## URL',
    item.url,
    '',
    '## Updated',
    item.updatedAt ?? 'Unknown',
    '',
    '## Content',
    item.body || 'No content.',
    '',
    '## ChatGPT Conversation ID',
    sourceKey,
  ];

  return {
    id: sourceKey,
    title: item.title,
    content: lines.join('\n'),
    format: 'github',
    metadata: {
      conversationId: sourceKey,
      sourceKey,
      connectorId: 'github',
      repository,
      itemKind: item.kind,
      url: item.url,
      updatedAt: item.updatedAt,
      messageCount: 1,
      ...item.metadata,
    },
  };
}
