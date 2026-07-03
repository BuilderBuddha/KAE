import type { LiveCaptureInput, LiveCaptureSourceKind } from '@scooper/core';
import type { ParsedTranscriptMessage } from './parse-transcript.js';

function sourceKindLabel(kind: LiveCaptureSourceKind): string {
  switch (kind) {
    case 'chatgpt':
      return 'ChatGPT live capture';
    case 'cursor':
      return 'Cursor live capture';
    default:
      return 'Pasted transcript capture';
  }
}

export function buildLiveCaptureSourceMarkdown(
  krcId: string,
  title: string,
  input: LiveCaptureInput,
  messages: ParsedTranscriptMessage[],
): string {
  const now = new Date().toISOString();
  const conversationId = `live-${Date.now()}`;
  const transcriptBlocks = messages.map((message) => {
    const heading = message.role === 'assistant' ? 'Assistant' : message.role === 'system' ? 'System' : 'User';
    return `### ${heading}\n*${now}*\n\n${message.text.trim()}`;
  });

  return [
    `# ${krcId} — ${title}`,
    '',
    '## Status',
    'Inventoried',
    '',
    '## Description',
    `${sourceKindLabel(input.sourceKind)} acquired by KAE.`,
    input.campaign ? `Campaign: ${input.campaign}` : '',
    '',
    '## Topic',
    sourceKindLabel(input.sourceKind),
    '',
    '## Primary Product',
    'Axiom',
    '',
    '## ChatGPT Conversation ID',
    conversationId,
    '',
    '## Create Time',
    now,
    '',
    '## Update Time',
    now,
    '',
    '## Notes',
    input.notes?.trim() || 'Captured via KAE live session capture.',
    '',
    '## Transcript',
    '',
    transcriptBlocks.join('\n\n'),
  ]
    .filter((line) => line !== '')
    .join('\n');
}

export function buildLiveCaptureExecutiveSessionMarkdown(
  krcId: string,
  title: string,
  sourceRelativePath: string,
  input: LiveCaptureInput,
  messages: ParsedTranscriptMessage[],
): string {
  const summary = messages
    .slice(0, 4)
    .map((message) => `- **${message.role}:** ${message.text.slice(0, 200)}`)
    .join('\n');

  return [
    `# Executive Session Record — ${title}`,
    '',
    '## Source ID',
    krcId,
    '',
    '## Session Date',
    new Date().toISOString(),
    '',
    '## Classification',
    `- Primary: live-capture`,
    `- Source kind: ${input.sourceKind}`,
    input.campaign ? `- Campaign: ${input.campaign}` : '',
    '',
    '## Session Summary',
    summary || 'Live session captured into KAE.',
    '',
    '## Action / Follow-up',
    'Review captured session and continue work in Vigsy.',
    '',
    '## Transcript Reference',
    sourceRelativePath,
    '',
    '## Notes',
    `Auto-maintained by KAE live session capture on ${new Date().toISOString().slice(0, 10)}.`,
  ]
    .filter((line) => line !== '')
    .join('\n');
}
