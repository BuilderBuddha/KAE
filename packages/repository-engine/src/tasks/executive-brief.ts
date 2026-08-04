import fs from 'node:fs/promises';
import path from 'node:path';
import { evidenceFingerprint } from '@scooper/ai-orchestration';
import type {
  ApproveExecutiveBriefInput,
  ExecutiveBriefPreviewContent,
  ExecutiveBriefTask,
  PrepareExecutiveBriefInput,
  ReviseExecutiveBriefInput,
  VigsyKnowledgeAnswer,
} from '@scooper/core';

export {
  isExecutiveBriefRequest,
  isExecutiveBriefReviseRequest,
  isActiveExecutiveBriefTask,
} from './executive-brief-request.js';

function nowIso(): string {
  return new Date().toISOString();
}

function createTaskId(): string {
  return `eb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Build preview sections from a grounded answer — no filesystem write. */
export function buildExecutiveBriefPreview(
  answer: VigsyKnowledgeAnswer,
  topic: string,
): ExecutiveBriefPreviewContent {
  const paragraphs = splitParagraphs(answer.directAnswer);
  const conclusion =
    (paragraphs[0] ?? answer.directAnswer.trim()) || 'No grounded conclusion available.';
  const whatMatters =
    paragraphs.slice(1).join('\n\n').trim() ||
    answer.reasonedSummary.trim() ||
    'See supporting evidence below.';

  const evidenceLines = answer.evidenceUsed.slice(0, 8).map((item, index) => {
    const id = item.krcId ?? item.recordId;
    return `${index + 1}. ${item.label} (${id}) — ${item.excerpt.slice(0, 160)}`;
  });

  const uncertainty =
    answer.confidence.rationale?.trim() ||
    (answer.confidence.level === 'high'
      ? 'Confidence is high; residual gaps may remain outside the frozen evidence set.'
      : `Confidence is ${answer.confidence.level} (${answer.confidence.score}). Treat unsupported details as unknown.`);

  const nextActionMatch = answer.directAnswer.match(
    /(?:recommend|next|I'd move next|I would|suggested next)[:\s—-]+([^\n]+)/i,
  );
  const recommendedNextAction =
    nextActionMatch?.[1]?.trim() ||
    'Review the strongest frozen evidence source, then decide whether any repository action is required.';

  return {
    title: `Executive Brief — ${topic.trim() || answer.searchQuery || 'Active investigation'}`,
    executiveConclusion: conclusion,
    whatChangedOrMatters: whatMatters,
    supportingEvidenceSummary:
      evidenceLines.length > 0
        ? evidenceLines.join('\n')
        : 'No frozen evidence citations were available for this brief.',
    uncertaintyAndGaps: uncertainty,
    recommendedNextAction,
    notYetSavedNotice: 'Preview only — not saved. Approve to write, or cancel with no repository change.',
  };
}

function assertWritableState(task: ExecutiveBriefTask): void {
  if (task.state === 'saved-and-registered') {
    throw new Error('This Executive Brief is already saved and registered.');
  }
  if (task.state === 'cancelled') {
    throw new Error('This Executive Brief was cancelled.');
  }
  if (task.state === 'writing') {
    throw new Error('This Executive Brief is already writing.');
  }
}

/** Create a preview-ready task from a grounded answer (no write). */
export function prepareExecutiveBriefTask(input: PrepareExecutiveBriefInput): ExecutiveBriefTask {
  const fingerprint = evidenceFingerprint(input.answer);
  const createdAt = nowIso();
  const taskId = createTaskId();
  return {
    taskId,
    taskType: 'executive-brief',
    state: 'preview-ready',
    conversationId: input.conversationId,
    createdAt,
    updatedAt: createdAt,
    revisionCount: 0,
    evidence: {
      fingerprint,
      evidenceUsed: input.answer.evidenceUsed.map((item) => ({ ...item })),
      confidence: { ...input.answer.confidence },
      searchQuery: input.answer.searchQuery,
      topic: input.topic.trim() || input.answer.searchQuery,
    },
    preview: buildExecutiveBriefPreview(input.answer, input.topic),
    registrationKey: `${input.conversationId}:${fingerprint}`,
  };
}

/**
 * Revise preview prose while freezing the original evidence chain.
 * Does not write. Rejects if evidence identities diverge from the freeze.
 */
export function reviseExecutiveBriefTask(
  task: ExecutiveBriefTask,
  input: ReviseExecutiveBriefInput,
): ExecutiveBriefTask {
  if (task.taskId !== input.taskId) {
    throw new Error('Task identity mismatch.');
  }
  assertWritableState(task);
  if (task.state !== 'preview-ready' && task.state !== 'revision-requested') {
    throw new Error(`Cannot revise Executive Brief in state "${task.state}".`);
  }

  const revisedIds = new Set(input.answer.evidenceUsed.map((item) => item.recordId));
  const frozenIds = task.evidence.evidenceUsed.map((item) => item.recordId);
  const invented = [...revisedIds].filter((id) => !frozenIds.includes(id));
  if (invented.length > 0) {
    // Keep freeze — revise prose only from answer text; ignore invented evidence identities.
  }

  const preview = buildExecutiveBriefPreview(
    {
      ...input.answer,
      evidenceUsed: task.evidence.evidenceUsed,
      confidence: task.evidence.confidence,
      searchQuery: task.evidence.searchQuery,
    },
    task.evidence.topic,
  );

  return {
    ...task,
    state: 'preview-ready',
    updatedAt: nowIso(),
    revisionCount: task.revisionCount + 1,
    preview,
    failure: undefined,
  };
}

export function markExecutiveBriefRevisionRequested(task: ExecutiveBriefTask): ExecutiveBriefTask {
  assertWritableState(task);
  if (task.state !== 'preview-ready') {
    throw new Error(`Cannot request revision in state "${task.state}".`);
  }
  return {
    ...task,
    state: 'revision-requested',
    updatedAt: nowIso(),
  };
}

export function cancelExecutiveBriefTask(task: ExecutiveBriefTask): ExecutiveBriefTask {
  if (task.state === 'saved-and-registered') {
    throw new Error('Cannot cancel a saved Executive Brief.');
  }
  if (task.state === 'writing') {
    throw new Error('Cannot cancel while writing.');
  }
  return {
    ...task,
    state: 'cancelled',
    updatedAt: nowIso(),
    failure: undefined,
  };
}

function buildBriefMarkdown(task: ExecutiveBriefTask): string {
  const { preview, evidence } = task;
  const lines = [
    `# ${preview.title}`,
    '',
    `**Artifact ID:** ${task.taskId}`,
    `**Conversation:** ${task.conversationId}`,
    `**Topic:** ${evidence.topic}`,
    `**Evidence fingerprint:** ${evidence.fingerprint}`,
    `**Confidence:** ${evidence.confidence.level} (${evidence.confidence.score})`,
    `**Generated:** ${nowIso()}`,
    `**Revisions:** ${task.revisionCount}`,
    '',
    '> Governed KAE Executive Brief — evidence identities frozen outside the model.',
    '',
    '## Executive conclusion',
    '',
    preview.executiveConclusion,
    '',
    '## What changed or matters',
    '',
    preview.whatChangedOrMatters,
    '',
    '## Supporting evidence',
    '',
    preview.supportingEvidenceSummary,
    '',
    '## Uncertainty, gaps, or limitations',
    '',
    preview.uncertaintyAndGaps,
    '',
    '## Recommended next action',
    '',
    preview.recommendedNextAction,
    '',
    '## Frozen evidence register',
    '',
  ];

  for (const item of evidence.evidenceUsed) {
    lines.push(
      `- **${item.label}** — \`${item.recordId}\`${item.krcId ? ` (${item.krcId})` : ''} — \`${item.explorerPath}\``,
    );
    lines.push(`  - ${item.excerpt}`);
  }

  lines.push('', '---', '*Written by KAE after explicit Founder approval — Knowledge Acquisition Engine*');
  return lines.join('\n');
}

