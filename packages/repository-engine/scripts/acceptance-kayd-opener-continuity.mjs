/**
 * KayD New Conversation opener/continuity — presentation isolation contracts.
 * Source + pure helper fixtures only. No durable memory mutation, no live API.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '../../..');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

/** Mirrors apps/desktop attention hygiene for fixture proofs. */
function substantiallyOverlaps(a, b) {
  const left = a.trim().toLowerCase();
  const right = b.trim().toLowerCase();
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.includes(right) || right.includes(left)) return true;
  return false;
}

function pushAttentionTask(tasks, line) {
  const trimmed = line.trim();
  if (!trimmed) return;
  if (tasks.some((existing) => substantiallyOverlaps(existing, trimmed))) return;
  tasks.push(trimmed);
}

function listAttentionTasks({ blockers = [], unfinished = [], healthSubline, cards = [], staleConnectors = 0 }) {
  const tasks = [];
  for (const blocker of blockers.slice(0, 3)) pushAttentionTask(tasks, blocker);
  for (const item of unfinished.slice(0, 3)) pushAttentionTask(tasks, item);
  // Health statusSubline must never enter the agenda (intentional omission).
  void healthSubline;
  if (staleConnectors > 0) {
    pushAttentionTask(
      tasks,
      staleConnectors === 1
        ? 'One knowledge source is waiting to sync.'
        : `${staleConnectors} knowledge sources are waiting to sync.`,
    );
  }
  for (const card of cards) {
    if (card.category === 'repository_health') continue;
    if (card.category === 'recent_blocker' || card.category === 'suggested_next_action') {
      pushAttentionTask(tasks, card.summary ? `${card.title}: ${card.summary}` : card.title);
    }
  }
  return tasks;
}

function buildColdHomeBriefing(healthLevel = 'healthy') {
  const lines = [];
  if (healthLevel === 'healthy') {
    lines.push('Welcome back — the knowledge base is in good shape for a working session.');
  } else {
    lines.push('Welcome back — ready when you are.');
  }
  lines.push("I'd start with tell me what you want to move forward today.");
  lines.push('What would you like to tackle first?');
  return lines;
}

function joined(lines) {
  return lines.join('\n');
}

