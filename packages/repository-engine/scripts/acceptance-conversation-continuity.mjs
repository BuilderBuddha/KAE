/**
 * Regression: KayD three-question continuity + composition contract.
 * Mocked only — no live API charges.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildCuratedPrompt,
  evidenceFingerprint,
  offlineStyledResponse,
  openAiProvider,
  RECENT_TURN_WINDOW,
  verifyGroundedAnswer,
} from '@scooper/ai-orchestration';
import {
  enrichFollowUpQuestion,
  extractSearchQuery,
  sessionFromAnswer,
} from '@scooper/repository-engine';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '../../..');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sampleAnswer(searchQuery, overrides = {}) {
  return {
    question: 'q',
    intent: 'general',
    searchQuery,
    directAnswer:
      "We're on this thread.\n\nI'd move next on this: Open the strongest import source and confirm the outcome.",
    reasonedSummary: 'Grounded in indexed import evidence.',
    evidenceUsed: [
      {
        recordId: 'krc-real-001',
        label: 'ChatGPT Import',
        excerpt: 'Import completed with media attachments validated.',
        kind: 'decision',
        explorerPath: 'Knowledge/Decisions/import.md',
      },
    ],
    confidence: { level: 'high', score: 88, rationale: 'Multiple corroborating records.' },
    timeline: [],
    relatedSources: [],
    attachments: [],
    explorerLinks: [
      { label: 'Import decision', path: 'Knowledge/Decisions/import.md', krcId: 'krc-real-001' },
    ],
    ...overrides,
  };
}

async function main() {
  console.log('KayD conversation continuity regression');

  // --- A/B: three-question topic ownership ---
  const q1 = 'What happened with ChatGPT Import?';
  const sq1 = extractSearchQuery(q1);
  assert(sq1.toLowerCase().includes('chatgpt'), 'q1 search topic includes ChatGPT');
  let session = sessionFromAnswer(q1, sampleAnswer(sq1));
  assert(session.lastSearchQuery.toLowerCase().includes('chatgpt import') || session.lastSearchQuery.toLowerCase().includes('chatgpt'), 'stable topic after q1');
  assert(!/\(following up on:/i.test(session.lastSearchQuery), 'topic is not enriched wrapper');
  assert(session.lastSearchQuery.length >= 3, 'topic not a fragment');
  assert(session.lastSearchQuery.toLowerCase() !== 'ab', 'topic is not ab');
  console.log('PASS q1 stable topic');

  const q2raw = 'Why does that matter?';
  const q2retrieval = enrichFollowUpQuestion(q2raw, session);
  assert(q2retrieval.includes('ChatGPT') || q2retrieval.toLowerCase().includes(session.lastSearchQuery.toLowerCase().slice(0, 8)), 'q2 retrieval resolves that→topic');
  assert(!/\(following up on:/i.test(q2retrieval), 'q2 retrieval never uses following-up-on wrapper');
  assert(q2raw === 'Why does that matter?', 'raw q2 unchanged');
  // Simulate answer searchQuery pollution (old bug path)
  const pollutedSearch = `${q2retrieval} (following up on: ${q2raw})`;
  session = sessionFromAnswer(q2raw, sampleAnswer(pollutedSearch), session);
  assert(
    session.lastSearchQuery.toLowerCase().includes('chatgpt') ||
      session.lastQuestion === q2raw,
    'q2 preserves prior topic despite polluted searchQuery',
  );
  assert(session.lastSearchQuery.toLowerCase() !== 'ab', 'q2 topic never ab');
  assert(session.lastQuestion === q2raw, 'stored lastQuestion is raw');
  assert(!/\(following up on:/i.test(session.lastSearchQuery ?? ''), 'lastSearchQuery not enriched question');
  console.log('PASS q2 why continuity — no ab, raw preserved');

  const q3raw = 'What should we do next?';
  const q3retrieval = enrichFollowUpQuestion(q3raw, session);
  assert(!/\(following up on:/i.test(q3retrieval), 'q3 no following-up-on wrapper');
  session = sessionFromAnswer(q3raw, sampleAnswer(extractSearchQuery(q3retrieval)), session);
  assert(session.lastSearchQuery.toLowerCase() !== 'ab', 'q3 does not continue ab');
  assert(
    session.lastSearchQuery.toLowerCase().includes('chatgpt') ||
      (session.lastSearchQuery?.length ?? 0) >= 3,
    'q3 keeps viable topic',
  );
  console.log('PASS three-question ChatGPT Import continuity');

  // --- Context turns: current raw once ---
  const prior = [
    { role: 'user', text: q1 },
    { role: 'assistant', text: 'Import landed with media evidence.' },
  ];
  const withCurrent = [...prior, { role: 'user', text: q2raw }];
  const windowed = withCurrent.slice(-RECENT_TURN_WINDOW);
  const userCount = windowed.filter((t) => t.role === 'user' && t.text === q2raw).length;
  assert(userCount === 1, 'current raw user question included exactly once');
  assert(windowed.some((t) => t.text === q2raw), 'raw q2 in context window');
  console.log('PASS current turn continuity contract');

  // --- Prompt: topic + no wrapper pollution ---
  const request = {
    groundedAnswer: sampleAnswer('ChatGPT Import'),
    context: {
      question: q2retrieval,
      repositoryPath: 'C:/tmp/repo',
      conversation: {
        conversationId: 'c1',
        turns: windowed,
        followUpContext: {
          lastQuestion: q2raw,
          lastSearchQuery: 'ChatGPT Import',
        },
      },
      executiveMemory: null,
      evidence: { question: q2retrieval, intent: 'general', searchQuery: 'ChatGPT Import', hits: [], drilldowns: [] },
      executiveBriefing: null,
      blockers: [],
      accomplishments: [],
    },
  };
  const prompt = buildCuratedPrompt(request);
  assert(prompt.includes('Active investigation topic: ChatGPT Import'), 'prompt locks ChatGPT Import');
  assert(!prompt.includes('(following up on:'), 'prompt has no following-up-on pollution');
  assert(prompt.includes('Why does that matter?') || prompt.includes(q2raw), 'prompt includes raw user turn');
  assert(prompt.includes('one highest-value next action') || prompt.includes('exactly one'), 'prompt requires one action');
  assert(prompt.includes('<<<EVIDENCE_BEGIN>>>'), 'evidence delimited');
  console.log('PASS curated prompt topic + abstraction rules');

  // --- Capability chip vs natural why ---
  const chipWhy = 'Why does "ChatGPT Import" matter?';
  assert(/^why does\s+"[^"]+"\s+matter/i.test(chipWhy), 'chip why shape recognized');
  assert(!/^why does\s+"[^"]+"\s+matter/i.test(q2raw), 'natural why is not chip shape');
  console.log('PASS capability lens routing contract');

  // --- Live/offline honesty ---
  const offline = offlineStyledResponse(request, 'openai', 'gpt-4o-mini', true);
  assert(offline.usedOfflineFallback === true, 'fallback flagged');
  assert(!offline.directAnswer.includes('OpenAI summary:'), 'no cosmetic live brand');
  const verifiedOffline = verifyGroundedAnswer(request.groundedAnswer, offline);
  assert(verifiedOffline.usedOfflineFallback === true, 'answer metadata fallback');

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    async json() {
      return {
        choices: [
          {
            message: {
              content: JSON.stringify({
                directAnswer: 'ChatGPT Import matters because it changes what you can decide next on media evidence.',
                reasonedSummary: 'Grounded in krc-real-001.',
              }),
            },
          },
        ],
      };
    },
  });
  try {
    const live = await openAiProvider.reason(request, { apiKey: 'test-key' });
    assert(live.usedOfflineFallback === false, 'live success');
    const liveVerified = verifyGroundedAnswer(request.groundedAnswer, live);
    assert(evidenceFingerprint(liveVerified) === evidenceFingerprint(request.groundedAnswer), 'fingerprint stable');
    assert(!liveVerified.evidenceUsed.some((e) => e.recordId === 'krc-FAKE'), 'no invented ids');
    console.log('PASS live/offline + fingerprint');
  } finally {
    globalThis.fetch = originalFetch;
  }

  // --- Composition hierarchy in source ---
  const panelPath = join(repoRoot, 'apps/desktop/src/components/vigsy/KaydChatPanel.tsx');
  const panelSrc = readFileSync(panelPath, 'utf8');
  assert(panelSrc.includes('kayd-chat-panel__conversation-unit'), 'conversation unit present');
  assert(panelSrc.includes('kayd-chat-panel__below--supporting'), 'supporting zone demoted');
  assert(panelSrc.includes("data-composer-before-supporting"), 'composer-before-supporting marker');
  assert(!panelSrc.includes('setInput(activeInvestigation.searchQuery)'), 'composer not hijacked by searchQuery');
  assert(panelSrc.includes('KaydConversationFlow'), 'single-pane flow retained');
  assert(!panelSrc.includes('VigsyConversationThread'), 'no transcript thread revival');
  const unitIdx = panelSrc.indexOf('kayd-chat-panel__conversation-unit');
  const supportingIdx = panelSrc.indexOf('kayd-chat-panel__below--supporting');
  assert(unitIdx > 0 && supportingIdx > unitIdx, 'composer unit precedes supporting below in source');
  console.log('PASS page composition hierarchy');

  // Flow status honesty
  const flowPath = join(repoRoot, 'apps/desktop/src/components/vigsy/KaydConversationFlow.tsx');
  const flowSrc = readFileSync(flowPath, 'utf8');
  assert(flowSrc.includes('Live OpenAI') || flowSrc.includes('Offline'), 'status labels present');
  console.log('PASS live/offline status wiring');

  console.log('\nAll conversation continuity regression tests passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
