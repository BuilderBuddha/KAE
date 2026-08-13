/**
 * KayD conversation activation/lifecycle — persist-layer acceptance.
 * Covers ensureActive single-flight, remount restore, New Conversation identity,
 * submit pinning discard semantics (simulated), and prior-file integrity.
 * Fixture temp dir only — no durable Axiom-Knowledge mutation.
 */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  createNewVigsyConversation,
  ensureActiveVigsyConversation,
  loadActiveConversationState,
  loadActiveVigsyConversation,
  loadVigsyConversation,
  saveVigsyConversation,
} from '@scooper/repository-engine';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function countConversationFiles(repositoryPath) {
  const dir = path.join(repositoryPath, '.kae-sessions', 'conversations');
  try {
    const names = await fs.readdir(dir);
    return names.filter((name) => name.endsWith('.json') && name !== 'active.json').length;
  } catch {
    return 0;
  }
}

async function main() {
  const repositoryPath = await fs.mkdtemp(path.join(os.tmpdir(), 'kae-conv-lifecycle-'));
  console.log('KayD conversation lifecycle acceptance');
  console.log(`Fixture: ${repositoryPath}`);

  // 1 Cold start — exactly one conversation
  const first = await ensureActiveVigsyConversation(repositoryPath);
  assert(first?.conversationId, '1 created id');
  assert((await countConversationFiles(repositoryPath)) === 1, '1 exactly one file');
  const active1 = await loadActiveConversationState(repositoryPath);
  assert(active1?.conversationId === first.conversationId, '1 active.json matches');

  // 2 StrictMode twin ensure — no second empty record
  const [a, b, c] = await Promise.all([
    ensureActiveVigsyConversation(repositoryPath),
    ensureActiveVigsyConversation(repositoryPath),
    ensureActiveVigsyConversation(repositoryPath),
  ]);
  assert(a.conversationId === first.conversationId, '2 shared id a');
  assert(b.conversationId === first.conversationId, '2 shared id b');
  assert(c.conversationId === first.conversationId, '2 shared id c');
  assert((await countConversationFiles(repositoryPath)) === 1, '2 still one file after concurrent ensure');

  // 3 New Conversation — one new ID; active + load agree
  const priorId = first.conversationId;
  const created = await createNewVigsyConversation(repositoryPath);
  assert(created.conversationId !== priorId, '3 new id differs');
  const active3 = await loadActiveConversationState(repositoryPath);
  assert(active3?.conversationId === created.conversationId, '3 active.json is new id');
  const loaded3 = await loadActiveVigsyConversation(repositoryPath);
  assert(loaded3?.conversationId === created.conversationId, '3 loadActive matches UI/recordRef contract');
  assert(loaded3?.turns?.length === 0, '3 new conversation empty');

  // 4 First question persists only under that ID
  const withTurn = {
    ...created,
    updatedAt: new Date().toISOString(),
    title: 'what projects are related to krc-0152',
    turns: [
      {
        turnId: 'turn-1',
        role: 'user',
        createdAt: new Date().toISOString(),
        question: 'what projects are related to krc-0152',
        displayText: 'what projects are related to krc-0152',
      },
      {
        turnId: 'turn-2',
        role: 'assistant',
        createdAt: new Date().toISOString(),
        displayText: 'No governed project relationship is established for KRC-0152.',
        answer: {
          question: 'what projects are related to krc-0152',
          intent: 'project_topic',
          searchQuery: 'projects related',
          directAnswer: 'No governed project relationship is established for KRC-0152.',
          reasonedSummary: '',
          evidenceUsed: [],
          confidence: { level: 'medium', score: 50, rationale: 'index' },
          timeline: [],
          relatedSources: [],
          attachments: [],
          explorerLinks: [],
          lockDeterministicProse: true,
        },
      },
    ],
  };
  await saveVigsyConversation(repositoryPath, withTurn);
  const onlyNew = await loadVigsyConversation(repositoryPath, created.conversationId);
  assert(onlyNew?.turns?.length === 2, '4 turns under new id');
  const priorStill = await loadVigsyConversation(repositoryPath, priorId);
  assert(priorStill?.turns?.length === 0, '4 prior empty conversation unchanged');

  // 5 Remount/ensure restores same ID — no extra create
  const beforeCount = await countConversationFiles(repositoryPath);
  const restored = await ensureActiveVigsyConversation(repositoryPath);
  assert(restored.conversationId === created.conversationId, '5 remount restores same id');
  assert(restored.turns.length === 2, '5 turns restored');
  assert((await countConversationFiles(repositoryPath)) === beforeCount, '5 no new file on remount');

  // 6 Prior conversations remain intact after another New Conversation
  const newer = await createNewVigsyConversation(repositoryPath);
  assert(newer.conversationId !== created.conversationId, '6 another new id');
  const preserved = await loadVigsyConversation(repositoryPath, created.conversationId);
  assert(preserved?.turns?.length === 2, '6 prior conversation file intact');
  const preservedEmpty = await loadVigsyConversation(repositoryPath, priorId);
  assert(preservedEmpty?.conversationId === priorId, '6 original empty file intact');

  // 7 In-flight discard semantics: completing answer must not write into the *new* active
  //    when pinned identity is the previous conversation (simulate abort/switch).
  const pinnedId = created.conversationId;
  const activeAfterNew = await loadActiveConversationState(repositoryPath);
  assert(activeAfterNew?.conversationId === newer.conversationId, '7 active is newer');
  // Simulate pinned persist targeting old id only — new record stays empty.
  const spoofComplete = {
    ...preserved,
    updatedAt: new Date().toISOString(),
    turns: [
      ...preserved.turns,
      {
        turnId: 'turn-3',
        role: 'user',
        createdAt: new Date().toISOString(),
        question: 'stale in-flight',
        displayText: 'stale in-flight',
      },
    ],
  };
  // Correct behavior when discarded: do NOT save into newer. Saving into pinned is allowed
  // only when submission not discarded; when New Conversation wins, UI discards — verify newer empty.
  assert((await loadVigsyConversation(repositoryPath, newer.conversationId))?.turns?.length === 0, '7 new record empty before');
  // If a bug redirected writes to active (newer), this would pollute newer — ensure save to pinned only.
  await saveVigsyConversation(repositoryPath, spoofComplete);
  assert(
    (await loadVigsyConversation(repositoryPath, newer.conversationId))?.turns?.length === 0,
    '7 save to pinned id does not imply writes on newer — newer still empty',
  );
  assert(
    (await loadVigsyConversation(repositoryPath, pinnedId))?.turns?.length === 3,
    '7 pinned record received explicit save (pin contract)',
  );
  // Restore active to newer for cleanliness of later asserts
  await saveVigsyConversation(repositoryPath, newer);

  // 8 Same-thread continuity: ensureActive keeps turns (context available to next submit)
  await saveVigsyConversation(repositoryPath, {
    ...newer,
    turns: [
      {
        turnId: 't1',
        role: 'user',
        createdAt: new Date().toISOString(),
        question: 'Show source KRC-0152',
        displayText: 'Show source KRC-0152',
      },
      {
        turnId: 't2',
        role: 'assistant',
        createdAt: new Date().toISOString(),
        displayText: 'KRC-0152 metadata-only',
        followUpContext: {
          lastQuestion: 'Show source KRC-0152',
          lastSearchQuery: 'KRC-0152',
          lastKrcIds: ['KRC-0152'],
        },
      },
    ],
  });
  const sameThread = await ensureActiveVigsyConversation(repositoryPath);
  assert(sameThread.turns.length === 2, '8 same-thread turns retained');
  assert(
    sameThread.turns.some((t) => t.followUpContext?.lastKrcIds?.includes('KRC-0152')),
    '8 follow-up context retained for continuity',
  );

  // 9 Fresh conversation — no prior turns / no inherited assistant context
  const fresh = await createNewVigsyConversation(repositoryPath);
  assert(fresh.turns.length === 0, '9 fresh has no turns');
  assert(!(await loadActiveVigsyConversation(repositoryPath))?.turns?.some((t) => t.role === 'assistant'), '9 no assistant steering in fresh');

  // 10 Identity triad after ensure: active.json == loaded record
  const triad = await ensureActiveVigsyConversation(repositoryPath);
  const activeTriad = await loadActiveConversationState(repositoryPath);
  assert(activeTriad?.conversationId === triad.conversationId, '10 active.json == record');

  console.log('All KayD conversation lifecycle acceptance tests passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