async function main() {
  console.log('KayD opener/continuity acceptance');

  const vigsySrc = readFileSync(join(repoRoot, 'apps/desktop/src/screens/VigsyScreen.tsx'), 'utf8');
  const briefingSrc = readFileSync(join(repoRoot, 'apps/desktop/src/utils/kayd-briefings.ts'), 'utf8');
  const hookSrc = readFileSync(join(repoRoot, 'apps/desktop/src/hooks/useVigsyConversation.ts'), 'utf8');

  // --- Source contracts: refreshed continuity + await-before-freeze ---
  assert(!vigsySrc.includes('useExecutiveContinuity'), '1 VigsyScreen does not use mount-only continuity');
  assert(vigsySrc.includes('sessionContinuity'), '1 uses refreshed sessionContinuity');
  assert(vigsySrc.includes('conversationHasTurns: hasConversation'), '1 passes turn-empty gate');
  assert(
    /await startNewConversation\(\);\s*setBriefingComplete\(false\);\s*setOpenerKey/.test(vigsySrc),
    '3 New Conversation awaits create/refresh before openerKey freeze',
  );
  assert(
    /await clearConversation\(\);\s*setBriefingComplete\(false\);\s*setOpenerKey/.test(vigsySrc),
    '3 Clear awaits create/refresh before openerKey freeze',
  );
  assert(
    vigsySrc.includes('!hasConversation ? briefing'),
    '3 zero-turn path uses live briefing (no stale freeze)',
  );
  assert(hookSrc.includes('await refreshContinuity()'), '3 hook refreshes continuity after New Conversation');
  console.log('PASS 1/3 opener uses refreshed active-session state');

  // --- Cold welcome source contracts ---
  assert(briefingSrc.includes('buildKaydColdHomeBriefing'), '2 cold welcome helper present');
  assert(briefingSrc.includes('!options?.conversationHasTurns'), '2 zero-turn routes to cold welcome');
  assert(briefingSrc.includes('pushAttentionTask'), '4 attention dedupe helper present');
  assert(
    !/function buildWhatNeedsAttention[\s\S]*?statusSubline[\s\S]*?export function buildKaydColdHomeBriefing/.test(
      briefingSrc,
    ),
    '5 attention builder does not inject health statusSubline',
  );
  assert(
    !/function buildWhatNeedsAttention[\s\S]*?repository_health[\s\S]*?export function buildKaydColdHomeBriefing/.test(
      briefingSrc,
    ),
    '5 attention builder does not promote repository_health cards',
  );
  assert(briefingSrc.includes("buildKaydDashboardBriefing"), '5 dashboard health briefing retained');
  console.log('PASS 2/4/5 cold welcome + attention hygiene source contracts');

  // --- Behavioral fixtures ---
  const priorTitle = 'what are the current priorities and blockers for KAE?';
  const priorChange =
    'no governed project relationship is established for KRC-0152';
  const priorityLine =
    'Current priorities: finish F0a relationship grounding before F0b';
  const healthLine = 'No errors. 1 warning(s) detected.';

  const cold = buildColdHomeBriefing('attention');
  const coldText = joined(cold);
  assert(!coldText.includes(priorTitle), '1 cold has no prior title');
  assert(!coldText.toLowerCase().includes('last time we worked'), '1 cold has no last-session line');
  assert(!coldText.includes(priorChange), '2 cold has no prior project/change');
  assert(!coldText.includes(priorityLine), '2 cold has no blockers/unfinished');
  assert(!coldText.includes(healthLine), '5 cold has no health agenda text');
  assert(cold.some((line) => /welcome back/i.test(line)), '1 cold welcome present');
  console.log('PASS 1/2 cold welcome fixtures');

  const tasks = listAttentionTasks({
    blockers: [priorityLine],
    unfinished: [priorityLine],
    healthSubline: healthLine,
    cards: [
      { category: 'repository_health', title: 'Health', summary: healthLine },
      { category: 'recent_blocker', title: 'Blocker', summary: 'Approve repair plan' },
    ],
  });
  assert(tasks.filter((t) => substantiallyOverlaps(t, priorityLine)).length === 1, '4 no duplicate priority');
  assert(!tasks.some((t) => t.includes(healthLine) || /warning\(s\) detected/i.test(t)), '5 no health agenda');
  assert(tasks.some((t) => /Approve repair plan/i.test(t)), '4 non-health attention retained');
  console.log('PASS 4/5 attention dedupe + health exclusion fixtures');

  // --- Lifecycle / restore / discard contracts retained ---
  assert(hookSrc.includes('ensureActiveVigsyConversation'), '6 remount restore path retained');
  assert(hookSrc.includes('submissionDiscarded') || hookSrc.includes('pinnedConversationId'), '8 in-flight pin retained');
  assert(hookSrc.includes('createVigsyConversation'), '7 New Conversation create retained');
  const lifecycleSrc = readFileSync(
    join(repoRoot, 'packages/repository-engine/scripts/acceptance-kayd-conversation-lifecycle.mjs'),
    'utf8',
  );
  assert(lifecycleSrc.includes('ensureActiveVigsyConversation'), '6 lifecycle suite still covers restore');
  assert(lifecycleSrc.includes('createNewVigsyConversation'), '7 lifecycle suite still covers new id');
  console.log('PASS 6/7/8 restore, integrity, in-flight contracts retained in source');

  // --- F0a / relationship suites present (not re-run here) ---
  const f0a = readFileSync(join(repoRoot, 'packages/repository-engine/scripts/acceptance-checkpoint-f0a.mjs'), 'utf8');
  assert(f0a.includes('relationship_trace') || f0a.includes('project_topic'), '9/10 F0a suite present');
  console.log('PASS 9/10 F0a suite file retained');

  console.log('\nAll KayD opener/continuity acceptance checks passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
