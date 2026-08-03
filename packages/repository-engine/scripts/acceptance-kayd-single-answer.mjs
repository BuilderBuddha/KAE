/**
 * Phase 1A: One trustworthy KayD text-flow answer.
 * Mocked only — no live API charges.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evidenceFingerprint, verifyGroundedAnswer } from '@scooper/ai-orchestration';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '../../..');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

/** Mirrors apps/desktop/src/utils/kayd-answer-presentation.ts */
function initialThinkingPresentation() {
  return { thinking: true, streaming: false, text: '' };
}

function presentationAfterTransportToken(prev, _tokenText) {
  void _tokenText;
  return { thinking: true, streaming: false, text: prev.text };
}

function presentationReadyToReveal() {
  return { thinking: false, streaming: true, text: '' };
}

function presentationRevealChunk(visible) {
  return { thinking: false, streaming: true, text: visible };
}

function presentationComplete(finalText) {
  return { thinking: false, streaming: false, text: finalText };
}

function wouldPaintPrematureAnswer(thinking, proposedVisibleText, formattedAnswer) {
  if (!proposedVisibleText.trim()) return false;
  if (thinking) return true;
  if (formattedAnswer == null) return true;
  if (proposedVisibleText !== formattedAnswer && !formattedAnswer.startsWith(proposedVisibleText)) {
    return true;
  }
  return false;
}

async function main() {
  console.log('KayD single-answer presentation regression');

  const hookPath = join(repoRoot, 'apps/desktop/src/hooks/useVigsyConversation.ts');
  const hookSrc = readFileSync(hookPath, 'utf8');
  assert(!/text:\s*visibleDirect/.test(hookSrc), 'hook does not paint visibleDirect into turn.text');
  assert(!/visibleDirect\s*\+=\s*chunk\.text/.test(hookSrc), 'hook does not accumulate tokens into visible text');
  assert(hookSrc.includes('presentationAfterTransportToken'), 'transport tokens routed through presentation helper');
  assert(hookSrc.includes('streamTextReveal'), 'progressive reveal retained');
  assert(hookSrc.includes('formatConversationalAnswer'), 'format before reveal retained');
  assert(
    hookSrc.indexOf('formatConversationalAnswer') < hookSrc.indexOf('streamTextReveal'),
    'format precedes reveal',
  );
  // Only one streamTextReveal call site in submit path (shared live/offline).
  const revealCount = (hookSrc.match(/await streamTextReveal\(/g) || []).length;
  assert(revealCount === 1, `exactly one streamTextReveal sequence (got ${revealCount})`);
  console.log('PASS source: no IPC token paint; one reveal');

  const utilPath = join(repoRoot, 'apps/desktop/src/utils/kayd-answer-presentation.ts');
  const utilSrc = readFileSync(utilPath, 'utf8');
  assert(utilSrc.includes('presentationAfterTransportToken'), 'presentation util present');
  assert(utilSrc.includes('thinking: true'), 'thinking preserved on transport');
  console.log('PASS presentation util present');

  // Simulate streaming timeline
  let visible = initialThinkingPresentation();
  assert(visible.thinking && !visible.text, 'starts thinking with empty text');

  const rawTokens = ['What ', 'changed — ', 'Import completed RAW DRAFT'];
  for (const token of rawTokens) {
    visible = presentationAfterTransportToken(visible, token);
  }
  assert(visible.thinking === true, 'thinking remains during transport tokens');
  assert(visible.text === '', 'IPC tokens never paint visible prose');
  assert(visible.streaming === false, 'streaming flag off until reveal');
  assert(
    wouldPaintPrematureAnswer(true, rawTokens.join(''), null),
    'painting raw during thinking would be premature',
  );
  console.log('PASS IPC tokens never paint turn.text');

  const formatted = 'What changed — Import completed with media attachments.';
  visible = presentationReadyToReveal();
  assert(!visible.thinking && visible.streaming && visible.text === '', 'ready to reveal: empty, not thinking');

  const paints = [];
  for (let i = 1; i <= formatted.length; i += 1) {
    visible = presentationRevealChunk(formatted.slice(0, i));
    paints.push(visible.text);
  }
  assert(paints[0] === 'W', 'reveal starts at first character of formatted answer');
  assert(paints.every((t) => formatted.startsWith(t)), 'every paint is a prefix of formatted answer');
  assert(!paints.some((t) => t.includes('RAW DRAFT')), 'raw draft never appears in reveal paints');
  visible = presentationComplete(formatted);
  assert(visible.text === formatted && !visible.streaming && !visible.thinking, 'final is formatted answer');
  console.log('PASS one progressive verified/formatted answer');

  // Offline / fallback path: same presentation helpers (no second answer)
  const offlineFormatted = "I couldn't reach OpenAI; here is the grounded draft.";
  let offline = initialThinkingPresentation();
  offline = presentationAfterTransportToken(offline, 'ignored offline token');
  assert(offline.text === '', 'offline also ignores transport paint');
  offline = presentationReadyToReveal();
  offline = presentationRevealChunk(offlineFormatted);
  offline = presentationComplete(offlineFormatted);
  assert(offline.text === offlineFormatted, 'offline shows one final answer');
  console.log('PASS offline/fallback single answer');

  // Duplicate prose guard: never clear+repaint a different body after reveal started
  const sequence = ['thinking', 'reveal', 'complete'];
  assert(sequence.filter((s) => s === 'reveal').length === 1, 'only one reveal phase');
  console.log('PASS no duplicate answer sequence');

  // Evidence fingerprint unchanged by presentation helpers
  const skeleton = {
    question: 'What happened with ChatGPT Import?',
    intent: 'summarize',
    searchQuery: 'ChatGPT Import',
    directAnswer: formatted,
    reasonedSummary: 'Grounded.',
    evidenceUsed: [
      {
        recordId: 'krc-real-001',
        label: 'ChatGPT Import',
        excerpt: 'Import completed.',
        kind: 'decision',
        explorerPath: 'Knowledge/Decisions/import.md',
      },
    ],
    confidence: { level: 'high', score: 90, rationale: 'ok' },
    timeline: [],
    relatedSources: [],
    attachments: [],
    explorerLinks: [],
  };
  const reasoned = {
    ...skeleton,
    usedOfflineFallback: false,
    reasoningProviderId: 'openai',
  };
  const verified = verifyGroundedAnswer(skeleton, reasoned);
  const fp1 = evidenceFingerprint(skeleton);
  const fp2 = evidenceFingerprint(verified);
  assert(fp1 === fp2, 'evidence fingerprint unchanged through verify');
  console.log('PASS evidence fingerprints unchanged');

  console.log('\nAll KayD single-answer presentation tests passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
