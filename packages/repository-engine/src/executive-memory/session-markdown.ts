import fs from 'node:fs/promises';
import path from 'node:path';
import { slugifyTitle } from '@scooper/exporters';
import type { ExecutiveSessionRecord, VigsyConversationRecord } from '@scooper/core';

const VIGSY_CATEGORY = 'KAE';

function vigsyKrcId(conversationId: string): string {
  return `VIGSY-${conversationId.slice(0, 8).toUpperCase()}`;
}

function listSection(title: string, items: { label: string; detail?: string }[]): string[] {
  if (items.length === 0) return [`## ${title}`, '- None recorded yet.', ''];
  return [`## ${title}`, ...items.map((item) => `- ${item.label}${item.detail ? ` (${item.detail})` : ''}`), ''];
}

/** Writes or updates an Executive Session markdown file for a Vigsy conversation. */
export async function writeVigsyExecutiveSessionMarkdown(
  repositoryPath: string,
  session: ExecutiveSessionRecord,
  record: VigsyConversationRecord,
): Promise<string> {
  const krcId = vigsyKrcId(record.conversationId);
  const slug = slugifyTitle(record.title || 'Vigsy_Conversation');
  const fileName = `${krcId}_${slug}_SESSION.md`;
  const relativePath = `ExecutiveSessions/${VIGSY_CATEGORY}/${fileName}`;
  const absolutePath = path.join(repositoryPath, relativePath);
  const transcriptRef = `.kae-sessions/conversations/${record.conversationId}.json`;

  const summaryLines = record.turns
    .filter((turn) => turn.role === 'user' && turn.question)
    .slice(-3)
    .map((turn) => `- **Q:** ${turn.question}`);

  const lastAnswer = [...record.turns].reverse().find((turn) => turn.role === 'assistant');
  if (lastAnswer?.displayText) {
    summaryLines.push(`- **Latest:** ${lastAnswer.displayText.slice(0, 280)}`);
  }

  const lines = [
    `# Executive Session Record — ${record.title}`,
    '',
    '## Source ID',
    krcId,
    '',
    '## Session Date',
    session.updatedAt,
    '',
    '## Classification',
    '- Primary: vigsy-conversation',
    `- Lifecycle: ${session.lifecycle}`,
    `- Campaign: ${session.currentCampaign ?? 'Not set'}`,
    `- Objective: ${session.currentObjective ?? 'Not set'}`,
    '',
    '## Session Summary',
    summaryLines.length > 0 ? summaryLines.join('\n') : 'Active Vigsy conversation session.',
    '',
    ...listSection('Current Decisions', session.currentDecisions),
    ...listSection('Current Blockers', session.currentBlockers),
    ...listSection('Current Accomplishments', session.currentAccomplishments),
    ...listSection('Current Files', session.currentFiles),
    ...listSection('Current Evidence', session.currentEvidence),
    ...listSection('Repository Changes', session.currentRepositoryChanges),
    '## Action / Follow-up',
    session.recommendedNextAction ?? 'Continue the active Vigsy conversation thread.',
    '',
    '## Transcript Reference',
    transcriptRef,
    '',
    '## Notes',
    `Auto-maintained by KAE Continuous Executive Memory on ${new Date().toISOString().slice(0, 10)}.`,
  ];

  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, lines.join('\n'), 'utf8');
  return relativePath;
}