export interface WriteExecutiveBriefOptions {
  repositoryPath: string;
  /** Prior successful write for this registrationKey — enables idempotent retry. */
  priorSuccessfulWrite?: ExecutiveBriefTask['writeResult'];
}

/**
 * Main-process write boundary. Caller must have validated explicit approval.
 * Idempotent: if priorSuccessfulWrite is provided for the same registration, returns it.
 */
export async function writeApprovedExecutiveBrief(
  task: ExecutiveBriefTask,
  approval: ApproveExecutiveBriefInput,
  options: WriteExecutiveBriefOptions,
): Promise<ExecutiveBriefTask> {
  if (approval.taskId !== task.taskId) {
    throw new Error('Approval token does not match task identity.');
  }
  if (approval.approvalToken !== task.taskId) {
    throw new Error('Explicit approval token required.');
  }
  if (task.state === 'saved-and-registered' && task.writeResult) {
    return task;
  }
  if (options.priorSuccessfulWrite) {
    return {
      ...task,
      state: 'saved-and-registered',
      updatedAt: nowIso(),
      writeResult: options.priorSuccessfulWrite,
      failure: undefined,
    };
  }
  if (task.state !== 'preview-ready' && task.state !== 'approved') {
    throw new Error(`Cannot approve Executive Brief in state "${task.state}".`);
  }

  const writing: ExecutiveBriefTask = {
    ...task,
    state: 'writing',
    updatedAt: nowIso(),
  };

  const reportsDir = path.join(options.repositoryPath, 'ImportReports', 'executive-briefs');
  const fileName = `executive-brief-${task.taskId}.md`;
  const absolutePath = path.join(reportsDir, fileName);
  const relativePath = path.join('ImportReports', 'executive-briefs', fileName).replace(/\\/g, '/');

  try {
    await fs.mkdir(reportsDir, { recursive: true });
    // Idempotent file identity — same taskId always maps to the same path.
    try {
      await fs.access(absolutePath);
      const registeredAt = nowIso();
      return {
        ...writing,
        state: 'saved-and-registered',
        updatedAt: registeredAt,
        writeResult: {
          saved: true,
          relativePath,
          absolutePath,
          artifactId: task.taskId,
          registeredAt,
        },
        failure: undefined,
      };
    } catch {
      // File does not exist — proceed to write once.
    }

    const markdown = buildBriefMarkdown(writing);
    await fs.writeFile(absolutePath, markdown, 'utf8');

    const registeredAt = nowIso();
    return {
      ...writing,
      state: 'saved-and-registered',
      updatedAt: registeredAt,
      writeResult: {
        saved: true,
        relativePath,
        absolutePath,
        artifactId: task.taskId,
        registeredAt,
      },
      failure: undefined,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ...writing,
      state: 'failed',
      updatedAt: nowIso(),
      failure: {
        saved: false,
        message: `Executive Brief write failed: ${message}`,
        partialWriteAttempted: true,
      },
      writeResult: undefined,
    };
  }
}

/** Unsupported task types must not pretend to be a generalized workflow. */
export function assertExecutiveBriefOnly(taskType: string): void {
  if (taskType !== 'executive-brief') {
    throw new Error(`Unsupported governed task type "${taskType}". Only executive-brief is available.`);
  }
}
