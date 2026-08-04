/**
 * Phase 3.1 — conversation-turn preservation for governed Executive Brief.
 * Proves prepare appends a transition without replacing the grounded answer.
 */
import { readFileSync, mkdtempSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { evidenceFingerprint } from '@scooper/ai-orchestration';
import {
  isExecutiveBriefRequest,
  prepareExecutiveBriefTask,
  reviseExecutiveBriefTask,
  markExecutiveBriefRevisionRequested,
  cancelExecutiveBriefTask,
  writeApprovedExecutiveBrief,
  resolveExecutiveBriefSourceAnswer,
} from '@scooper/repository-engine';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const PREPARED = 'I prepared the Executive Brief for your review.';
const REVISED = 'I revised the Executive Brief for your review.';
const ALREADY_READY =
  'An Executive Brief is already ready for review. Approve it, request a revision, or cancel it before creating another.';

function isTransition(text) {
  const t = (text ?? '').trim();
  return t === PREPARED || t === REVISED || t === ALREADY_READY;
}

/** Mirrors apps/desktop/src/utils/kayd-executive-brief-presentation.ts */
function selectConversationFlowTurns(turns) {
  if (turns.length === 0) return [];
  let latestAssistantIndex = -1;
  for (let index = turns.length - 1; index >= 0; index -= 1) {
    if (turns[index]?.role === 'assistant') {
      latestAssistantIndex = index;
      break;
    }
  }
  if (latestAssistantIndex < 0) return turns.slice(-1);
  const latestAssistant = turns[latestAssistantIndex];
  const taskUser =
    latestAssistantIndex > 0 && turns[latestAssistantIndex - 1]?.role === 'user'
      ? turns[latestAssistantIndex - 1]
      : null;
  if (!isTransition(latestAssistant.text) || latestAssistant.answer) {
    return [latestAssistant];
  }
  let cursor = taskUser ? latestAssistantIndex - 2 : latestAssistantIndex - 1;
  while (cursor >= 0) {
    const candidate = turns[cursor];
    if (
      candidate.role === 'assistant' &&
      candidate.answer &&
      !isTransition(candidate.text)
    ) {
      const groundedUser =
        cursor > 0 && turns[cursor - 1]?.role === 'user' ? turns[cursor - 1] : null;
      return [groundedUser, candidate, taskUser, latestAssistant].filter(Boolean);
    }
    cursor -= 1;
  }
  return [taskUser, latestAssistant].filter(Boolean);
}

function sampleAnswer(overrides = {}) {
  return {
    question: 'What happened with ChatGPT Import?',
    intent: 'general',
    searchQuery: 'ChatGPT Import',
    directAnswer:
      'ChatGPT Import landed with searchable media evidence.\n\nWhy it matters — decisions can now cite import records.',
    reasonedSummary: 'Grounded in indexed import evidence.',
    evidenceUsed: [
      {
        recordId: 'krc-real-001',
        label: 'ChatGPT Import',
        excerpt: 'Import completed with media attachments validated.',
        kind: 'decision',
        explorerPath: 'Knowledge/Decisions/import.md',
        krcId: 'KRC-0122',
      },
    ],
    confidence: { level: 'high', score: 88, rationale: 'Multiple corroborating records.' },
    timeline: [],
    relatedSources: [],
    attachments: [],
    explorerLinks: [],
    ...overrides,
  };
}

async function main() {
  console.log('Phase 3.1 Executive Brief conversation-turn preservation');

  const repoRoot = join(import.meta.dirname, '../../..');
  const presentationSrc = readFileSync(
    join(repoRoot, 'apps/desktop/src/utils/kayd-executive-brief-presentation.ts'),
    'utf8',
  );
  assert(presentationSrc.includes('selectConversationFlowTurns'), 'helper exported in presentation util');
  assert(presentationSrc.includes(PREPARED), 'prepared transition constant');
  assert(presentationSrc.includes(ALREADY_READY), 'already-ready message constant');

  const groundedUser = {
    id: 'u1',
    role: 'user',
    text: 'What happened with ChatGPT Import?',
  };
  const groundedAssistant = {
    id: 'a1',
    role: 'assistant',
    text: 'ChatGPT Import landed with searchable media evidence.',
    answer: sampleAnswer(),
  };
  const taskUser = {
    id: 'u2',
    role: 'user',
    text: 'Prepare an executive brief from this investigation.',
  };
  const taskAssistant = {
    id: 'a2',
    role: 'assistant',
    text: PREPARED,
  };

  const visible = selectConversationFlowTurns([
    groundedUser,
    groundedAssistant,
    taskUser,
    taskAssistant,
  ]);
  assert(visible.some((t) => t.id === 'u1'), 'original user question remains');
  assert(visible.some((t) => t.id === 'a1'), 'original grounded answer remains');
  assert(visible.some((t) => t.id === 'u2'), 'task request remains');
  assert(visible.some((t) => t.id === 'a2'), 'concise task transition appended');
  assert(
    visible.filter((t) => t.role === 'assistant' && t.answer).length === 1,
    'no duplicate full answer',
  );
  assert(visible.map((t) => t.id).join(',') === 'u1,a1,u2,a2', 'append order preserved');
  console.log('PASS prepare appends transition; prior Q&A preserved');

  const ordinary = selectConversationFlowTurns([
    groundedUser,
    groundedAssistant,
    { id: 'u3', role: 'user', text: 'What should I do next?' },
    {
      id: 'a3',
      role: 'assistant',
      text: 'Review the strongest import source.',
      answer: sampleAnswer(),
    },
  ]);
  assert(ordinary.length === 1 && ordinary[0].id === 'a3', 'ordinary follow-up remains latest-only');
  console.log('PASS ordinary follow-up remains single-pane');

  const revisedVisible = selectConversationFlowTurns([
    groundedUser,
    groundedAssistant,
    taskUser,
    taskAssistant,
    { id: 'u4', role: 'user', text: 'Make the conclusion shorter and keep the same evidence.' },
    { id: 'a4', role: 'assistant', text: REVISED },
  ]);
  assert(revisedVisible.some((t) => t.id === 'a1'), 'revision preserves earlier grounded answer');
  assert(revisedVisible.some((t) => t.id === 'u4'), 'revision instruction preserved');
  assert(revisedVisible.some((t) => t.id === 'a4'), 'revision transition appended');
  console.log('PASS revision preserves earlier turns');

  const investigation = sampleAnswer();
  const fp = evidenceFingerprint(investigation);
  const resolved = resolveExecutiveBriefSourceAnswer({
    briefAnswer: sampleAnswer({
      question: 'Prepare an executive briefing on this investigation.',
      intent: 'executive_brief',
      evidenceUsed: [],
      directAnswer: 'Thin brief-path prose.',
    }),
    investigationAnswer: investigation,
  });
  assert(resolved.ok, 'investigation evidence available');
  const task = prepareExecutiveBriefTask({
    conversationId: 'conv-turns',
    topic: 'ChatGPT Import',
    answer: resolved.answer,
  });
  assert(task.evidence.fingerprint === fp, 'fingerprint frozen');
  const revised = reviseExecutiveBriefTask(markExecutiveBriefRevisionRequested(task), {
    taskId: task.taskId,
    answer: sampleAnswer({ directAnswer: 'Shorter conclusion.\n\nNext — confirm.' }),
  });
  assert(revised.taskId === task.taskId && revised.evidence.fingerprint === fp, 'revise same identity');
  const cancelled = cancelExecutiveBriefTask(revised);
  assert(cancelled.state === 'cancelled' && !cancelled.writeResult, 'cancel no write');
  const task2 = prepareExecutiveBriefTask({
    conversationId: 'conv-turns',
    topic: 'ChatGPT Import',
    answer: resolved.answer,
  });
  assert(task2.taskId !== cancelled.taskId, 'new taskId after cancel');

  const repo = mkdtempSync(join(tmpdir(), 'kae-eb-turns-'));
  try {
    const saved = await writeApprovedExecutiveBrief(
      task2,
      { taskId: task2.taskId, approvalToken: task2.taskId },
      { repositoryPath: repo },
    );
    assert(saved.state === 'saved-and-registered' && existsSync(saved.writeResult.absolutePath), 'approve once');
    const retry = await writeApprovedExecutiveBrief(
      saved,
      { taskId: saved.taskId, approvalToken: saved.taskId },
      { repositoryPath: repo, priorSuccessfulWrite: saved.writeResult },
    );
    assert(retry.writeResult.relativePath === saved.writeResult.relativePath, 'idempotent');
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
  console.log('PASS revise / cancel / new task / approve once');

  const flowSrc = readFileSync(
    join(repoRoot, 'apps/desktop/src/components/vigsy/KaydConversationFlow.tsx'),
    'utf8',
  );
  const hookSrc = readFileSync(join(repoRoot, 'apps/desktop/src/hooks/useVigsyConversation.ts'), 'utf8');
  assert(flowSrc.includes('selectConversationFlowTurns'), 'flow uses preservation helper');
  assert(flowSrc.includes('data-preserving-prior'), 'preserving prior marked');
  assert(hookSrc.includes('alreadyReadyBrief'), 'parallel prepare blocked');
  assert(hookSrc.includes('EXECUTIVE_BRIEF_ALREADY_READY_MESSAGE'), 'already-ready message wired');
  assert(hookSrc.includes('!activeBrief) setExecutiveBriefTask(null)'), 'failed prepare does not clear active preview');
  assert(!isExecutiveBriefRequest('Keep the answer brief'), 'keep answer brief stays ordinary');
  console.log('PASS source contracts for preservation + already-ready');

  console.log('\nAll Phase 3.1 conversation-turn preservation tests passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
